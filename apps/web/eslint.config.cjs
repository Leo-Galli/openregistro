const { reactConfig } = require('@openregistro/config/eslint');

module.exports = [
  ...reactConfig,
  {
    rules: {
      // Server actions and route handlers commonly return before all code
      // paths assign a value; Next.js' own compiler enforces hook usage
      // separately via eslint-config-next at build time.
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
];
