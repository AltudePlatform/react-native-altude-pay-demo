import {useMutation, useQueryClient} from '@tanstack/react-query';
import {paymentApi} from '../services/api';
import {
  addRecentRecipient,
  appendToHistory,
  getSettings,
} from '../services/storage';
import {
  broadcastSignedTransaction,
  signTransaction,
  waitForTransactionConfirmation,
} from '../services/solana';
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

      const createResponse = await paymentApi.createTransaction({
        senderAddress: wallet.publicKey,
        recipientAddress,
        amount,
        memo,
      });

      const signedTx = signTransaction(
        createResponse.unsignedTransaction,
        wallet.privateKey,
      );

      const settings = await getSettings();
      const signature = settings.backendBroadcastEnabled
        ? await (async () => {
            const sendResponse = await paymentApi.sendTransaction({
              signedTransaction: signedTx,
            });

            if (!sendResponse.success) {
              throw new Error(sendResponse.error ?? 'Transaction failed');
            }

            return sendResponse.signature;
          })()
        : await broadcastSignedTransaction(signedTx);

      const status = await waitForTransactionConfirmation(signature);

      const record: TransactionRecord = {
        id: generateId(),
        recipient: recipientAddress,
        amount,
        signature,
        status: status.status === 'failed' ? 'failed' : status.status,
        date: new Date().toISOString(),
        memo,
      };

      await Promise.all([
        appendToHistory(record),
        addRecentRecipient(recipientAddress),
      ]);

      if (record.status === 'failed') {
        throw new Error(status.error ?? 'Transaction failed on Solana');
      }

      return record;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['balance']});
    },
  });
}
