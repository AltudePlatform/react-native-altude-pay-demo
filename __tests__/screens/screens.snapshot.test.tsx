/**
 * Phase 0 baseline: structural snapshots of every user-facing screen and its
 * important states.
 *
 * These exist to make the visual-system work reviewable. A style-only change
 * should move style props; it must NOT add, remove, or reorder nodes. The
 * Send screen in particular is protected - its snapshot must show zero
 * structural delta across the whole design-system migration.
 */
import React from 'react';
import {renderScreen} from '../setup/renderScreen';
import {TransactionRecord} from '../../src/types';
import type {TransactionSummary} from '../../src/services/solana';

const WALLET = {
  publicKey: '7VfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  privateKey: '11'.repeat(32),
};

const HISTORY: TransactionSummary[] = [
  {
    signature: '5r8Kd1yQwWc9vX2mTgY7bNqZaLp3EeF6HhJjKkMmNnPp',
    slot: 42,
    blockTime: 1786962240,
    status: 'success',
    type: 'send',
    amount: 42.5,
    to: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
  },
  {
    signature: '3aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcdEF',
    slot: 41,
    blockTime: 1786867320,
    status: 'success',
    type: 'receive',
    amount: 18.25,
    from: '4Nd1mYwqA8sVXspn8QyJFrhbs91ZFVDJ5kJ4DqpKB7mR',
  },
];

const RECORD: TransactionRecord = {
  id: 'tx-1',
  recipient: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
  amount: 42.5,
  signature: HISTORY[0].signature,
  status: 'confirmed',
  date: '2026-08-17T10:24:00.000Z',
};

const LOCAL_HISTORY: TransactionRecord[] = [
  RECORD,
  {
    id: 'tx-2',
    recipient: '4Nd1mYwqA8sVXspn8QyJFrhbs91ZFVDJ5kJ4DqpKB7mR',
    amount: 18.25,
    signature: HISTORY[1].signature,
    status: 'confirmed',
    date: '2026-08-16T08:02:00.000Z',
  },
];

const MOCK_RECORD: TransactionRecord = {
  ...RECORD,
  id: 'tx-mock',
  signature: 'MOCK_SIG_receipt123',
};

jest.mock('../../src/hooks/useBalance', () => ({
  useBalance: jest.fn(() => ({
    data: {walletAddress: 'x', solBalance: 0, usdcBalance: 1250.75},
    isLoading: false,
    refetch: jest.fn(async () => undefined),
  })),
}));

jest.mock('../../src/hooks/usePayment', () => ({
  usePayment: jest.fn(() => ({mutate: jest.fn()})),
}));

jest.mock('../../src/services/solana', () => {
  const actual = jest.requireActual('../../src/services/solana');
  return {
    ...actual,
    getAccountHistory: jest.fn(async () => []),
    getSignatureHistory: jest.fn(async () => null),
  };
});

jest.mock('../../src/services/storage', () => ({
  getRecentRecipients: jest.fn(async () => []),
  getUserPreferences: jest.fn(async () => ({confirmBeforeSending: true})),
  getHistory: jest.fn(async () => []),
}));

jest.mock('../../src/services/explorer', () => ({
  buildSolscanTxUrl: jest.fn(async () => 'https://solscan.io/tx/x?cluster=devnet'),
}));

jest.mock('../../src/config/apiConfig', () => ({
  hasAltudeApiKey: jest.fn(() => true),
}));

import {useBalance} from '../../src/hooks/useBalance';
import {getSignatureHistory} from '../../src/services/solana';
import {getHistory, getRecentRecipients} from '../../src/services/storage';
import {useWalletStore} from '../../src/store/walletStore';

import HomeScreen from '../../src/screens/HomeScreen';
import SendScreen from '../../src/screens/SendScreen';
import HistoryScreen from '../../src/screens/HistoryScreen';
import PayAddressScreen from '../../src/screens/PayAddressScreen';
import PaymentStatusScreen from '../../src/screens/PaymentStatusScreen';
import ReceiptScreen from '../../src/screens/ReceiptScreen';
import OnboardingScreen from '../../src/screens/OnboardingScreen';
import PreparingAccountScreen from '../../src/screens/PreparingAccountScreen';
import ScanScreen from '../../src/screens/ScanScreen';
import QRScreen from '../../src/screens/QRScreen';

const noop = async () => undefined;

let dateNowSpy: jest.SpyInstance;

beforeAll(() => {
  dateNowSpy = jest
    .spyOn(Date, 'now')
    .mockReturnValue(Date.parse('2026-08-18T10:24:00.000Z'));
});

beforeEach(() => {
  jest.clearAllMocks();
  useWalletStore.setState({wallet: WALLET});
  (useBalance as jest.Mock).mockReturnValue({
    data: {walletAddress: 'x', solBalance: 0, usdcBalance: 1250.75},
    isLoading: false,
    refetch: jest.fn(async () => undefined),
  });
  (getSignatureHistory as jest.Mock).mockResolvedValue(null);
  (getHistory as jest.Mock).mockResolvedValue([]);
  (getRecentRecipients as jest.Mock).mockResolvedValue([]);
});

