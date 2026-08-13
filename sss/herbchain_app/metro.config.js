const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ignore hidden/temporary npm folders from Metro bundler watcher
config.resolver.blockList = [
  /node_modules\/\..*/,
];

module.exports = config;
