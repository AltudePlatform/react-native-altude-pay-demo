import axios from 'axios';
import {
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentSendRequest,
  PaymentSendResponse,
} from '../types';

const BASE_URL = __DEV__ ? 'http://localhost:5001' : 'https://localhost:5001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {'Content-Type': 'application/json'},
});

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
};