afterAll(() => {
  dateNowSpy.mockRestore();
});

describe('Home', () => {
  it('with balance and activity', async () => {
    (getHistory as jest.Mock).mockResolvedValue(LOCAL_HISTORY);
    expect(
      await renderScreen(() => <HomeScreen onLogout={noop} />),
    ).toMatchSnapshot();
  });

  it('empty activity', async () => {
    expect(
      await renderScreen(() => <HomeScreen onLogout={noop} />),
    ).toMatchSnapshot();
  });

  it('activity load error', async () => {
    (getHistory as jest.Mock).mockRejectedValue(new Error('nope'));
    expect(
      await renderScreen(() => <HomeScreen onLogout={noop} />),
    ).toMatchSnapshot();
  });

  it('balance loading', async () => {
    (useBalance as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: jest.fn(async () => undefined),
    });
    expect(
      await renderScreen(() => <HomeScreen onLogout={noop} />),
    ).toMatchSnapshot();
  });

  it('no wallet on device', async () => {
    useWalletStore.setState({wallet: null});
    expect(
      await renderScreen(() => <HomeScreen onLogout={noop} />),
    ).toMatchSnapshot();
  });
});

// PROTECTED SCREEN. Structural changes to these snapshots are a regression.
describe('Send (protected)', () => {
  it('default zero amount', async () => {
    expect(await renderScreen(SendScreen)).toMatchSnapshot();
  });

  it('balance unavailable', async () => {
    (useBalance as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: jest.fn(async () => undefined),
    });
    expect(await renderScreen(SendScreen)).toMatchSnapshot();
  });
});

describe('History', () => {
  it('with entries', async () => {
    (getHistory as jest.Mock).mockResolvedValue(LOCAL_HISTORY);
    expect(await renderScreen(HistoryScreen)).toMatchSnapshot();
  });

  it('empty', async () => {
    expect(await renderScreen(HistoryScreen)).toMatchSnapshot();
  });

  it('error', async () => {
    (getHistory as jest.Mock).mockRejectedValue(
      new Error('Activity could not be loaded.'),
    );
    expect(await renderScreen(HistoryScreen)).toMatchSnapshot();
  });
});

describe('PayAddress', () => {
  it('empty recipient', async () => {
    expect(
      await renderScreen(PayAddressScreen, {params: {amount: '25.00'}}),
    ).toMatchSnapshot();
  });

  it('with recent recipients', async () => {
    (getRecentRecipients as jest.Mock).mockResolvedValue([RECORD.recipient]);
    expect(
      await renderScreen(PayAddressScreen, {params: {amount: '25.00'}}),
    ).toMatchSnapshot();
  });

  it('amount exceeds balance', async () => {
    expect(
      await renderScreen(PayAddressScreen, {params: {amount: '99999'}}),
    ).toMatchSnapshot();
  });
});

describe('PaymentStatus', () => {
  it('in flight', async () => {
    expect(
      await renderScreen(PaymentStatusScreen, {
        params: {amount: '25.00', recipient: RECORD.recipient},
      }),
    ).toMatchSnapshot();
  });
});

describe('Receipt', () => {
  it('shows an unavailable state when the record cannot be resolved', async () => {
    expect(
      await renderScreen(ReceiptScreen, {params: {signature: RECORD.signature}}),
    ).toMatchSnapshot();
  });

  it('uses a stored record without querying mock signatures on chain', async () => {
    (getHistory as jest.Mock).mockResolvedValue([MOCK_RECORD]);
    expect(
      await renderScreen(ReceiptScreen, {
        params: {signature: MOCK_RECORD.signature},
      }),
    ).toMatchSnapshot();
    expect(getSignatureHistory).not.toHaveBeenCalled();
  });

  it('uses a resolved chain record', async () => {
    (getSignatureHistory as jest.Mock).mockResolvedValue(HISTORY[0]);
    expect(
      await renderScreen(ReceiptScreen, {params: {signature: RECORD.signature}}),
    ).toMatchSnapshot();
  });
});

describe('Onboarding', () => {
  it('phone contact method', async () => {
    expect(await renderScreen(OnboardingScreen)).toMatchSnapshot();
  });
});

describe('Preparing', () => {
  it('in progress', async () => {
    const profile = {
      name: 'Ada',
      countryCode: '+1',
      phoneNumber: '5551234567',
      email: '',
      completedAt: '2026-08-17T10:00:00.000Z',
    };
    expect(
      await renderScreen(() => (
        <PreparingAccountScreen
          profile={profile}
          onPrepare={() => new Promise(() => {})}
        />
      )),
    ).toMatchSnapshot();
  });
});

describe('Scan', () => {
  it('camera permission state', async () => {
    expect(await renderScreen(ScanScreen)).toMatchSnapshot();
  });
});

// Currently unreachable in the app; snapshotted so a token sweep cannot
// silently break it if it is ever wired up.
describe('QR (unreachable route)', () => {
  it('with wallet', async () => {
    expect(await renderScreen(QRScreen)).toMatchSnapshot();
  });

  it('without wallet', async () => {
    useWalletStore.setState({wallet: null});
    expect(await renderScreen(QRScreen)).toMatchSnapshot();
  });
});
