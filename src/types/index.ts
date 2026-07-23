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

export interface PaymentCreateRequest {
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  mint?: string;
  memo?: string;
}

export interface PaymentCreateResponse {
  unsignedTransaction: string;
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  mint: string;
}

export interface PaymentSendRequest {
  signedTransaction: string;
}

export interface PaymentSendResponse {
  signature: string;
  success: boolean;
  error?: string;
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

export interface AppSettings {
  backendBroadcastEnabled: boolean;
}

export interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
}
