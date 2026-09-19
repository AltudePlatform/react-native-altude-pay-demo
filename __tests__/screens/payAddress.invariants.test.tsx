import Clipboard from '@react-native-clipboard/clipboard';
import {Alert, TextInput} from 'react-native';
import {act} from 'react-test-renderer';

import {renderScreenInstance} from '../setup/renderScreen';
import {useWalletStore} from '../../src/store/walletStore';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      ...actual.useNavigation(),
      navigate: mockNavigate,
    }),
  };
});

jest.mock('../../src/hooks/useBalance', () => ({
  useBalance: jest.fn(() => ({
    data: {walletAddress: 'sender', solBalance: 0, usdcBalance: 500},
    isLoading: false,
  })),
}));
jest.mock('../../src/services/storage', () => ({
  getRecentRecipients: jest.fn(async () => []),
  getUserPreferences: jest.fn(async () => ({confirmBeforeSending: true})),
}));

import PayAddressScreen from '../../src/screens/PayAddressScreen';
import {Button} from '../../src/components/ui';
import {getUserPreferences} from '../../src/services/storage';

const recipient = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

describe('PayAddress payment flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWalletStore.setState({
      wallet: {
        publicKey: 'sender',
        privateKey: '11'.repeat(32),
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts payment immediately, ignores the legacy confirmation preference, and blocks rapid taps', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const tree = await renderScreenInstance(PayAddressScreen, {
      params: {amount: '5', recipient},
    });
    const pay = tree.root.findAllByType(Button).find(node => node.props.label === 'Pay')!;

    await act(async () => {
      pay.props.onPress();
      pay.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('PaymentStatus', {amount: '5', recipient});
    expect(alert).not.toHaveBeenCalled();
    expect(getUserPreferences).not.toHaveBeenCalled();
    await act(async () => tree.unmount());
  });

  it.each([
    ['invalid amount', '0', recipient, 'Amount is invalid. Return to Pay and enter a valid amount.'],
    ['insufficient balance', '501', recipient, 'You only have $500.00 available. Enter a smaller amount.'],
    ['invalid address', '5', 'invalid', 'This is not a valid Solana address.'],
    ['system program', '5', '11111111111111111111111111111111', 'Enter a wallet address, not the Solana system-program address.'],
  ])('still rejects %s before initiating payment', async (_case, amount, address, message) => {
    const alert = jest.spyOn(Alert, 'alert');
    const tree = await renderScreenInstance(PayAddressScreen, {
      params: {amount, recipient: address},
    });
    const pay = tree.root.findAllByType(Button).find(node => node.props.label === 'Pay')!;

    await act(async () => pay.props.onPress());

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith('Validation Error', message);
    await act(async () => tree.unmount());
  });

  it('allows a corrected recipient to be submitted after validation fails', async () => {
    jest.spyOn(Alert, 'alert');
    const tree = await renderScreenInstance(PayAddressScreen, {
      params: {amount: '5', recipient: 'invalid'},
    });
    const pay = () => tree.root.findAllByType(Button).find(node => node.props.label === 'Pay')!;

    await act(async () => pay().props.onPress());
    expect(mockNavigate).not.toHaveBeenCalled();

    await act(async () => tree.root.findByType(TextInput).props.onChangeText(recipient));
    await act(async () => pay().props.onPress());

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('PaymentStatus', {amount: '5', recipient});
    await act(async () => tree.unmount());
  });

  it('preserves an overlong pasted address for validation', async () => {
    const pasted = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDUx';
    (Clipboard.getString as jest.Mock).mockResolvedValue(pasted);
    const tree = await renderScreenInstance(PayAddressScreen, {
      params: {amount: '5'},
    });
    const paste = tree.root.find(
      node =>
        node.props.accessibilityLabel === 'Paste address from clipboard' &&
        typeof node.props.onPress === 'function',
    );

    await act(async () => paste.props.onPress());

    const input = tree.root.findByType(TextInput);
    expect(input.props.value).toBe(pasted);
    expect(
      tree.root.findAll(
        node => node.props.children === 'This is not a valid Solana address.',
      ),
    ).not.toHaveLength(0);

    await act(async () => tree.unmount());
  });
});
