const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for ZegoCloud's .mjs and .cjs files
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Help Metro find deep modules in node_modules on Windows
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, 'node_modules/@zegocloud'),
];

// Enable symlinks for better path resolution on Windows
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
