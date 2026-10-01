import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['test/**/*.test.js'],
    coverage: {
      // Opt-in via `npm run test:coverage` — reported, not gated (no thresholds).
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/styles.js'], // generated
    },
  },
});
