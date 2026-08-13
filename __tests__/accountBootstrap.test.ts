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
});
