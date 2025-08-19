module.exports = {
    testEnvironment: 'jsdom',
    preset: "jest-preset-angular",
    setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
    testMatch: ["**/+(*.)+(spec).+(ts)"],
    transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$)"],
  };
  