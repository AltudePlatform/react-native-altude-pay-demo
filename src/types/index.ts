export type MainTabParamList = {
  Home: undefined;
  Send: {recipient?: string; amount?: string} | undefined;
  History: undefined;
  QR: undefined;
};

export interface WalletInfo {
  publicKey: string;
  /** Base58-encoded private key – NEVER leaves the device */
  privateKey: string;
}

export interface BalanceResponse {
  walletAddress: string;
  solBalance: number;
  usdcBalance: number;
}

export interface TransactionStatusResponse {
  signature: string;
  status: 'confirmed' | 'pending' | 'failed' | 'not_found';
  confirmed: boolean;
  error?: string;
  slot?: number;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface TransactionRecord {
  id: string;
  recipient: string;
  amount: number;
  signature: string;
  status: TransactionStatus;
  date: string;
  memo?: string;
}

export type ThemePreference = 'dark' | 'light';

export interface UserPreferences {
  confirmBeforeSending: boolean;
}

export interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface AltudeApiError {
  status: number;
  detail: string;
  title?: string;
  type?: string;
  instance?: string;
}

export interface AltudeTransactionConfig {
  FeePayer: string;
  RpcUrl: string;
  Token: string | null;
  RpcEnvironment: string | null;
  TokenExpiration: string | null;
}

export interface AltudeSendTransactionRequest {
  SignedTransaction: string;
}

export interface AltudeTransactionSendResponse {
  signature: string;
  raw: unknown;
}
