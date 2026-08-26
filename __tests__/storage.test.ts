import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  appendToHistory,
  clearHistory,
  getHistory,
  updateHistoryRecord,
} from '../src/services/storage';
import {TransactionRecord} from '../src/types';

const RECORD: TransactionRecord = {
  id: 'record-1',
  walletAddress: 'sender',
  data: [
    {
      signature: 'signature-1',
      slot: 42,
      blockTime: 1_786_962_240,
      status: 'success',
      type: 'send',
      amount: 5,
      from: 'sender',
      to: 'recipient',
    },
  ],
  page: 1,
  pageSize: 1,
  limit: 1,
  offset: 0,
  total: 1,
  status: 'success',
};

describe('transaction history storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns a valid empty page when no history is stored', async () => {
    await expect(getHistory()).resolves.toEqual({
      id: '',
      walletAddress: '',
      data: [],
      page: 1,
      pageSize: 0,
      limit: 0,
      offset: 0,
      total: 0,
      status: 'success',
    });

    await clearHistory();
    await expect(getHistory()).resolves.toEqual(
      expect.objectContaining({data: [], total: 0}),
    );
  });

  it('prepends records without nesting data and returns the stored page', async () => {
    const stored = await appendToHistory(RECORD);

    expect(stored.data).toEqual(RECORD.data);
    expect(stored.total).toBe(1);
    await expect(getHistory()).resolves.toEqual(stored);
  });

  it('updates an item by signature while preserving page metadata', async () => {
    await appendToHistory(RECORD);
    await updateHistoryRecord('signature-1', {status: 'failed'});

    await expect(getHistory()).resolves.toEqual({
      ...RECORD,
      data: [{...RECORD.data[0], status: 'failed'}],
    });
  });
});
