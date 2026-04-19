const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Route SVG imports through transformer (required for .svg component imports).
config.transformer = {
  ...(config.transformer ?? {}),
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// Peer of react-native-reanimated 4.x; pin resolution to app node_modules.
// config.resolver.extraNodeModules = {
//   ...(config.resolver.extraNodeModules ?? {}),
//   'react-native-worklets': path.resolve(__dirname, 'node_modules/react-native-worklets'),
// };

module.exports = config;