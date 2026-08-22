const mockGetBalance = jest.fn();
const mockGetConfig = jest.fn();
const mockGetHistory = jest.fn();
const mockSend = jest.fn();
const mockAltudeGasStation = jest.fn(() => ({
  getBalance: mockGetBalance,
  getConfig: mockGetConfig,
  getHistory: mockGetHistory,
  send: mockSend,
}));

function mockRuntimeConfig(useMockData: boolean): void {
  jest.doMock('../src/config/runtimeConfig', () => ({
    runtimeConfig: {
      useMockData,
      mock: {
        solBalance: 1.245,
        usdcBalance: 250.75,
        sendDelayMs: 0,
      },
    },
  }));
}

describe('gasstationAdapter', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockRuntimeConfig(false);
    jest.doMock('../src/config/apiConfig', () => ({
      ALTUDE_API_KEY: 'test-api-key',
    }));
    jest.doMock('@altude/gasstation', () => ({
      AltudeGasStation: mockAltudeGasStation,
    }));
  });

  it('constructs the SDK with only the application API key', async () => {
    const {getGasstation} = require('../src/services/gasstationAdapter');

    await getGasstation();

    expect(mockAltudeGasStation).toHaveBeenCalledTimes(1);
    expect(mockAltudeGasStation).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
    });
  });

  it('delegates config, balance, history, and send operations to the SDK', async () => {
    const config = {RpcEnvironment: 'devnet'};
    const balance = {lamports: 42};
    const history = {TransactionList: []};
    mockGetConfig.mockResolvedValue(config);
    mockGetBalance.mockResolvedValue(balance);
    mockGetHistory.mockResolvedValue(history);
    mockSend.mockResolvedValue({Signature: 'sig_sdk_123'});

    const {
      fetchAccountHistory,
      getGasstation,
      getTransactionConfig,
      sendWithSigner,
    } = require('../src/services/gasstationAdapter');
    const signer = {
      address: 'sender',
      signTransactionMessage: jest.fn(),
    };
    const gasstation = await getGasstation();

    await expect(getTransactionConfig()).resolves.toBe(config);
    await expect(gasstation.getBalance({account: 'sender'})).resolves.toBe(balance);
    await expect(
      fetchAccountHistory({walletAddress: 'sender', page: 2, pageSize: 10}),
    ).resolves.toBe(history);
    await expect(
      sendWithSigner(signer, 'recipient', 5, 'token-mint'),
    ).resolves.toEqual({signature: 'sig_sdk_123'});

    expect(mockGetConfig).toHaveBeenCalledWith();
    expect(mockGetBalance).toHaveBeenCalledWith({account: 'sender'});
    expect(mockGetHistory).toHaveBeenCalledWith({
      walletAddress: 'sender',
      account: 'sender',
      page: 2,
      pageSize: 10,
    });
    expect(mockSend).toHaveBeenCalledWith({
      sourceSigner: signer,
      toAddress: 'recipient',
      amount: 5,
      token: 'token-mint',
    });
  });

  it('keeps fake sends isolated to explicit mock mode', async () => {
    jest.resetModules();
    jest.clearAllMocks();
    mockRuntimeConfig(true);
    jest.doMock('../src/config/paymentConfig', () => ({
      stableCoinMint: 'mock-token',
    }));

    const {getGasstation, sendWithSigner} = require('../src/services/gasstationAdapter');
    const gasstation = await getGasstation();

    await expect(gasstation.getConfig()).resolves.toEqual(
      expect.objectContaining({RpcEnvironment: 'devnet'}),
    );
    await expect(
      sendWithSigner(
        {address: 'sender', signTransactionMessage: jest.fn()},
        'recipient',
        1,
      ),
    ).resolves.toEqual({signature: expect.stringMatching(/^MOCK_SIG_/)});
    expect(mockAltudeGasStation).not.toHaveBeenCalled();
  });

  it('rejects an SDK send response without a transaction signature', async () => {
    mockSend.mockResolvedValue({Status: 'failed'});
    const {sendWithSigner} = require('../src/services/gasstationAdapter');

    await expect(
      sendWithSigner(
        {address: 'sender', signTransactionMessage: jest.fn()},
        'recipient',
        1,
      ),
    ).rejects.toThrow('Gas station send() returned no transaction signature');
  });
});
