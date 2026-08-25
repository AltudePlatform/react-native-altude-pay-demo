const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*ALTUDE_API_KEY\s*=\s*(.*?)\s*$/);
    if (match) {
      process.env.ALTUDE_API_KEY = match[1].replace(/^['"]|['"]$/g, '');
    }
  }
}

module.exports = api => {
  const isTest = api.env('test');
  if (!isTest) {
    loadEnv();
  }

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
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
                  node.property.name !== 'ALTUDE_API_KEY' ||
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
