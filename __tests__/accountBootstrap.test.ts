describe('account bootstrap and SDK wrapper', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('runs the Altude SDK wrapper and returns the relayed signature', async () => {
    jest.doMock('../src/services/altudeApi', () => ({
      sendTransactionToAltude: jest.fn().mockResolvedValue({
        signature: 'sig_sdk_123',
        raw: {ok: true},
      }),
    }));

    const {sendTransaction} = require('../src/services/altudeSdk');
    const result = await sendTransaction('signed_tx_base64');

    expect(result.signature).toBe('sig_sdk_123');
  });

  it('creates a demo account from a generated keypair and persists it', async () => {
    const generatedWallet = {
      publicKey: 'DemoPublicKey11111111111111111111111111111111',
      privateKey: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    };
    const saveWallet = jest.fn().mockResolvedValue(undefined);

    jest.doMock('../src/services/solana', () => ({
      generateDemoWallet: jest.fn().mockResolvedValue(generatedWallet),
      createDevnetTokenAccount: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('../src/services/storage', () => ({
      saveWallet,
    }));

    const {createDemoAccount} = require('../src/services/accountBootstrap');
    const wallet = await createDemoAccount();

    expect(wallet).toEqual(generatedWallet);
    expect(saveWallet).toHaveBeenCalledTimes(1);
    expect(saveWallet).toHaveBeenCalledWith(generatedWallet);
  });

  it('still returns the generated wallet even if persistence fails', async () => {
    const generatedWallet = {
      publicKey: 'DemoPublicKey22222222222222222222222222222222',
      privateKey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    };
    const saveWallet = jest.fn().mockRejectedValue(new Error('storage offline'));

    jest.doMock('../src/services/solana', () => ({
      generateDemoWallet: jest.fn().mockResolvedValue(generatedWallet),
      createDevnetTokenAccount: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('../src/services/storage', () => ({
      saveWallet,
    }));

    const {createDemoAccount} = require('../src/services/accountBootstrap');
    const wallet = await createDemoAccount();

    expect(wallet).toEqual(generatedWallet);
    expect(saveWallet).toHaveBeenCalledTimes(1);
  });

  it('starts devnet token account setup without delaying wallet creation', async () => {
    const generatedWallet = {
      publicKey: 'DemoPublicKey33333333333333333333333333333333',
      privateKey: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    };
    let resolveTokenAccount: (() => void) | undefined;
    const createDevnetTokenAccount = jest.fn(
      () => new Promise<void>(resolve => {
        resolveTokenAccount = resolve;
      }),
    );
    const saveWallet = jest.fn().mockResolvedValue(undefined);

    jest.doMock('../src/config/runtimeConfig', () => ({
      runtimeConfig: {
        useMockData: false,
        mock: {
          solBalance: 1.245,
          usdcBalance: 250.75,
          sendDelayMs: 400,
        },
      },
    }));
    jest.doMock('../src/services/solana', () => ({
      generateDemoWallet: jest.fn().mockResolvedValue(generatedWallet),
      createDevnetTokenAccount,
    }));
    jest.doMock('../src/services/storage', () => ({
      saveWallet,
    }));

    const {createDemoAccount} = require('../src/services/accountBootstrap');
    const wallet = await createDemoAccount();

    expect(wallet).toEqual(generatedWallet);
    expect(createDevnetTokenAccount).toHaveBeenCalledTimes(1);
    expect(createDevnetTokenAccount).toHaveBeenCalledWith(
      generatedWallet,
      undefined,
      {
        skipFunding: true,
        strict: false,
      },
    );
    expect(saveWallet).toHaveBeenCalledTimes(1);
    resolveTokenAccount?.();
  });

  it('reuses an already stored wallet instead of creating a new one', async () => {
    const storedWallet = {
      publicKey: 'DemoPublicKey44444444444444444444444444444444',
      privateKey: '1111111111111111111111111111111111111111111111111111111111111111',
    };
    const generateDemoWallet = jest.fn();

    jest.doMock('../src/services/solana', () => ({
      generateDemoWallet,
      createDevnetTokenAccount: jest.fn(),
    }));
    jest.doMock('../src/services/storage', () => ({
      getWallet: jest.fn().mockResolvedValue(storedWallet),
      saveWallet: jest.fn(),
    }));

    const {ensureDemoAccount} = require('../src/services/accountBootstrap');
    const wallet = await ensureDemoAccount();

    expect(wallet).toEqual(storedWallet);
    expect(generateDemoWallet).not.toHaveBeenCalled();
  });

  it('deduplicates concurrent ensureDemoAccount calls', async () => {
    const generatedWallet = {
      publicKey: 'DemoPublicKey55555555555555555555555555555555',
      privateKey: '2222222222222222222222222222222222222222222222222222222222222222',
    };
    let resolveGeneration: ((wallet: typeof generatedWallet) => void) | undefined;
    const generateDemoWallet = jest.fn(
      () =>
        new Promise<typeof generatedWallet>(resolve => {
          resolveGeneration = resolve;
        }),
    );

    jest.doMock('../src/services/solana', () => ({
      generateDemoWallet,
      createDevnetTokenAccount: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('../src/services/storage', () => ({
      getWallet: jest.fn().mockResolvedValue(null),
      saveWallet: jest.fn().mockResolvedValue(undefined),
    }));

    const {ensureDemoAccount} = require('../src/services/accountBootstrap');
    const first = ensureDemoAccount();
    const second = ensureDemoAccount();

    await Promise.resolve();
    expect(generateDemoWallet).toHaveBeenCalledTimes(1);
    resolveGeneration?.(generatedWallet);
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toEqual(generatedWallet);
    expect(secondResult).toEqual(generatedWallet);
  });
});
