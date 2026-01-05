module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['**/*.js', '!**/node_modules/**', '!**/coverage/**'],
  testTimeout: 10000
};