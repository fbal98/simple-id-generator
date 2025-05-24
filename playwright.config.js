import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: 'html',
  
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3001',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot only when retrying
    screenshot: 'only-on-failure',
    
    // Video only on retry
    video: 'retain-on-failure',
    
    // Fixed viewport for consistent visual tests
    viewport: { width: 1280, height: 720 },
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  // Run your local dev server before starting the tests on port 3001 for isolation
  webServer: {
    command: 'bun run server.js',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      PORT: '3001',
    },
  },
  
  // Test match patterns
  testMatch: 'tests/e2e/**/*.spec.js',
  
  // Expect configuration for visual regression tests
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 5000,
    
    toHaveScreenshot: {
      // An acceptable amount of pixels that could be different
      maxDiffPixels: 100,
    },
    
    toMatchSnapshot: {
      // An acceptable ratio of pixels that are different
      maxDiffPixelRatio: 0.2,
    },
  },
});