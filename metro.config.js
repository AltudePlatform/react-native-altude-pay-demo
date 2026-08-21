const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 */
const defaultConfig = getDefaultConfig(__dirname);
const rpcWebsocketsBrowserPath = path.resolve(
	__dirname,
	'node_modules',
	'rpc-websockets',
	'dist',
	'index.browser.cjs',
);
const gillBrowserPath = path.resolve(
	__dirname,
	'node_modules',
	'gill',
	'dist',
	'index.browser.cjs',
);
const config = {
	resolver: {
		sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs', 'cjs'],
		extraNodeModules: {
			'rpc-websockets': rpcWebsocketsBrowserPath,
			gill: gillBrowserPath,
		},
		// Keep Metro from indexing huge generated native build directories.
		blockList: [
			new RegExp(
				`${path
				.resolve(__dirname, 'android', 'build')
				.replace(/[/\\]/g, '[/\\\\]')}.*`,
			),
			new RegExp(
				`${path
				.resolve(__dirname, 'android', 'app', 'build')
				.replace(/[/\\]/g, '[/\\\\]')}.*`,
			),

			// Don't let Metro watch generated Android build directories.
			/.*[\\/]node_modules[\\/].*[\\/]android[\\/]build[\\/].*/,

			// Don't let Metro watch CMake's temporary directories.
			/.*[\\/]node_modules[\\/].*[\\/]android[\\/]\.cxx[\\/].*/,
			/.*[\\/]android[\\/]\.cxx[\\/].*/,
		],
	},
};

module.exports = mergeConfig(defaultConfig, config);
