// metro.config.js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  const { assetExts, sourceExts } = config.resolver;

  // Add '.svg' to sourceExts so that Metro processes them
  config.resolver.sourceExts = [...sourceExts, 'svg'];
  // Remove '.svg' from assetExts if it's there (generally not needed for Expo, but safe)
  config.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');

  // Peer of react-native-reanimated 4.x; pin resolution to app node_modules
  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules ?? {}),
    'react-native-worklets': path.resolve(__dirname, 'node_modules/react-native-worklets'),
  };

  return config;
})();