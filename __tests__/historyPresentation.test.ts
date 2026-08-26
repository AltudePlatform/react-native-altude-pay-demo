import {getHistoryPresentation} from '../src/utils/historyPresentation';
import {GetHistorySummary} from '../src/types';

const BASE: GetHistorySummary = {
  signature: 'signature',
  slot: 42,
  blockTime: null,
  status: 'success',
  type: 'send',
  amount: 12.5,
  from: 'sender',
  to: 'recipient',
};

describe('history presentation', () => {
  it('presents sends and receives with their actual counterparties', () => {
    expect(getHistoryPresentation(BASE)).toEqual(
      expect.objectContaining({
        title: 'Payment',
        value: '-$12.5',
        counterparty: 'recipient',
        counterpartyPrefix: 'to',
      }),
    );
    expect(
      getHistoryPresentation({
        ...BASE,
        type: 'receive',
      }),
    ).toEqual(
      expect.objectContaining({
        title: 'Incoming payment',
        value: '+$12.5',
        counterparty: 'sender',
        counterpartyPrefix: 'from',
      }),
    );
  });

  it('uses neutral direction and date labels for unknown history', () => {
    expect(
      getHistoryPresentation({
        ...BASE,
        type: 'unknown',
        status: 'pending',
      }),
    ).toEqual(
      expect.objectContaining({
        title: 'Transaction',
        icon: 'clock',
        leadingTone: 'neutral',
        value: '$12.5',
        date: 'Date unavailable',
        counterparty: undefined,
      }),
    );
  });
});
