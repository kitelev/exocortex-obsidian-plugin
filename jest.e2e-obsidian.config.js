const { extend } = require('jest-environment-obsidian/jest-preset');

module.exports = extend({
  displayName: "E2E Obsidian Tests",
  roots: ["<rootDir>/tests/e2e-obsidian"],
  testMatch: ["**/?(*.)+(spec|test).ts"],
  setupFilesAfterEnv: [
    "<rootDir>/tests/e2e-obsidian/setup.ts"
  ],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!**/tests/**",
  ],
  testEnvironmentOptions: {
    conformance: "lax",
    version: "1.5.0",
  },
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: false,
        tsconfig: {
          module: "commonjs",
          target: "es2020",
          lib: ["es2020", "dom"],
          skipLibCheck: true,
          moduleResolution: "node",
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          isolatedModules: true,
        },
      },
    ],
  },
});