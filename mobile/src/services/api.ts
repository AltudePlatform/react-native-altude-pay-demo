import axios from 'axios';
import {
  BalanceResponse,
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentSendRequest,
  PaymentSendResponse,
  TransactionStatusResponse,
} from '../types';

// Backend URL – update to match your local machine's IP when testing on a physical device
const BASE_URL = __DEV__
  ? 'http://localhost:5001'
  : 'https://localhost:5001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {'Content-Type': 'application/json'},
});

// ─── Interceptors ─────────────────────────────────────────────────
apiClient.interceptors.response.use(
  response => response,
  error => {
    const message =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      'Unknown error';
    return Promise.reject(new Error(message));
  },
);

// ─── API methods ──────────────────────────────────────────────────
export const walletApi = {
  getBalance: async (walletAddress: string): Promise<BalanceResponse> => {
    const {data} = await apiClient.get<BalanceResponse>(
      `/api/balance/${walletAddress}`,
    );
    return data;
  },
};

export const paymentApi = {
  createTransaction: async (
    request: PaymentCreateRequest,
  ): Promise<PaymentCreateResponse> => {
    const {data} = await apiClient.post<PaymentCreateResponse>(
      '/api/payment/create',
      request,
    );
    return data;
  },

  sendTransaction: async (
    request: PaymentSendRequest,
  ): Promise<PaymentSendResponse> => {
    const {data} = await apiClient.post<PaymentSendResponse>(
      '/api/payment/send',
      request,
    );
    return data;
  },

  getTransactionStatus: async (
    signature: string,
  ): Promise<TransactionStatusResponse> => {
    const {data} = await apiClient.get<TransactionStatusResponse>(
      `/api/payment/${signature}`,
    );
    return data;
  },
};
