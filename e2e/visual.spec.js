import { test, expect } from '@playwright/test';

// Visual-regression coverage for the deterministic gallery at /visual.html.
// Each tile is a fixed-value, animation-free bar, so screenshots are stable.
// This suite is also the guard that the removed leading-edge "peg" stays gone.

test.describe('visual gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/visual.html');
    await expect(page.getByTestId('visual-grid')).toBeVisible();
    // Wait until every tile has mounted a bar.
    await expect(page.locator('[data-tabar]').first()).toBeVisible();
  });

  test('renders the full gallery', async ({ page }) => {
    // Settle layout/fonts before snapshotting.
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('gallery.png', { fullPage: true });
  });

  test('has no leading-edge peg anywhere', async ({ page }) => {
    // The peg element + its class were removed from the library entirely.
    await expect(page.locator('[data-peg-tabar]')).toHaveCount(0);
    await expect(page.locator('.tabar__peg')).toHaveCount(0);
  });

  // A few high-value per-tile shots (cheaper diffs, clearer failures).
  for (const key of ['default', 'gradient', 'stripes', 'segments-stacked', 'ring-gradient', 'bands', 'tooltip', 'glow-strong', 'ring-butt']) {
    test(`tile: ${key}`, async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId(`tile-${key}`)).toHaveScreenshot(`tile-${key}.png`);
    });
  }
});

// Fixed/center positions overlay the viewport, so they get their own page.
test.describe('fixed & center positions', () => {
  for (const pos of ['top', 'bottom', 'left', 'right', 'top-center', 'bottom-center', 'left-center', 'right-center']) {
    test(`position: ${pos}`, async ({ page }) => {
      await page.goto(`/visual-fixed.html?pos=${pos}&len=60%&val=0.7`);
      await expect(page.locator('[data-tabar]')).toBeVisible();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`fixed-${pos}.png`, { fullPage: false });
    });
  }
});
