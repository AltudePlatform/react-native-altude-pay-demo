const {execFileSync} = require('node:child_process');
const path = require('node:path');

const SOURCE_EXTENSIONS = new Set([
  '.c',
  '.cc',
  '.cpp',
  '.h',
  '.hpp',
  '.java',
  '.js',
  '.jsx',
  '.kt',
  '.kts',
  '.m',
  '.mm',
  '.swift',
  '.ts',
  '.tsx',
]);

const RULES = [
  {
    id: 'altude-service-origin',
    pattern: /\b(?:https?:\/\/)?api\.altude\.so\b/i,
    message: 'Altude service origins must be owned by a supported @altude SDK.',
  },
  {
    id: 'altude-service-route',
    pattern:
      /['"`]\/api\/(?:transaction|account|gas-?station)\/(?:config|send|sendbatch|create|close|getaccountinfo|gethistory|balance|history)\b/i,
    message: 'Altude service routes must be called through a supported @altude SDK.',
  },
  {
    id: 'altude-auth-header',
    pattern: /['"`]X-API-Key['"`]\s*:/i,
    message: 'Altude authentication headers must be constructed by the SDK.',
  },
  {
    id: 'retired-http-client',
    pattern:
      /(?:\bfrom\s*|\brequire\s*\(|\bimport\s*\()\s*['"`][^'"`]*(?:altudeApi|altudeSdk)['"`]/,
    message: 'Retired direct-HTTP compatibility modules must not be imported.',
  },
];

// Every exception must include all review metadata described in README.md.
const EXCEPTIONS = [];

function normalizePath(filePath) {
  return filePath.replaceAll('\\', '/');
}

function isProductionSource(filePath) {
  const normalized = normalizePath(filePath);
  const extension = path.posix.extname(normalized);
  if (!SOURCE_EXTENSIONS.has(extension)) {
    return false;
  }

  return (
    normalized === 'App.tsx' ||
    normalized === 'index.js' ||
    normalized.startsWith('src/') ||
    normalized.startsWith('android/app/src/main/') ||
    normalized.startsWith('ios/')
  );
}

function validateExceptions() {
  const requiredFields = [
    'path',
    'rule',
    'owner',
    'rationale',
    'expires',
    'removalCriteria',
  ];

  for (const exception of EXCEPTIONS) {
    for (const field of requiredFields) {
      if (typeof exception[field] !== 'string' || exception[field].trim() === '') {
        throw new Error(
          `SDK-boundary exception for ${exception.path || 'unknown path'} is missing ${field}.`
        );
      }
    }
    if (!RULES.some(rule => rule.id === exception.rule)) {
      throw new Error(
        `SDK-boundary exception for ${exception.path} references unknown rule ${exception.rule}.`
      );
    }
  }
}

function inspectSource(filePath, source) {
  const normalized = normalizePath(filePath);
  if (!isProductionSource(normalized)) {
    return [];
  }

  return RULES.flatMap(rule => {
    if (!rule.pattern.test(source)) {
      return [];
    }

    const excepted = EXCEPTIONS.some(
      exception => exception.path === normalized && exception.rule === rule.id
    );
    return excepted
      ? []
      : [{path: normalized, rule: rule.id, message: rule.message}];
  });
}

function listTrackedFiles(rootDir) {
  return execFileSync('git', ['ls-files', '-z'], {
    cwd: rootDir,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean);
}

function checkRepository(rootDir = path.resolve(__dirname, '..')) {
  validateExceptions();
  const fs = require('node:fs');
  return listTrackedFiles(rootDir).flatMap(filePath => {
    if (!isProductionSource(filePath)) {
      return [];
    }
    return inspectSource(
      filePath,
      fs.readFileSync(path.join(rootDir, filePath), 'utf8')
    );
  });
}

function runCli() {
  const violations = checkRepository();
  if (violations.length === 0) {
    console.log('Altude SDK boundary check passed.');
    return;
  }

  for (const violation of violations) {
    console.error(`${violation.path}: [${violation.rule}] ${violation.message}`);
  }
  process.exitCode = 1;
}

if (require.main === module) {
  runCli();
}

module.exports = {
  checkRepository,
  inspectSource,
  isProductionSource,
};
