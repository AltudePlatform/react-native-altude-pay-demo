import {
  AltudeApiError,
  AltudeSendTransactionRequest,
  AltudeTransactionConfig,
  AltudeTransactionSendResponse,
} from '../types';

const ALTUDE_BASE_URL = 'https://api.altude.so';
const ALTUDE_API_KEY =
  (typeof process !== 'undefined' && process.env.ALTUDE_API_KEY) ||
  'REPLACE_WITH_X_API_KEY';

const CONFIG_CACHE_TTL_MS = 30_000;
let cachedConfig: AltudeTransactionConfig | null = null;
let cachedConfigAt = 0;

export function buildAltudeHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': ALTUDE_API_KEY,
  };
}

function validateApiKey(): void {
  if (!ALTUDE_API_KEY || ALTUDE_API_KEY.startsWith('REPLACE_')) {
    throw new Error('Missing Altude API key. Set process.env.ALTUDE_API_KEY or update src/services/altudeApi.ts');
  }
}

function toApiError(status: number, payload: unknown): AltudeApiError {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const detail =
      typeof obj.detail === 'string'
        ? obj.detail
        : typeof obj.title === 'string'
          ? obj.title
          : 'Altude API request failed';

    return {
      status,
      detail,
      title: typeof obj.title === 'string' ? obj.title : undefined,
      type: typeof obj.type === 'string' ? obj.type : undefined,
      instance: typeof obj.instance === 'string' ? obj.instance : undefined,
    };
  }

  return {
    status,
    detail: 'Altude API request failed',
  };
}

async function parseResponse(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function requestAltude(path: string, init: RequestInit): Promise<unknown> {
  validateApiKey();

  const response = await fetch(`${ALTUDE_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...buildAltudeHeaders(),
      ...(init.headers ?? {}),
    },
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw toApiError(response.status, payload);
  }

  return payload;
}

function parseConfig(payload: unknown): AltudeTransactionConfig {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid config response from Altude API');
  }

  const config = payload as Record<string, unknown>;
  const feePayer = config.FeePayer;
  const rpcUrl = config.RpcUrl;

  if (typeof feePayer !== 'string' || !feePayer) {
    throw new Error('Altude config is missing FeePayer');
  }

  if (typeof rpcUrl !== 'string' || !rpcUrl) {
    throw new Error('Altude config is missing RpcUrl');
  }

  return {
    FeePayer: feePayer,
    RpcUrl: rpcUrl,
    Token: typeof config.Token === 'string' ? config.Token : null,
    RpcEnvironment:
      typeof config.RpcEnvironment === 'string' ? config.RpcEnvironment : null,
    TokenExpiration:
      typeof config.TokenExpiration === 'string' ? config.TokenExpiration : null,
  };
}

function parseBlockhash(payload: unknown): string {
  if (typeof payload === 'string' && payload) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid blockhash response from Altude API');
  }

  const data = payload as Record<string, unknown>;
  const candidates = [
    data.blockhash,
    data.Blockhash,
    data.value,
    data.hash,
    data.Hash,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate) {
      return candidate;
    }
  }

  throw new Error('Altude blockhash response did not include a blockhash value');
}

function parseSendSignature(payload: unknown): string {
  if (typeof payload === 'string' && payload) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid send response from Altude API');
  }

  const data = payload as Record<string, unknown>;
  const candidates = [
    data.signature,
    data.Signature,
    data.transactionSignature,
    data.TransactionSignature,
    data.txId,
    data.TxId,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate) {
      return candidate;
    }
  }

  throw new Error('Altude send response did not include a transaction signature');
}

export async function getTransactionConfig(
  forceRefresh = false,
): Promise<AltudeTransactionConfig> {
  const now = Date.now();
  if (!forceRefresh && cachedConfig && now - cachedConfigAt < CONFIG_CACHE_TTL_MS) {
    return cachedConfig;
  }

  const payload = await requestAltude('/api/Transaction/config', {
    method: 'GET',
  });

  const config = parseConfig(payload);
  cachedConfig = config;
  cachedConfigAt = now;

  return config;
}

export async function getTransactionBlockhash(): Promise<string> {
  const payload = await requestAltude('/api/Transaction/blockhash', {
    method: 'GET',
  });

  return parseBlockhash(payload);
}

export async function sendTransactionToAltude(
  signedTransaction: string,
): Promise<AltudeTransactionSendResponse> {
  if (!signedTransaction) {
    throw new Error('Signed transaction is required');
  }

  const body: AltudeSendTransactionRequest = {
    SignedTransaction: signedTransaction,
  };

  const payload = await requestAltude('/api/Transaction/send', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return {
    signature: parseSendSignature(payload),
    raw: payload,
  };
}
