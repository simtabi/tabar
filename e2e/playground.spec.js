import { test, expect } from '@playwright/test';

// Functional click-through of the playground: every action button is exercised
// and the run must finish with zero console errors. Targeted assertions cover
// the configurator, state changes and the segment APIs. Runs once per project.

test.describe('playground', () => {
  /** @type {string[]} */
  let errors;

  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.goto('/playground.html');
    await expect(page.getByTestId('cfg-host').locator('[data-tabar]')).toBeVisible();
  });

  test('builds the configurator preview and generates code', async ({ page }) => {
    const code = page.getByTestId('cfg-code');
    await expect(code).toContainText('new Tabar({');
    await expect(code).toContainText("position: 'inline'");

    // Changing an option rebuilds the preview and updates the snippet.
    await page.getByTestId('cfg-theme').selectOption('rainbow');
    await expect(code).toContainText("theme: 'rainbow'");
    await expect(page.getByTestId('cfg-host').locator('[data-theme-tabar="rainbow"]')).toBeVisible();

    await page.getByTestId('cfg-shape').selectOption('circular');
    await expect(page.getByTestId('cfg-host').locator('[data-shape-tabar="circular"]')).toBeVisible();
    await expect(page.getByTestId('cfg-host').locator('svg')).toBeVisible();

    // Glow toggle flips the data attribute.
    await page.getByTestId('cfg-shape').selectOption('linear');
    await page.getByTestId('cfg-glow').check();
    await expect(page.getByTestId('cfg-host').locator('[data-glow-tabar="true"]')).toBeVisible();
  });

  test('configurator action buttons drive the preview', async ({ page }) => {
    const host = page.getByTestId('cfg-host');
    await page.click('[data-act="cfg-error"]');
    await expect(host.locator('[data-state-tabar="error"]')).toBeVisible();
    await page.click('[data-act="cfg-succeed"]');
    await expect(host.locator('[data-state-tabar="success"]')).toBeVisible();
    await page.click('[data-act="cfg-ind"]');
    await expect(host.locator('[data-state-tabar="indeterminate"]')).toBeVisible();
    await page.click('[data-act="cfg-reset"]');
    await page.click('[data-act="cfg-hide"]');
    await expect(host.locator('[data-tabar][hidden]')).toBeAttached();
    await page.click('[data-act="cfg-show"]');
    await expect(host.locator('[data-tabar]')).toBeVisible();
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('segment add / remove updates the stacked bar', async ({ page }) => {
    const segHost = page.getByTestId('seg-stacked');
    const before = await segHost.locator('[data-seg-tabar]').count();
    await page.click('[data-act="seg-add"]');
    await expect(segHost.locator('[data-seg-tabar]')).toHaveCount(before + 1);
    await page.click('[data-act="seg-remove"]');
    await expect(segHost.locator('[data-seg-tabar]')).toHaveCount(before);
  });

  test('feedback state buttons set the matching state', async ({ page }) => {
    const host = page.getByTestId('feedback-host');
    await page.click('[data-act="fb-error"]');
    await expect(host.locator('[data-state-tabar="error"]')).toBeVisible();
    await page.click('[data-act="fb-retry"]');
    await expect(page.locator('#fb-attempts')).toHaveText('1');
    await page.click('[data-act="fb-succeed"]');
    await expect(host.locator('[data-state-tabar="success"]')).toBeVisible();
  });

  test('every action button runs without console errors', async ({ page }) => {
    // Collect every data-act, minus the page-destroying reload.
    const acts = await page.locator('[data-act]').evaluateAll((els) =>
      [...new Set(els.map((el) => el.getAttribute('data-act')))].filter((a) => a && a !== 'reload'),
    );
    expect(acts.length).toBeGreaterThan(20);

    for (const act of acts) {
      const btn = page.locator(`[data-act="${act}"]`).first();
      if (await btn.isVisible()) await btn.click();
      await page.waitForTimeout(40);
    }
    // Let the position overlays (which self-clear) and any async work settle.
    await page.waitForTimeout(1600);

    // The event log proves listeners fired across the run.
    await expect(page.getByTestId('event-log')).not.toBeEmpty();
    // And the peg never reappears anywhere on the page.
    await expect(page.locator('[data-peg-tabar]')).toHaveCount(0);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('configurator tooltip becomes visible on hover', async ({ page }) => {
    await page.getByTestId('cfg-tooltip').selectOption('live');
    const host = page.getByTestId('cfg-host');
    const tip = host.locator('[data-tooltip-tabar]');
    await expect(tip).toBeAttached();
    await host.locator('[data-tabar]').hover();
    await expect.poll(() => tip.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('colors editor builds a multicolor fill; bands hardens it', async ({ page }) => {
    for (let i = 0; i < 3; i += 1) await page.getByTestId('cfg-color-add').click();
    const bar = page.getByTestId('cfg-host').locator('[data-bar-tabar]');
    await expect.poll(() => bar.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain('gradient');
    await page.getByTestId('cfg-colorMode').selectOption('bands');
    await expect(page.getByTestId('cfg-code')).toContainText("colorMode: 'bands'");
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('advancing works with more than three segments', async ({ page }) => {
    await page.click('[data-act="seg-add"]');
    await page.click('[data-act="seg-add"]'); // now 5 chunks
    const segHost = page.getByTestId('seg-stacked');
    await expect(segHost.locator('[data-seg-tabar]')).toHaveCount(5);
    // Advancing must still change a fill (the old bug froze after 3 chunks).
    const widthsBefore = await segHost.locator('[data-seg-tabar] > *').evaluateAll((els) => els.map((e) => e.style.width).join('|'));
    for (let i = 0; i < 6; i += 1) await page.click('[data-act="seg-advance"]');
    const widthsAfter = await segHost.locator('[data-seg-tabar] > *').evaluateAll((els) => els.map((e) => e.style.width).join('|'));
    expect(widthsAfter).not.toBe(widthsBefore);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('JSON config reports invalid input instead of throwing', async ({ page }) => {
    await page.fill('#json-config', '{ not valid json');
    await page.click('[data-act="json-apply"]');
    await expect(page.locator('#json-status')).toContainText('Invalid config');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
