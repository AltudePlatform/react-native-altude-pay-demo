const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 */
const defaultConfig = getDefaultConfig(__dirname);
const dynamicNativeCompat = path.resolve(
	__dirname,
	'src/services/dynamicNativeCompat.ts',
);
const config = {
	resolver: {
		resolveRequest: (context, moduleName, platform) => {
			if (
				[
					'expo-linking',
					'expo-modules-core',
					'expo-secure-store',
					'expo-web-browser',
				].includes(moduleName)
			) {
				return {
					filePath: dynamicNativeCompat,
					type: 'sourceFile',
				};
			}

			return context.resolveRequest(context, moduleName, platform);
		},
		sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs'],
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
			/.*[\\/]node_modules[\\/]@react-native[\\/]gradle-plugin[\\/].*[\\/]build[\\/].*/,
			/.*[\\/]node_modules[\\/].*[\\/]android[\\/].*/,

			// Don't let Metro watch CMake's temporary directories.
			/.*[\\/]node_modules[\\/].*[\\/]android[\\/]\.cxx[\\/].*/,
			/.*[\\/]android[\\/]app[\\/]\.cxx[\\/].*/,
			/.*[\\/]android[\\/]\.cxx[\\/].*/,
		],
		extraNodeModules: {
			events: require.resolve('events'),
		},
	},
};

module.exports = mergeConfig(defaultConfig, config);
