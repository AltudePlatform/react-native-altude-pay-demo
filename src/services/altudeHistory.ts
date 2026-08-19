import {fetchAccountHistory} from './gasstationAdapter';
import {AltudeHistoryEntry} from '../types';

/** Gas station transaction type for a token payment. */
export const PAYMENT_TRANSACTION_TYPE = 20;

export const TRANSACTION_TYPE_LABELS: Record<number, string> = {
  [PAYMENT_TRANSACTION_TYPE]: 'Payment',
};

export function transactionTypeLabel(type: number): string {
  return TRANSACTION_TYPE_LABELS[type] ?? `Type ${type}`;
}

function pick(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }
  return undefined;
}

function toEntry(value: unknown): AltudeHistoryEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const row = value as Record<string, unknown>;
  const signature = pick(row, 'signature', 'Signature');
  const transactionType = pick(row, 'transactionType', 'TransactionType');

  if (typeof signature !== 'string' || typeof transactionType !== 'number') {
    return null;
  }

  const createdAt = pick(row, 'createdAt', 'CreatedAt');
  const transactionStatus = pick(row, 'transactionStatus', 'TransactionStatus');
  const error = pick(row, 'error', 'Error');

  return {
    signature,
    transactionType,
    createdAt: typeof createdAt === 'string' ? createdAt : null,
    transactionStatus:
      typeof transactionStatus === 'number' ? transactionStatus : null,
    error: typeof error === 'string' && error.length > 0 ? error : null,
  };
}

function extractRows(payload: unknown): unknown[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const list = pick(root, 'TransactionList', 'transactionList');
  if (Array.isArray(list)) {
    return list;
  }

  const transactions = pick(root, 'Transactions', 'transactions');
  if (transactions && typeof transactions === 'object') {
    const items = pick(transactions as Record<string, unknown>, 'Items', 'items');
    if (Array.isArray(items)) {
      return items;
    }
  }

  return [];
}

export async function getAccountPaymentHistory(
  account: string,
  limit = 20,
  offset = 0,
): Promise<AltudeHistoryEntry[]> {
  const payload = await fetchAccountHistory({account, limit, offset});

  return extractRows(payload)
    .map(toEntry)
    .filter(
      (entry): entry is AltudeHistoryEntry =>
        entry !== null && entry.transactionType === PAYMENT_TRANSACTION_TYPE,
    );
}
