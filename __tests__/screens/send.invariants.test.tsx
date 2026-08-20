/**
 * Send screen protection tests.
 *
 * The Send screen's information architecture, flow, and interaction model are
 * protected. The design-system migration is allowed to restyle it and to adopt
 * shared primitives, but it must NOT change what the screen is or how it
 * behaves.
 *
 * A raw snapshot cannot express that distinction - swapping a TouchableOpacity
 * for the shared Button legitimately rewrites the node tree. These assertions
 * pin the semantics instead.
 */
import {act} from 'react-test-renderer';
import {Text} from 'react-native';

import {renderScreenInstance} from '../setup/renderScreen';

const mockNavigate = jest.fn();

jest.mock('../../src/hooks/useBalance', () => ({
  useBalance: jest.fn(() => ({
    data: {walletAddress: 'x', solBalance: 0, usdcBalance: 500},
    isLoading: false,
    refetch: jest.fn(),
  })),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {...actual, useNavigation: () => ({navigate: mockNavigate})};
});

import SendScreen from '../../src/screens/SendScreen';
import {useBalance} from '../../src/hooks/useBalance';

/** Collects the rendered text of every Text node, in document order. */
function textsOf(tree: ReturnType<typeof act> extends never ? never : any): string[] {
  return tree.root
    .findAllByType(Text)
    .map((node: any) =>
      (Array.isArray(node.props.children)
        ? node.props.children.join('')
        : node.props.children) ?? '',
    )
    .filter((value: unknown): value is string => typeof value === 'string');
}

function buttonsOf(tree: any) {
  return tree.root
    .findAll(
      (node: any) =>
        node.props?.accessibilityRole === 'button' &&
        typeof node.props?.onPress === 'function',
    )
    .filter((node: any) => node.type !== 'View');
}

beforeEach(() => {
  jest.clearAllMocks();
  (useBalance as jest.Mock).mockReturnValue({
    data: {walletAddress: 'x', solBalance: 0, usdcBalance: 500},
    isLoading: false,
    refetch: jest.fn(),
  });
});

describe('Send screen protected behaviour', () => {
  it('keeps the amount, keypad and single primary action in order', async () => {
    const tree = await renderScreenInstance(SendScreen);
    const texts = textsOf(tree);

    // Amount hero, in order: label, value, available balance.
    expect(texts).toContain('AMOUNT');
    expect(texts).toContain('$0');
    expect(texts).toContain('$500.00 available');

    // The keypad keeps all twelve keys in their original order.
    const keypad = texts.filter(t => /^[0-9.]$/.test(t));
    expect(keypad).toEqual([
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0',
    ]);

    // Exactly one primary action.
    expect(texts.filter(t => t === 'Pay')).toHaveLength(1);

    await act(async () => tree.unmount());
  });

  it('builds the amount from keypad taps and navigates with it', async () => {
    const tree = await renderScreenInstance(SendScreen);

    const press = async (label: string) => {
      const key = buttonsOf(tree).find(
        (node: any) => node.props.accessibilityLabel === label,
      );
      expect(key).toBeDefined();
      await act(async () => key.props.onPress());
    };

    await press('2');
    await press('5');
    expect(textsOf(tree)).toContain('$25');

    await press('Delete last digit');
    expect(textsOf(tree)).toContain('$2');

    const pay = buttonsOf(tree).find(
      (node: any) => node.props.accessibilityLabel === 'Pay',
    );
    await act(async () => pay.props.onPress());

    expect(mockNavigate).toHaveBeenCalledWith('PayAddress', {amount: '2'});

    await act(async () => tree.unmount());
  });

  it('disables the primary action at zero instead of alerting on submit', async () => {
    const tree = await renderScreenInstance(SendScreen);

    const pay = buttonsOf(tree).find(
      (node: any) => node.props.accessibilityLabel === 'Pay',
    );

    // Previously the CTA looked actionable at $0 and raised an alert on tap.
    expect(pay.props.accessibilityState).toMatchObject({disabled: true});

    await act(async () => tree.unmount());
  });

  it('warns and blocks when the amount exceeds the balance', async () => {
    (useBalance as jest.Mock).mockReturnValue({
      data: {walletAddress: 'x', solBalance: 0, usdcBalance: 3},
      isLoading: false,
      refetch: jest.fn(),
    });

    const tree = await renderScreenInstance(SendScreen);

    const press = async (label: string) => {
      const key = buttonsOf(tree).find(
        (node: any) => node.props.accessibilityLabel === label,
      );
      await act(async () => key.props.onPress());
    };

    await press('9');

    const texts = textsOf(tree);
    expect(texts).toContain('Not enough balance');
    expect(texts).toContain('You can send up to $3.00.');

    const pay = buttonsOf(tree).find(
      (node: any) => node.props.accessibilityLabel === 'Pay',
    );
    expect(pay.props.accessibilityState).toMatchObject({disabled: true});

    await act(async () => tree.unmount());
  });

  it('prompts for an amount when the balance has not loaded', async () => {
    (useBalance as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: jest.fn(),
    });

    const tree = await renderScreenInstance(SendScreen);
    expect(textsOf(tree)).toContain('How much do you want to pay?');

    await act(async () => tree.unmount());
  });

  it('labels every keypad key for screen readers', async () => {
    const tree = await renderScreenInstance(SendScreen);
    const labels = buttonsOf(tree).map((n: any) => n.props.accessibilityLabel);

    for (const digit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      expect(labels).toContain(digit);
    }
    expect(labels).toContain('Decimal point');
    expect(labels).toContain('Delete last digit');

    await act(async () => tree.unmount());
  });
});
