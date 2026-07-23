import {useMutation, useQueryClient} from '@tanstack/react-query';
import {addRecentRecipient, appendToHistory} from '../services/storage';
import {
  broadcastSignedTransaction,
  createSignedUsdcTransferTransaction,
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
      if (!wallet) {throw new Error('No wallet connected');}

      const signedTx = await createSignedUsdcTransferTransaction({
        senderPrivateKey: wallet.privateKey,
        recipientAddress,
        amount,
        memo,
      });

      const signature = await broadcastSignedTransaction(signedTx);

      const status = await waitForTransactionConfirmation(signature);

      const record: TransactionRecord = {
        id: generateId(),
        recipient: recipientAddress,
        amount,
        signature,
        status:
          status.status === 'confirmed'
            ? 'confirmed'
            : status.status === 'failed'
              ? 'failed'
              : 'pending',
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
