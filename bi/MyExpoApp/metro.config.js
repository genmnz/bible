// Metro configuration for Expo
// Ensure XML files in src/bibles/arasvd are bundled as raw assets
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...new Set([...(config.resolver.assetExts || []), 'xml'])];

module.exports = config;
