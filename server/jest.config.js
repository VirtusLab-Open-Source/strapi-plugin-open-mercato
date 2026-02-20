module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '.tmp'],
  testMatch: ['**/__tests__/**/?(*.)+(test).ts?(x)'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'server/tsconfig.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/__tests__/**',
  ],
  collectCoverage: true,
  coverageDirectory: '../coverage',
  reporters: ['default', 'jest-junit'],
}; 
