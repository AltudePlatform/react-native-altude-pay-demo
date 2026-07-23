import {useMutation, useQueryClient} from '@tanstack/react-query';
import {paymentApi} from '../services/api';
import {signTransaction} from '../services/solana';
import {appendToHistory, updateHistoryRecord} from '../services/storage';
import {useWalletStore} from '../store/walletStore';
import {TransactionRecord} from '../types';
import {generateId} from '../utils/helpers';

interface SendPaymentParams {
  recipientAddress: string;
  amount: number;
  memo?: string;
}

export function usePayment() {
  const wallet = useWalletStore(s => s.wallet);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipientAddress,
      amount,
      memo,
    }: SendPaymentParams): Promise<TransactionRecord> => {
      if (!wallet) throw new Error('No wallet connected');

      // 1. Create unsigned transaction on backend
      const createResponse = await paymentApi.createTransaction({
        senderAddress: wallet.publicKey,
        recipientAddress,
        amount,
        memo,
      });

      // 2. Sign locally (private key stays on device)
      const signedTx = signTransaction(
        createResponse.unsignedTransaction,
        wallet.privateKey,
      );

      // 3. Broadcast via backend
      const sendResponse = await paymentApi.sendTransaction({
        signedTransaction: signedTx,
      });

      if (!sendResponse.success) {
        throw new Error(sendResponse.error ?? 'Transaction failed');
      }

      const record: TransactionRecord = {
        id: generateId(),
        recipient: recipientAddress,
        amount,
        signature: sendResponse.signature,
        status: 'confirmed',
        date: new Date().toISOString(),
        memo,
      };

      // 4. Persist to local history
      await appendToHistory(record);

      return record;
    },

    onSuccess: () => {
      // Invalidate balance to trigger refresh
      queryClient.invalidateQueries({queryKey: ['balance']});
    },
  });
}

export function useTransactionStatus(signature: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sig: string) => {
      const status = await paymentApi.getTransactionStatus(sig);
      if (status.confirmed) {
        await updateHistoryRecord(sig, {status: 'confirmed'});
      } else if (status.status === 'failed') {
        await updateHistoryRecord(sig, {status: 'failed'});
      }
      return status;
    },
  });
}
