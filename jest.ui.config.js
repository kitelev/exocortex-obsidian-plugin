/**
 * Jest configuration for UI/Integration tests with Obsidian environment
 * Uses jest-environment-obsidian for better Obsidian API mocking
 */
module.exports = {
  preset: "jest-environment-obsidian",
  roots: ["<rootDir>/tests/ui"],
  testMatch: ["**/?(*.)+(ui|integration).test.ts"],
  testEnvironment: "jest-environment-obsidian",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react",
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
  transformIgnorePatterns: ["node_modules/(?!(react|react-dom)/)"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  collectCoverageFrom: ["src/presentation/**/*.ts"],
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/"],
  testTimeout: 30000,
  verbose: true,
};
