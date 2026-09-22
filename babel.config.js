const fs = require('fs');
const path = require('path');

function loadEnv(envFile) {
  const envPath = path.join(__dirname, '.env');
  if (envFile === undefined && !fs.existsSync(envPath)) {
    return '';
  }

  const source = envFile ?? fs.readFileSync(envPath, 'utf8');

  for (const line of source.split(/\r?\n/)) {
    const match = line.match(
      /^\s*(ALTUDE_API_KEY|DYNAMIC_ENVIRONMENT_ID|DYNAMIC_APP_ORIGIN|DYNAMIC_APP_LOGO)\s*=\s*(.*?)\s*$/,
    );
    if (match) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }

  return source;
}

module.exports = api => {
  let envFile = '';

  api.cache.invalidate(() => {
    const envName = process.env.BABEL_ENV || process.env.NODE_ENV || 'development';
    const envPath = path.join(__dirname, '.env');

    envFile = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    return `${envName}:${envFile}`;
  });

  const envName = process.env.BABEL_ENV || process.env.NODE_ENV || 'development';
  const isTest = envName === 'test';
  if (!isTest) {
    loadEnv(envFile);
  }

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      '@babel/plugin-transform-export-namespace-from',
      '@babel/plugin-transform-class-static-block',
      ...(isTest
        ? []
        : [
          ({types: t}) => ({
            visitor: {
              MemberExpression(babelPath) {
                const {node} = babelPath;
                if (
                  node.computed ||
                  !t.isIdentifier(node.property) ||
                  ![
                    'ALTUDE_API_KEY',
                    'DYNAMIC_ENVIRONMENT_ID',
                    'DYNAMIC_APP_ORIGIN',
                    'DYNAMIC_APP_LOGO',
                  ].includes(node.property.name) ||
                  !t.isMemberExpression(node.object) ||
                  node.object.computed ||
                  !t.isIdentifier(node.object.property, {name: 'env'}) ||
                  !t.isIdentifier(node.object.object, {name: 'process'})
                ) {
                  return;
                }

                const value = process.env[node.property.name];
                if (value !== undefined) {
                  babelPath.replaceWith(t.stringLiteral(value));
                }
              },
            },
          }),
        ]),
      // Reanimated 4 worklet transform; must stay last in the plugin list.
      'react-native-worklets/plugin',
    ],
  };
};
