const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 */
const defaultConfig = getDefaultConfig(__dirname);
const screensShimPath = path.resolve(__dirname, 'src', 'shims', 'react-native-screens.tsx');

function isScreensRequest(moduleName) {
	if (!moduleName) return false;
	const normalized = String(moduleName).replace(/\\/g, '/');
	return (
		normalized === 'react-native-screens' ||
		normalized.startsWith('react-native-screens/') ||
		normalized.includes('/react-native-screens/') ||
		normalized.includes('react-native-screens@')
	);
}

const config = {
	resolver: {
		sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs', 'cjs'],
		resolveRequest: (context, moduleName, platform) => {
			if (isScreensRequest(moduleName)) {
				return {
					type: 'sourceFile',
					filePath: screensShimPath,
				};
			}

			return context.resolveRequest(context, moduleName, platform);
		},
		extraNodeModules: {
			'react-native-screens': path.resolve(__dirname, 'src', 'shims', 'react-native-screens'),
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
