module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/altudeApi.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
};
