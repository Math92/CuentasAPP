// jest.config.js
export default {
  transform: {
    '^.+\\.(mjs|js)$': 'babel-jest',  // Apply babel-jest to both .mjs and .js files
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'mjs', 'json', 'node'],
  testMatch: [
    '**/scripts/**/*.(test|spec).mjs', // Tests with .mjs extension
    '**/?(*.)+(test|spec).[tj]s?(x)',   // Tests with .js, .ts extensions
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!your-package-to-transform).+\\.js$',  // Make sure node_modules are processed correctly
  ],
};
