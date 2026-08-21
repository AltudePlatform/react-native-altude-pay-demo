describe('generateDemoWallet startup bootstrap', () => {
  const globalScope = globalThis as typeof globalThis & {
    crypto?: {getRandomValues?: (...args: any[]) => unknown};
  };
  const originalCrypto = globalScope.crypto;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    Object.defineProperty(globalScope, 'crypto', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalScope, 'crypto', {
      value: originalCrypto,
      configurable: true,
      writable: true,
    });
  });

  it('loads the random-values polyfill before generating a wallet', async () => {
    const getRandomValues = jest.fn();
    const generateMnemonic = jest.fn(() => {
      if (typeof globalScope.crypto?.getRandomValues !== 'function') {
        throw new Error('crypto polyfill missing');
      }

      return 'demo mnemonic';
    });
    const deriveSolanaKeypair = jest.fn().mockResolvedValue({
      publicKey: new Uint8Array([1, 2, 3, 4]),
      privateKey: new Uint8Array([10, 11, 12, 13]),
    });

    jest.doMock('react-native-get-random-values', () => {
      Object.defineProperty(globalScope, 'crypto', {
        value: {getRandomValues},
        configurable: true,
        writable: true,
      });

      return {};
    });
    jest.doMock('@altude/core', () => ({
      generateMnemonic,
      deriveSolanaKeypair,
    }));
    jest.doMock('@scure/base', () => ({
      base58: {
        encode: jest.fn(() => 'DemoPublicKey11111111111111111111111111111111'),
      },
    }));

    const {generateDemoWallet} = require('../src/services/solana');
    const wallet = await generateDemoWallet();

    expect(generateMnemonic).toHaveBeenCalledWith(12);
    expect(deriveSolanaKeypair).toHaveBeenCalledWith('demo mnemonic', 0);
    expect(wallet).toEqual({
      publicKey: 'DemoPublicKey11111111111111111111111111111111',
      privateKey: '0a0b0c0d',
    });
  });

});
