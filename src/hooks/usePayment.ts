import {useMutation, useQueryClient} from '@tanstack/react-query';
import {addRecentRecipient, appendToHistory} from '../services/storage';
import {buildSigner, waitForTransactionConfirmation} from '../services/solana';
import {sendWithSigner} from '../services/gasstationAdapter';
import {useWalletStore} from '../store/walletStore';
import {AltudeApiError, TransactionRecord} from '../types';
import {generateId} from '../utils/helpers';
import {STABLE_COIN_MINT} from '../services/solana';

interface SendPaymentParams {
  recipientAddress: string;
  amount: number;
  memo?: string;
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
    }: SendPaymentParams): Promise<TransactionRecord> => {
      try {
        if (!wallet) {
          throw new Error('No wallet connected');
        }

        const sourceSigner = buildSigner(wallet);

        // The JS gas station SDK takes raw base units, not the UI amount. USDC has 6 decimals.
        const amountBaseUnits = Math.round(amount * 1_000_000);

        const {signature} = await sendWithSigner(
          sourceSigner,
          recipientAddress,
          amountBaseUnits,
          STABLE_COIN_MINT,
        );

        const isMockSignature = signature.startsWith('MOCK_SIG_');
        const status = isMockSignature
          ? {signature, status: 'confirmed' as const, confirmed: true}
          : await waitForTransactionConfirmation(signature, 12, 1_500);

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
        };

        await Promise.all([
          appendToHistory(record),
          addRecentRecipient(recipientAddress),
        ]);

        if (record.status === 'failed') {
          throw new Error(status.error ?? 'Payment failed to confirm');
        }

        return record;
      } catch (error) {
        throw toPaymentError(error);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['balance']});
    },
  });
}

