/**
 * Navigator-level smoke tests.
 *
 * The per-screen snapshot tests render screens in isolation, so they cannot
 * catch integration faults in the navigator itself. This suite exists because
 * one slipped through: React Navigation invokes the `tabBar` prop as a plain
 * function, so passing a hook-using component directly (rather than an arrow
 * returning an element) raised "invalid hook call" at runtime while every
 * screen test stayed green.
 */
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

jest.mock('../src/hooks/useBalance', () => ({
  useBalance: () => ({
    data: {walletAddress: 'x', solBalance: 0, usdcBalance: 12.5},
    isLoading: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('../src/services/altudeHistory', () => ({
  ...jest.requireActual('../src/services/altudeHistory'),
  getAccountPaymentHistory: jest.fn(async () => []),
}));

jest.mock('../src/services/storage', () => ({
  getRecentRecipients: jest.fn(async () => []),
  getUserPreferences: jest.fn(async () => ({confirmBeforeSending: true})),
  getHistory: jest.fn(async () => []),
}));

import AppNavigator from '../src/navigation/AppNavigator';
import {ToastProvider} from '../src/components/ui/Toast';
import {useWalletStore} from '../src/store/walletStore';

const noop = async () => undefined;

function textsOf(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAllByType(Text)
    .map(node =>
      (Array.isArray(node.props.children)
        ? node.props.children.join('')
        : node.props.children) ?? '',
    )
    .filter((value): value is string => typeof value === 'string');
}

async function renderApp(onboardingComplete: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false, gcTime: 0}},
  });

  let tree: renderer.ReactTestRenderer | undefined;
  await act(async () => {
    tree = renderer.create(
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider
          initialMetrics={{
            frame: {x: 0, y: 0, width: 390, height: 844},
            insets: {top: 47, left: 0, right: 0, bottom: 34},
          }}>
          <ToastProvider>
            <AppNavigator
              onboardingComplete={onboardingComplete}
              onOnboardingComplete={noop}
              onLogout={noop}
            />
          </ToastProvider>
        </SafeAreaProvider>
      </QueryClientProvider>,
    );
  });

  return tree!;
}

beforeEach(() => {
  useWalletStore.setState({
    wallet: {
      publicKey: '7VfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
      privateKey: '11'.repeat(32),
    },
  });
});

describe('AppNavigator', () => {
  it('mounts the tab navigator and its custom tab bar without hook errors', async () => {
    const tree = await renderApp(true);
    const texts = textsOf(tree);

    // Tab bar rendered.
    expect(texts).toContain('Home');
    expect(texts).toContain('Pay');

    // Home rendered behind it.
    expect(texts).toContain('AVAILABLE BALANCE');

    await act(async () => tree.unmount());
  });

  it('exposes both tabs to assistive technology', async () => {
    const tree = await renderApp(true);

    // Host components only; Pressable also forwards the role to its wrappers.
    const tabs = tree.root.findAll(
      node =>
        typeof node.type === 'string' &&
        node.props?.accessibilityRole === 'tab',
    );

    expect(tabs).toHaveLength(2);
    // Exactly one tab is selected at a time.
    expect(
      tabs.filter(tab => tab.props.accessibilityState?.selected),
    ).toHaveLength(1);

    await act(async () => tree.unmount());
  });

  it('starts on onboarding when setup is incomplete', async () => {
    const tree = await renderApp(false);
    expect(textsOf(tree)).toContain('Set up your payment profile');

    await act(async () => tree.unmount());
  });
});
