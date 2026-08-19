/**
 * Display formatting. Pure functions, no native modules.
 */

/** Currency formatting for balances and amounts. */
export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount)) {
    return '$0.00';
  }

  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Compact relative date for activity rows.
 *
 * Activity rows previously showed a truncated transaction signature as their
 * only supporting line, even though the history entry already carried a
 * timestamp. This surfaces information a person can actually use.
 */
export function formatRelativeDate(
  value: string | null | undefined,
  now: number = Date.now(),
): string {
  if (!value) {
    return 'Date unavailable';
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return 'Date unavailable';
  }

  const elapsed = now - timestamp;

  if (elapsed < 0) {
    return 'Just now';
  }
  if (elapsed < MINUTE) {
    return 'Just now';
  }
  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `${minutes} min ago`;
  }
  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (elapsed < 7 * DAY) {
    const days = Math.floor(elapsed / DAY);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year:
      new Date(timestamp).getFullYear() === new Date(now).getFullYear()
        ? undefined
        : 'numeric',
  });
}

/** Absolute date/time for receipts, where precision matters. */
export function formatAbsoluteDate(value: string | null | undefined): string {
  if (!value) {
    return 'Unknown';
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return 'Unknown';
  }

  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
