const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ZegoCloud needs this for certain package resolutions
config.resolver.sourceExts.push('cjs');

module.exports = config;
