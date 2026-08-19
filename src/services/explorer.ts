import {getTransactionConfig} from './altudeApi';

const SOLSCAN_TX_BASE = 'https://solscan.io/tx';

// Solscan omits the query param for mainnet and expects the cluster name otherwise.
function toSolscanCluster(rpcEnvironment: string | null | undefined): string | null {
  const normalized = (rpcEnvironment ?? '').trim().toLowerCase();

  if (!normalized || normalized === 'mainnet' || normalized === 'mainnet-beta') {
    return null;
  }

  return normalized;
}

export async function buildSolscanTxUrl(signature: string): Promise<string> {
  const config = await getTransactionConfig();
  const cluster = toSolscanCluster(config.RpcEnvironment);

  return cluster
    ? `${SOLSCAN_TX_BASE}/${signature}?cluster=${cluster}`
    : `${SOLSCAN_TX_BASE}/${signature}`;
}
