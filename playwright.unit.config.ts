import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/domain',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    trace: 'off',
    screenshot: 'off',
    video: 'off'
  }
});
