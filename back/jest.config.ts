module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['./**/*.specs.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
