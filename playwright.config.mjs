import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  outputDir: 'test-results',
  reporter: [['list']],
  fullyParallel: true,
  use: { trace: 'off' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 850 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
