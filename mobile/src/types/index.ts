// ─── Navigation ────────────────────────────────────────────────────
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Send: { recipient?: string; amount?: string } | undefined;
  History: undefined;
  QR: undefined;
};

// ─── Wallet ────────────────────────────────────────────────────────
export interface WalletInfo {
  publicKey: string;
  /** Base58-encoded private key – NEVER leaves the device */
  privateKey: string;
}

// ─── API responses ────────────────────────────────────────────────
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
  unsignedTransaction: string; // base64-encoded message bytes
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  mint: string;
}

export interface PaymentSendRequest {
  signedTransaction: string; // base64-encoded signed transaction bytes
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

// ─── Local history ─────────────────────────────────────────────────
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface TransactionRecord {
  id: string;
  recipient: string;
  amount: number;
  signature: string;
  status: TransactionStatus;
  date: string; // ISO 8601
  memo?: string;
}
