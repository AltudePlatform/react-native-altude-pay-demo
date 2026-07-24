describe('altudeApi service', () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ALTUDE_API_KEY;

  beforeEach(() => {
    jest.resetModules();
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
      text: async () => JSON.stringify({Signature: 'sig_123'}),
    });

    const result = await sendTransactionToAltude('base64_tx_string');

    expect(result.signature).toBe('sig_123');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.altude.so/api/Transaction/send');
    expect(init.method).toBe('POST');
    expect(init.headers['X-API-Key']).toBe('test-api-key');

    expect(JSON.parse(init.body)).toEqual({
      SignedTransaction: 'base64_tx_string',
    });
  });

  it('reads blockhash from lowercase or uppercase response keys', async () => {
    const {getTransactionBlockhash} = require('../src/services/altudeApi');

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({blockhash: 'lower_hash'}),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({Blockhash: 'upper_hash'}),
      });

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
