import fs from 'node:fs';
import path from 'node:path';

const pkgRoot = path.resolve(process.cwd());
const packages = ['@altude/core', '@altude/gasstation'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let failed = false;

for (const name of packages) {
  const pkgDir = path.join(pkgRoot, 'node_modules', name);
  const pkgJsonFile = path.join(pkgDir, 'package.json');

  if (!fs.existsSync(pkgJsonFile)) {
    console.error(`Missing package manifest for ${name}`);
    failed = true;
    continue;
  }

  const pkg = readJson(pkgJsonFile);
  const exports = pkg.exports ?? {};
  const entry = typeof exports === 'object' && !Array.isArray(exports) ? exports['.'] : null;

  if (!entry || typeof entry !== 'object') {
    console.error(`${name} is missing a top-level export map`);
    failed = true;
    continue;
  }

  if (!entry['react-native'] || !entry['browser']) {
    console.error(`${name} is missing react-native/browser export targets`);
    failed = true;
  }

  const distPath = path.join(pkgDir, 'dist');
  if (fs.existsSync(distPath)) {
    const candidates = fs.readdirSync(distPath, {recursive: true});
    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const file = path.join(distPath, candidate);
      if (!fs.statSync(file).isFile()) continue;
      const text = fs.readFileSync(file, 'utf8');
      if (text.includes('gill/programs/token') || text.includes("gill/programs/token")) {
        console.error(`${name} still references the Node-only gill/programs/token path in ${relativePath(file, pkgRoot)}`);
        failed = true;
      }
      if (text.includes('require("ws")') || text.includes("require('ws')") || text.includes('from "ws"') || text.includes("from 'ws'")) {
        console.error(`${name} still bundles ws in ${relativePath(file, pkgRoot)}`);
        failed = true;
      }
      if (text.includes('Buffer') || text.includes('globalThis.Buffer')) {
        console.error(`${name} still references Node Buffer in ${relativePath(file, pkgRoot)}`);
        failed = true;
      }
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('React Native export compatibility checks passed.');

function relativePath(file, root) {
  const relative = path.relative(root, file).replace(/\\/g, '/');
  return relative;
}
