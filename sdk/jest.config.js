/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest'
  },
  testEnvironment: 'node',
  testMatch: ["**/?(*.)+(test).[tj]s"],
  extensionsToTreatAsEsm: ['.ts'],
  collectCoverageFrom: [
    '*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}; 