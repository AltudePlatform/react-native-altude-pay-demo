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
import {GetHistorySummary, TransactionRecord} from '../../src/types';

const WALLET = {
  publicKey: '7VfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  privateKey: '11'.repeat(32),
};

const HISTORY: GetHistorySummary[] = [
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
  {
    signature: '7unknownTransactionSignature1234567890abcdef',
    slot: 40,
    blockTime: null,
    status: 'pending',
    type: 'unknown',
    amount: 3.5,
  },
];

const HISTORY_PAGE: TransactionRecord = {
  id: 'history-1',
  walletAddress: WALLET.publicKey,
  data: HISTORY,
  page: 1,
  pageSize: 20,
  limit: 20,
  offset: 0,
  total: HISTORY.length,
  status: 'success',
};

const RECORD = HISTORY[0];
const mockGetHistory = jest.fn();

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

jest.mock('../../src/services/gasstationAdapter', () => {
  return {
    getGasstation: jest.fn(),
  };
});

jest.mock('../../src/services/storage', () => ({
  getRecentRecipients: jest.fn(async () => []),
  getUserPreferences: jest.fn(async () => ({confirmBeforeSending: true})),
}));

jest.mock('../../src/services/explorer', () => ({
  buildSolscanTxUrl: jest.fn(async () => 'https://solscan.io/tx/x?cluster=devnet'),
}));

jest.mock('../../src/config/apiConfig', () => ({
  hasAltudeApiKey: jest.fn(() => true),
}));

import {useBalance} from '../../src/hooks/useBalance';
import {getGasstation} from '../../src/services/gasstationAdapter';
import {getRecentRecipients} from '../../src/services/storage';
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
  (getGasstation as jest.Mock).mockResolvedValue({
    getHistory: mockGetHistory,
  });
  mockGetHistory.mockResolvedValue({...HISTORY_PAGE, data: []});
  (getRecentRecipients as jest.Mock).mockResolvedValue([]);
});

afterAll(() => {
  dateNowSpy.mockRestore();
});

describe('Home', () => {
  it('with balance and activity', async () => {
    mockGetHistory.mockResolvedValue(HISTORY_PAGE);
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
    (getGasstation as jest.Mock).mockRejectedValue(new Error('nope'));
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
    mockGetHistory.mockResolvedValue(HISTORY_PAGE);
    expect(await renderScreen(HistoryScreen)).toMatchSnapshot();
  });

  it('empty', async () => {
    expect(await renderScreen(HistoryScreen)).toMatchSnapshot();
  });

  it('error', async () => {
    mockGetHistory.mockRejectedValue(
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
    (getRecentRecipients as jest.Mock).mockResolvedValue([RECORD.to]);
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
        params: {amount: '25.00', recipient: RECORD.to},
      }),
    ).toMatchSnapshot();
  });
});

describe('Receipt', () => {
  it('shows a sent payment', async () => {
    expect(
      await renderScreen(ReceiptScreen, {params: {receiptData: RECORD}}),
    ).toMatchSnapshot();
  });

  it('shows a received payment with its sender', async () => {
    expect(
      await renderScreen(ReceiptScreen, {
        params: {receiptData: HISTORY[1]},
      }),
    ).toMatchSnapshot();
  });

  it('shows an unknown transaction without inventing a direction', async () => {
    expect(
      await renderScreen(ReceiptScreen, {params: {receiptData: HISTORY[2]}}),
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
