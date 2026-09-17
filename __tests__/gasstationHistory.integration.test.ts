const WALLET = '7VfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs';

type TransactionVersion = 'legacy' | 0 | 1;

function transactionFixture(
  version: TransactionVersion,
  slot: number,
  preBalance: number,
  postBalance: number,
  err: object | null = null,
) {
  return {
    version,
    slot,
    blockTime: 1_786_962_240 + slot,
    meta: {
      err,
      preBalances: [preBalance],
      postBalances: [postBalance],
      preTokenBalances: [],
      postTokenBalances: [],
    },
    transaction: {
      message: {
        accountKeys: [WALLET],
      },
    },
  };
}

describe('installed Gas Station history integration', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../src/config/apiConfig', () => ({
      ALTUDE_API_KEY: 'test-api-key',
    }));
    jest.doMock('../src/config/runtimeConfig', () => ({
      runtimeConfig: {
        useMockData: false,
        mock: {
          solBalance: 0,
          usdcBalance: 0,
          sendDelayMs: 0,
        },
      },
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads mixed legacy, v0, and v1 entries through the real adapter', async () => {
    const {AltudeHttpClient} = require('@altude/gasstation');
    const getTransaction = jest.fn((signature: string, _config: unknown) => ({
      send: jest.fn(async () => {
        switch (signature) {
          case 'legacy-signature':
            return transactionFixture('legacy', 10, 2_000_000_000, 1_000_000_000);
          case 'v0-signature':
            return transactionFixture(0, 11, 1_000_000_000, 3_000_000_000);
          case 'v1-signature':
            return transactionFixture(1, 12, 3_000_000_000, 2_500_000_000, {
              InstructionError: [0, 'Custom'],
            });
          default:
            return null;
        }
      }),
    }));
    jest.spyOn(AltudeHttpClient.prototype, 'getRpcClient').mockResolvedValue({
      rpc: {
        getSignaturesForAddress: jest.fn(() => ({
          send: jest.fn(async () => [
            {signature: 'legacy-signature'},
            {signature: 'v0-signature'},
            {signature: 'v1-signature'},
            {signature: 'not-yet-available-signature'},
          ]),
        })),
        getTransaction,
      },
    });

    const {
      fetchAccountHistory,
    } = require('../src/services/gasstationAdapter');

    await expect(
      fetchAccountHistory({walletAddress: WALLET, page: 1, pageSize: 20}),
    ).resolves.toEqual(
      expect.objectContaining({
        walletAddress: WALLET,
        total: 4,
        data: [
          expect.objectContaining({
            signature: 'legacy-signature',
            status: 'success',
            type: 'send',
            amount: 1,
          }),
          expect.objectContaining({
            signature: 'v0-signature',
            status: 'success',
            type: 'receive',
            amount: 2,
          }),
          expect.objectContaining({
            signature: 'v1-signature',
            status: 'failed',
            type: 'send',
            amount: 0.5,
          }),
        ],
      }),
    );

    expect(getTransaction).toHaveBeenCalledTimes(4);
    for (const [, config] of getTransaction.mock.calls) {
      expect(config).toEqual(
        expect.objectContaining({maxSupportedTransactionVersion: 1}),
      );
    }
  });

  it('returns an intentional empty result for an account without signatures', async () => {
    const {AltudeHttpClient} = require('@altude/gasstation');
    jest.spyOn(AltudeHttpClient.prototype, 'getRpcClient').mockResolvedValue({
      rpc: {
        getSignaturesForAddress: jest.fn(() => ({
          send: jest.fn(async () => []),
        })),
      },
    });

    const {
      fetchAccountHistory,
    } = require('../src/services/gasstationAdapter');

    await expect(
      fetchAccountHistory({walletAddress: WALLET, page: 1, pageSize: 20}),
    ).resolves.toEqual(
      expect.objectContaining({
        walletAddress: WALLET,
        data: [],
        total: 0,
        status: 'success',
      }),
    );
  });

  it('keeps RPC and unsupported-version failures visible to callers', async () => {
    const unsupportedVersion = new Error(
      'Transaction version (2) is not supported',
    );
    const {AltudeHttpClient} = require('@altude/gasstation');
    jest.spyOn(AltudeHttpClient.prototype, 'getRpcClient').mockResolvedValue({
      rpc: {
        getSignaturesForAddress: jest.fn(() => ({
          send: jest.fn(async () => [{signature: 'future-signature'}]),
        })),
        getTransaction: jest.fn(() => ({
          send: jest.fn(async () => {
            throw unsupportedVersion;
          }),
        })),
      },
    });

    const {
      fetchAccountHistory,
    } = require('../src/services/gasstationAdapter');

    await expect(
      fetchAccountHistory({walletAddress: WALLET}),
    ).rejects.toBe(unsupportedVersion);
  });
});
