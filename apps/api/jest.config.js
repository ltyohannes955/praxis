module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^@praxis/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@praxis/ai$': '<rootDir>/../../packages/ai/src/index.ts',
    '^@praxis/database$': '<rootDir>/../../packages/database/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
};
