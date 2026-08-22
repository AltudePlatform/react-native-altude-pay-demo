describe('Solana RPC boundary', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.doMock('../src/config/runtimeConfig', () => ({
      runtimeConfig: {
        useMockData: false,
        mock: {
          solBalance: 1.245,
          usdcBalance: 250.75,
          sendDelayMs: 0,
        },
      },
    }));
  });

  it('uses the SDK-managed RPC client for transaction status', async () => {
    const send = jest.fn().mockResolvedValue({
      value: [
        {
          confirmationStatus: 'confirmed',
          confirmations: 1,
          err: null,
          slot: 42,
        },
      ],
    });
    const getSignatureStatuses = jest.fn(() => ({send}));
    const getRpcClient = jest.fn().mockResolvedValue({getSignatureStatuses});
    jest.doMock('../src/services/gasstationAdapter', () => ({
      getGasstation: jest.fn().mockResolvedValue({getRpcClient}),
    }));

    const {getTransactionStatus} = require('../src/services/solana');

    await expect(getTransactionStatus('relay-signature')).resolves.toEqual({
      signature: 'relay-signature',
      status: 'confirmed',
      confirmed: true,
      slot: 42,
    });
    expect(getRpcClient).toHaveBeenCalledTimes(1);
    expect(getSignatureStatuses).toHaveBeenCalledWith(
      ['relay-signature'],
      {searchTransactionHistory: true},
    );
  });

  it('uses SDK config rather than an application network setting', async () => {
    const getConfig = jest.fn().mockResolvedValue({RpcEnvironment: 'mainnet-beta'});
    jest.doMock('../src/services/gasstationAdapter', () => ({
      getGasstation: jest.fn().mockResolvedValue({
        getConfig,
        getRpcClient: jest.fn(),
      }),
    }));

    const {createDevnetTokenAccount} = require('../src/services/solana');

    await expect(
      createDevnetTokenAccount({
        publicKey: 'wallet',
        privateKey: '00',
      }),
    ).rejects.toThrow('Devnet token account creation is only supported on devnet');
    expect(getConfig).toHaveBeenCalledTimes(1);
  });
});
