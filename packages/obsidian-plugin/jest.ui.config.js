/**
 * Jest configuration for UI/Integration tests with Obsidian environment
 * Uses jest-environment-obsidian for better Obsidian API mocking
 * Note: Modal class is not stubbed in jest-environment-obsidian but
 * UniversalLayoutRenderer imports LabelInputModal which extends Modal.
 * The Modal is only used in button click handlers which are not tested here.
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
          paths: {
            "@exocortex/core": ["<rootDir>/../core/src/index.ts"]
          }
        },
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!(react|react-dom)/)"],
  moduleNameMapper: {
    "^@exocortex/core$": "<rootDir>/../core/src/index.ts",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^obsidian$": "<rootDir>/tests/__mocks__/obsidian.ts",
  },
  collectCoverageFrom: ["<rootDir>/src/presentation/**/*.ts"],
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/"],
  testTimeout: 30000,
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/tests/setup-reflect-metadata.ts"],
};
