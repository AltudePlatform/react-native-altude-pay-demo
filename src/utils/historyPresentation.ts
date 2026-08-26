import {GetHistorySummary} from '../types';
import {formatRelativeDate} from './format';

export function getHistoryPresentation(item: GetHistorySummary) {
  const amount = item.amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
  const date =
    item.blockTime === null
      ? 'Date unavailable'
      : formatRelativeDate(new Date(item.blockTime * 1000).toString());
  const leadingTone =
    item.status === 'failed'
      ? 'error'
      : item.status === 'pending' || item.type === 'unknown'
        ? 'neutral'
        : 'success';

  switch (item.type) {
    case 'send':
      return {
        title: 'Payment',
        icon: 'arrowUpRight',
        leadingTone,
        value: `-$${amount}`,
        date,
        counterparty: item.to,
        counterpartyPrefix: 'to',
        counterpartyLabel: 'Recipient',
      } as const;
    case 'receive':
      return {
        title: 'Incoming payment',
        icon: 'arrowDownLeft',
        leadingTone,
        value: `+$${amount}`,
        date,
        counterparty: item.from,
        counterpartyPrefix: 'from',
        counterpartyLabel: 'Sender',
      } as const;
    default:
      return {
        title: 'Transaction',
        icon: 'clock',
        leadingTone,
        value: `$${amount}`,
        date,
        counterparty: undefined,
        counterpartyPrefix: undefined,
        counterpartyLabel: undefined,
      } as const;
  }
}
