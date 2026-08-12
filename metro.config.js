const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 */
const defaultConfig = getDefaultConfig(__dirname);
const screensShimPath = path.resolve(
	__dirname,
	'src',
	'shims',
	'react-native-screens.tsx',
);
const rpcWebsocketsBrowserPath = path.resolve(
	__dirname,
	'node_modules',
	'rpc-websockets',
	'dist',
	'index.browser.cjs',
);
const config = {
	resolver: {
		sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs', 'cjs'],
		extraNodeModules: {
			'react-native-screens': screensShimPath,
			'rpc-websockets': rpcWebsocketsBrowserPath,
		},
		// Keep Metro from indexing huge generated native build directories.
		blockList: [
			new RegExp(`${path.resolve(__dirname, 'android', 'build').replace(/[/\\]/g, '[/\\\\]')}.*`),
			new RegExp(`${path.resolve(__dirname, 'android', 'app', 'build').replace(/[/\\]/g, '[/\\\\]')}.*`),
			/.*[\\/]node_modules[\\/].*[\\/]android[\\/]build[\\/].*/,
		],
	},
};

module.exports = mergeConfig(defaultConfig, config);
