const {join} = require('path');

module.exports = {
  verbose: true,
  transform: {
    "^.+\\.ts$": 'ts-jest',
  },
  moduleFileExtensions: [
    'json', 'ts', 'js'
  ],
  testMatch: ['**/__tests__/**/*.ts']
}
