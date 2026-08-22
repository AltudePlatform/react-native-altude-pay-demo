const {
  inspectSource,
  isProductionSource,
} = require('../scripts/check-altude-sdk-boundary.cjs');

describe('Altude SDK boundary check', () => {
  test.each([
    [
      'hardcoded Altude service origin',
      "const baseUrl = 'https://api.altude.so';",
      'altude-service-origin',
    ],
    [
      'direct transaction endpoint',
      "fetch('/api/Transaction/send', {method: 'POST'});",
      'altude-service-route',
    ],
    [
      'manual Altude API-key header',
      "const headers = {'X-API-Key': apiKey};",
      'altude-auth-header',
    ],
    [
      'retired HTTP client import',
      "import {send} from './altudeApi';",
      'retired-http-client',
    ],
  ])('rejects a %s', (_description, source, expectedRule) => {
    expect(inspectSource('src/services/example.ts', source)).toEqual([
      expect.objectContaining({rule: expectedRule}),
    ]);
  });

  it('accepts supported SDK usage and intentional Solana RPC calls', () => {
    const source = `
      import {AltudeGasStation} from '@altude/gasstation';
      import {createSolanaRpc} from '@solana/kit';
      const station = new AltudeGasStation({apiKey});
      const rpc = createSolanaRpc(config.RpcUrl);
      fetch('http://localhost:54363/api/faucet/initialize');
    `;

    expect(inspectSource('src/services/example.ts', source)).toEqual([]);
  });

  it('covers JavaScript, TypeScript, and native production paths only', () => {
    expect(isProductionSource('src/service.ts')).toBe(true);
    expect(isProductionSource('src/service.js')).toBe(true);
    expect(isProductionSource('android/app/src/main/java/App.kt')).toBe(true);
    expect(isProductionSource('ios/AppDelegate.mm')).toBe(true);
    expect(isProductionSource('__tests__/fixture.ts')).toBe(false);
    expect(isProductionSource('README.md')).toBe(false);
  });
});
