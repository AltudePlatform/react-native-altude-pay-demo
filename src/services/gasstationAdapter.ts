import {ALTUDE_API_KEY, ALTUDE_NETWORK} from '../config/apiConfig';
import {stableCoinMint} from '../config/paymentConfig';
import {runtimeConfig} from '../config/runtimeConfig';

const ALLOW_FALLBACK_SEND =
  runtimeConfig.useMockData ||
  (typeof process !== 'undefined' &&
    (process.env.ALTUDE_ALLOW_FALLBACK_SEND === '1' ||
      process.env.ALTUDE_ALLOW_FALLBACK_SEND === 'true')) ||
  (typeof __DEV__ !== 'undefined' && __DEV__);

// Lazily hold the instance — avoids loading @altude/gasstation (and its
// heavy `gill` / @solana/kit transitive deps) until the first SDK call.
type GasstationLike = {
  getBalance: (args: {account: string; token?: string}) => Promise<{
    lamports?: number;
    uiAmount?: number;
  }>;
  getConfig: () => Promise<any>;
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
let initializationError: Error | null = null;

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
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
    async send(args) {
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
      const reason = initializationError?.message
        ? ` (${initializationError.message})`
        : '';
      throw new Error(
        `Gas station SDK is unavailable on this runtime${reason}.`,
      );
    },
  };
}

export function getGasstationInitializationError(): Error | null {
  return initializationError;
}

export async function getGasstation(): Promise<GasstationLike> {
  if (!instance) {
    if (runtimeConfig.useMockData) {
      initializationError = null;
      instance = createFallbackGasstation();
      return instance;
    }

    try {
      const {AltudeGasStation} = await import('@altude/gasstation');
      const sdk = new AltudeGasStation({
        apiKey: ALTUDE_API_KEY,
        network: ALTUDE_NETWORK,
      }) as any;
      instance = {
        async getBalance(args) {
          if (typeof sdk.getBalance === 'function') {
            return sdk.getBalance(args);
          }
          return {lamports: 0, uiAmount: 0};
        },
        async getConfig() {
          if (typeof sdk.getConfig === 'function') {
            return sdk.getConfig();
          }
          const {getTransactionConfig} = await import('./altudeApi');
          return getTransactionConfig();
        },
        async send(args) {
          if (typeof sdk.send === 'function') {
            return sdk.send(args);
          }
          throw new Error('Gas station SDK send() is unavailable.');
        },
      };
      initializationError = null;
    } catch (error) {
      initializationError = toError(error);
      console.warn(
        '[gasstationAdapter] Falling back: SDK unavailable.',
        initializationError,
      );
      instance = createFallbackGasstation();
    }
  }
  return instance;
}

export async function getTransactionConfig(): Promise<any> {
  const gs = await getGasstation();
  return gs.getConfig();
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
  const sig = res.Signature ?? res.signature ?? '';
  return {signature: sig};
}

export default {
  getGasstation,
  getTransactionConfig,
  sendWithSigner,
};

