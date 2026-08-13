const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(ALTUDE_API_KEY|ALTUDE_NETWORK)\s*=\s*(.*?)\s*$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
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
    plugins: isTest
      ? []
      : [
          ({types: t}) => ({
            visitor: {
              MemberExpression(path) {
                const {node} = path;
                if (
                  node.computed ||
                  !t.isIdentifier(node.property) ||
                  !['ALTUDE_API_KEY', 'ALTUDE_NETWORK'].includes(
                    node.property.name,
                  ) ||
                  !t.isMemberExpression(node.object) ||
                  node.object.computed ||
                  !t.isIdentifier(node.object.property, {name: 'env'}) ||
                  !t.isIdentifier(node.object.object, {name: 'process'})
                ) {
                  return;
                }

                const value = process.env[node.property.name];
                if (value !== undefined) {
                  path.replaceWith(t.stringLiteral(value));
                }
              },
            },
          }),
        ],
  };
};
