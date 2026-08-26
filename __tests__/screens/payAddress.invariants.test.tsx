import Clipboard from '@react-native-clipboard/clipboard';
import {TextInput} from 'react-native';
import {act} from 'react-test-renderer';

import {renderScreenInstance} from '../setup/renderScreen';
import {useWalletStore} from '../../src/store/walletStore';

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

describe('PayAddress clipboard handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWalletStore.setState({
      wallet: {
        publicKey: 'sender',
        privateKey: '11'.repeat(32),
      },
    });
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
