import type {
  AltudeTransactionConfig,
  AltudeTransactionSendResponse,
} from '../types';

// Local fallback to existing HTTP-based implementation
import * as altudeApi from './altudeApi';
import * as gasstationAdapter from './gasstationAdapter';

let core: any | null = null;

function tryLoadCore() {
  if (core !== null) return core;

  try {
    // Use require so bundlers that don't include the package won't fail at import time
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    core = require('@altude/core');
  } catch (e) {
    core = null;
  }

  return core;
}

function tryLoadGasstationAdapter() {
  try {
    const gs = gasstationAdapter.tryLoadGasstation();
    return gs;
  } catch {
    return null;
  }
}

export async function getTransactionConfig(
  forceRefresh = false,
): Promise<AltudeTransactionConfig> {
  // Prefer gasstation if available
  try {
    const gs = tryLoadGasstationAdapter();
    if (gs && typeof gs.getTransactionConfig === 'function') {
      return (await gs.getTransactionConfig({forceRefresh})) as AltudeTransactionConfig;
    }
  } catch {
    // continue to other fallbacks
  }

  const loaded = tryLoadCore();
  if (loaded && typeof loaded.getTransactionConfig === 'function') {
    // Prefer SDK-provided method if available
    return (await loaded.getTransactionConfig({forceRefresh})) as AltudeTransactionConfig;
  }

  // Fallback to existing HTTP implementation
  return altudeApi.getTransactionConfig(forceRefresh);
}

export async function sendTransaction(signedTransaction: string): Promise<AltudeTransactionSendResponse> {
  // Prefer gasstation if available
  try {
    const gs = tryLoadGasstationAdapter();
    if (gs && typeof gs.send === 'function') {
      // gasstationAdapter.sendTransaction returns {signature}
      const res = await gasstationAdapter.sendTransaction(signedTransaction);
      return {signature: res.signature} as AltudeTransactionSendResponse;
    }
  } catch {
    // continue to other fallbacks
  }

  const loaded = tryLoadCore();
  if (loaded && typeof loaded.sendTransaction === 'function') {
    return (await loaded.sendTransaction(signedTransaction)) as AltudeTransactionSendResponse;
  }

  // Fallback to the HTTP API-based sender
  return altudeApi.sendTransactionToAltude(signedTransaction);
}

export default {
  getTransactionConfig,
  sendTransaction,
};
