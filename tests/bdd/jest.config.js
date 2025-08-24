module.exports = {
  preset: 'ts-jest',
  displayName: 'BDD Tests',
  rootDir: '../../',
  testMatch: ['<rootDir>/tests/bdd/**/*.test.ts'],
  testTimeout: 30000,
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts',
    '<rootDir>/tests/bdd/setup/bdd-setup.ts',
    '<rootDir>/tests/bdd/setup/jest-cucumber-setup.ts'
  ],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '<rootDir>/tests/bdd/step-definitions/**/*.ts',
    '<rootDir>/tests/bdd/helpers/**/*.ts',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/main.ts'
  ],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/main.js'
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  reporters: ['default']
};