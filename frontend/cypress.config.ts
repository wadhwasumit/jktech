import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200', // Change if your Angular app runs on a different port
    supportFile: 'cypress/support/e2e.ts',
    video: false, // Set to true if you want to record test runs
    screenshotsFolder: 'cypress/screenshots',
    fixturesFolder: 'cypress/fixtures',
  },
});
