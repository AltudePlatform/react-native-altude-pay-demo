import {useMutation, useQueryClient} from '@tanstack/react-query';
import {addRecentRecipient} from '../services/storage';
import {buildSigner, waitForTransactionConfirmation} from '../services/solana';
import {sendWithSigner} from '../services/gasstationAdapter';
import {useWalletStore} from '../store/walletStore';
import {AltudeApiError, TransactionRecord} from '../types';
import {generateId} from '../utils/helpers';
import {STABLE_COIN_MINT} from '../services/solana';

export type PaymentStage = 'signing' | 'sending' | 'confirming';

interface SendPaymentParams {
  recipientAddress: string;
  amount: number;
  memo?: string;
  onStage?: (stage: PaymentStage) => void;
}

function toPaymentError(error: unknown): Error {
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as AltudeApiError;

    if (apiError.status === 401 || apiError.status === 403) {
      return new Error('Altude API key is invalid or missing access.');
    }

    if (apiError.status === 400) {
      return new Error(apiError.detail || 'Altude rejected the transaction payload.');
    }

    if (apiError.status >= 500) {
      return new Error('Altude service is temporarily unavailable. Try again shortly.');
    }

    return new Error(apiError.detail || 'Altude API request failed.');
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Payment failed due to an unexpected error.');
}

export function usePayment() {
  const wallet = useWalletStore(s => s.wallet);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipientAddress,
      amount,
      memo: _memo,
      onStage,
    }: SendPaymentParams): Promise<TransactionRecord> => {
      try {
        if (!wallet) {
          throw new Error('No wallet connected');
        }

        onStage?.('signing');
        const sourceSigner = buildSigner(wallet);

        // The JS gas station SDK takes raw base units, not the UI amount. USDC has 6 decimals.
        const amountBaseUnits = Math.round(amount * 1_000_000);

        onStage?.('sending');
        const {signature} = await sendWithSigner(
          sourceSigner,
          recipientAddress,
          amountBaseUnits,
          STABLE_COIN_MINT,
        );

        onStage?.('confirming');
        const isMockSignature = signature.startsWith('MOCK_SIG_');
        const status = isMockSignature
          ? {signature, status: 'confirmed' as const, confirmed: true}
          : await waitForTransactionConfirmation(signature, 12, 1_500);

        const historyStatus =
          status.status === 'confirmed'
            ? 'success'
            : status.status === 'failed'
              ? 'failed'
              : 'pending';
        const record: TransactionRecord = {
          id: generateId(),
          walletAddress: wallet.publicKey,
          data: [
            {
              signature,
              slot: status.slot ?? 0,
              blockTime: Math.floor(Date.now() / 1000),
              status: historyStatus,
              type: 'send',
              amount,
              from: wallet.publicKey,
              to: recipientAddress,
            },
          ],
          page: 1,
          pageSize: 1,
          limit: 1,
          offset: 0,
          total: 1,
          status: historyStatus,
        };

        if (record.data[0].status === 'failed') {
          throw new Error(status.error ?? 'Payment failed to confirm');
        }

        await addRecentRecipient(recipientAddress);
        return record;
      } catch (error) {
        console.error(error);
        throw toPaymentError(error);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['balance']});
    },
  });
}
