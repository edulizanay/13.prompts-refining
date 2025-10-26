const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: 'integration',
  testEnvironment: 'node', // Use Node environment for server-side tests
  testMatch: ['**/__tests__/**/*.integration.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/jest.integration.setup.js'],
};

module.exports = createJestConfig(customJestConfig);
