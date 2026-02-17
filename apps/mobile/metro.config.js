const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure web platform extensions are resolved correctly
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.tsx',
  'web.ts',
  'web.jsx',
  'web.js',
];

module.exports = config;
