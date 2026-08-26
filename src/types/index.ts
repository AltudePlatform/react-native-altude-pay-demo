import {NavigatorScreenParams} from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Send: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Preparing: {
    profile: UserProfile;
  };
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  History: undefined;
  QR: undefined;
  Scan: undefined;
  PayAddress: {
    amount: string;
    recipient?: string;
  };
  PaymentStatus: {
    amount: string;
    recipient: string;
  };
  Receipt: {
    receiptData: GetHistorySummary;
  };
};

export interface AltudeHistoryEntry {
  signature: string;
  createdAt: string | null;
  transactionType: number;
  transactionStatus: number | null;
  error: string | null;
}

export interface WalletInfo {
  publicKey: string;
  /** 32-byte seed stored as lowercase hex – NEVER leaves the device */
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
  status: string;
  id: string;
  walletAddress: string;
  data: GetHistorySummary[];
  page: number | string;
  pageSize: number | string;
  limit: number;
  offset: number;
  total: number;
  
}
export interface GetHistorySummary{
  signature: string;
  slot: number;
  blockTime: number | null;
  status: 'success' | 'failed';
  type: 'send' | 'receive' | 'unknown';
  amount: number;
  mint?: string;
  from?: string;
  to?: string;
}

export type ThemePreference = 'dark' | 'light';

export interface UserPreferences {
  confirmBeforeSending: boolean;
}

export interface UserProfile {
  name: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  completedAt: string;
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
