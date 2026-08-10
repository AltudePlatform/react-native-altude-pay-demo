describe('altudeApi service', () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ALTUDE_API_KEY;
  const mockGetLatestBlockhash = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    mockGetLatestBlockhash.mockReset();

    jest.doMock('@solana/web3.js', () => ({
      Connection: jest.fn().mockImplementation(() => ({
        getLatestBlockhash: mockGetLatestBlockhash,
      })),
    }));

    process.env.ALTUDE_API_KEY = 'test-api-key';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.ALTUDE_API_KEY = originalApiKey;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('builds required headers including X-API-Key', () => {
    const {buildAltudeHeaders} = require('../src/services/altudeApi');
    expect(buildAltudeHeaders()).toEqual({
      'Content-Type': 'application/json',
      'X-API-Key': 'test-api-key',
    });
  });

  it('posts SignedTransaction exactly to /api/Transaction/send', async () => {
    const {sendTransactionToAltude} = require('../src/services/altudeApi');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({signature: 'sig_123'}),
    });

    const result = await sendTransactionToAltude('base64_tx_string');

    expect(result.signature).toBe('sig_123');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.altude.so/api/Transaction/send',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({SignedTransaction: 'base64_tx_string'}),
      }),
    );
  });

  it('reads blockhash from latest blockhash response', async () => {
    const {getTransactionBlockhash} = require('../src/services/altudeApi');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          FeePayer: '11111111111111111111111111111111',
          RpcUrl: 'https://api.devnet.solana.com',
          Token: null,
          RpcEnvironment: null,
          TokenExpiration: null,
        }),
    });

    mockGetLatestBlockhash
      .mockResolvedValueOnce({blockhash: 'lower_hash'})
      .mockResolvedValueOnce({blockhash: 'upper_hash'});

    await expect(getTransactionBlockhash()).resolves.toBe('lower_hash');
    await expect(getTransactionBlockhash()).resolves.toBe('upper_hash');
  });

  it('maps 401 API errors to a structured error object', async () => {
    const {getTransactionConfig} = require('../src/services/altudeApi');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({title: 'Unauthorized', detail: 'Bad key'}),
    });

    await expect(getTransactionConfig(true)).rejects.toEqual(
      expect.objectContaining({
        status: 401,
        detail: 'Bad key',
      }),
    );
  });
});
