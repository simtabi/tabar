import { defineConfig, devices } from '@playwright/test';

// Playwright drives the built demo site (served by scripts/serve.js on :8080).
// Visual snapshots are platform-sensitive, so the authoritative baselines are
// the Linux ones generated in CI's official Playwright container; the default
// snapshot path keeps a `{platform}` suffix so local (darwin) runs never clash
// with the committed `-linux` baselines. See CONTRIBUTING.md.
const PORT = process.env.PORT || 8080;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  // Reduced motion makes Tabar drop all transitions/animations to 0ms, so the
  // visual gallery is pixel-deterministic.
  use: {
    baseURL: `http://localhost:${PORT}`,
    reducedMotion: 'reduce',
    viewport: { width: 1024, height: 1400 },
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' },
  },
  projects: [
    { name: 'chromium-light', use: { ...devices['Desktop Chrome'], colorScheme: 'light' } },
    { name: 'chromium-dark', use: { ...devices['Desktop Chrome'], colorScheme: 'dark' } },
  ],
  webServer: {
    command: 'npm run demo',
    url: `http://localhost:${PORT}/`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
