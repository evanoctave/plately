// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow importing the bundled TensorFlow Lite model as an asset.
config.resolver.assetExts.push('tflite');

module.exports = config;
