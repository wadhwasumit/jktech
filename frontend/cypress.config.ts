import { defineConfig } from "cypress";
require('dotenv').config()
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200', // Change if your Angular app runs on a different port
    supportFile: 'cypress/support/e2e.ts',
    video: false, // Set to true if you want to record test runs
    screenshotsFolder: 'cypress/screenshots',
    fixturesFolder: 'cypress/fixtures',
  },
  env: {
    googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    googleClientId: process.env.REACT_APP_GOOGLE_CLIENTID,
    googleClientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
  },
});
