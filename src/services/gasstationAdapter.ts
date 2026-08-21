import type {SolanaNetwork} from '@altude/core';
import {ALTUDE_API_KEY} from '../config/apiConfig';
import {stableCoinMint} from '../config/paymentConfig';
import {runtimeConfig} from '../config/runtimeConfig';

const ALLOW_FALLBACK_SEND =
  runtimeConfig.useMockData ||
  (typeof process !== 'undefined' &&
    (process.env.ALTUDE_ALLOW_FALLBACK_SEND === '1' ||
      process.env.ALTUDE_ALLOW_FALLBACK_SEND === 'true')) ||
  (typeof __DEV__ !== 'undefined' && __DEV__);

type GasstationLike = {
  getBalance: (args: {account: string; token?: string}) => Promise<{
    lamports?: number;
    uiAmount?: number;
  }>;
  getConfig: () => Promise<any>;
  getHistory: (args: {
    walletAddress: string;
    account?: string;
    pageSize?: number;
    page?: number;
  }) => Promise<any>;
  send: (args: {
    sourceSigner: {
      address: string;
      signTransactionMessage: (txBytes: Uint8Array) => Promise<Uint8Array>;
    };
    toAddress: string;
    amount: number;
    token?: string;
  }) => Promise<{Signature?: string; signature?: string}>;
};

let instance: GasstationLike | null = null;

function toSolanaNetwork(rpcEnvironment: string | null): SolanaNetwork {
  const normalized = rpcEnvironment?.trim().toLowerCase();
  if (normalized === 'mainnet' || normalized === 'mainnet-beta') {
    return 'mainnet-beta';
  }
  if (normalized === 'devnet' || normalized === 'testnet') {
    return normalized;
  }
  throw new Error(
    `Altude transaction config returned an unsupported RPC environment: ${
      rpcEnvironment ?? 'missing'
    }.`,
  );
}

function createFallbackGasstation(): GasstationLike {
  return {
    async getBalance(args) {
      if (args.token === stableCoinMint) {
        return {uiAmount: runtimeConfig.mock.usdcBalance};
      }
      return {lamports: Math.round(runtimeConfig.mock.solBalance * 1_000_000_000)};
    },
    async getConfig() {
      const {getTransactionConfig} = await import('./altudeApi');
      return getTransactionConfig();
    },
    async getHistory(_args) {
      return {TransactionList: []};
    },
    async send(_args) {
      if (ALLOW_FALLBACK_SEND) {
        const signature = `MOCK_SIG_${Date.now().toString(36)}${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        if (runtimeConfig.mock.sendDelayMs > 0) {
          await new Promise<void>(resolve => {
            setTimeout(resolve, runtimeConfig.mock.sendDelayMs);
          });
        }
        console.warn('[gasstationAdapter] Using fallback mock send signature:', signature);
        return {signature};
      }
      throw new Error('Mock gas station send is disabled.');
    },
  };
}

export async function getGasstation(): Promise<GasstationLike> {
  if (!instance) {
    if (runtimeConfig.useMockData) {
      instance = createFallbackGasstation();
      return instance;
    }

    const {getTransactionConfig: loadConfig} = await import('./altudeApi');
    const {RpcEnvironment} = await loadConfig();
    const {AltudeGasStation} = require('@altude/gasstation') as typeof import('@altude/gasstation');
    const sdk = new AltudeGasStation({
      apiKey: ALTUDE_API_KEY,
      network: toSolanaNetwork(RpcEnvironment),
    });
    instance = {
      getBalance: args => sdk.getBalance(args),
      getConfig: () => sdk.getConfig(),
      getHistory: args => sdk.getHistory(args),
      send: args => sdk.send(args),
    };
  }
  return instance;
}

export async function getTransactionConfig(): Promise<any> {
  const gs = await getGasstation();
  return gs.getConfig();
}

export async function fetchAccountHistory(args: {
  walletAddress: string;
  pageSize?: number,
  page?: number,
}): Promise<any> {
  const gs = await getGasstation();
  // The API requires WalletAddress; `account` is the Android SDK's spelling of the same field.
  console.log('[gasstationAdapter] Fetching account history with args:', args);
  const res = await gs.getHistory({
    walletAddress: args.walletAddress,
    account: args.walletAddress,
    pageSize: args.pageSize,
    page: args.page,
  });
  console.log('[gasstationAdapter] Fetched account history:', res);
  return res;
}

export async function sendWithSigner(
  sourceSigner: {
    address: string;
    signTransactionMessage: (txBytes: Uint8Array) => Promise<Uint8Array>;
  },
  toAddress: string,
  amount: number,
  token?: string,
): Promise<{signature: string}> {
  const gs = await getGasstation();
  const res = await gs.send({
    sourceSigner,
    toAddress,
    amount,
    token,
  });
  const sig = res?.Signature ?? res?.signature;
  if (typeof sig !== 'string' || sig.length === 0) {
    throw new Error(
      `Gas station send() returned no transaction signature: ${JSON.stringify(res)}`,
    );
  }
  return {signature: sig};
}

export default {
  getGasstation,
  getTransactionConfig,
  fetchAccountHistory,
  sendWithSigner,
};
