// Re-export from gasstationAdapter for backward compatibility
export {getTransactionConfig, sendWithSigner} from './gasstationAdapter';
import * as altudeApi from './altudeApi';

export async function sendTransaction(signedTransaction: string): Promise<{signature: string}> {
  // Fallback: HTTP API-based sender
  const res = await altudeApi.sendTransactionToAltude(signedTransaction);
  return {signature: (res as any).signature ?? ''};
}

export default {
  getTransactionConfig: () => altudeApi.getTransactionConfig(),
  sendTransaction,
};
