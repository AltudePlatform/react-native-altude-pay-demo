import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

jest.mock('../src/services/solana', () => ({
  buildSigner: jest.fn(() => ({address: 'sender'})),
  waitForTransactionConfirmation: jest.fn(),
  STABLE_COIN_MINT: 'usdc-mint',
}));
jest.mock('../src/services/gasstationAdapter', () => ({
  sendWithSigner: jest.fn(),
}));
jest.mock('../src/services/storage', () => ({
  addRecentRecipient: jest.fn(),
}));

import {usePayment} from '../src/hooks/usePayment';
import {sendWithSigner} from '../src/services/gasstationAdapter';
import {waitForTransactionConfirmation} from '../src/services/solana';
import {addRecentRecipient} from '../src/services/storage';
import {useWalletStore} from '../src/store/walletStore';

let mutation: ReturnType<typeof usePayment> | null = null;

function Harness(): null {
  mutation = usePayment();
  return null;
}

describe('usePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutation = null;
    useWalletStore.setState({
      wallet: {
        publicKey: 'sender',
        privateKey: '11'.repeat(32),
      },
    });
    (sendWithSigner as jest.Mock).mockResolvedValue({
      signature: 'relay-signature',
    });
    (addRecentRecipient as jest.Mock).mockResolvedValue(['recipient']);
  });

  it('preserves pending confirmation and records sender-owned history', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_786_962_240_000);
    (waitForTransactionConfirmation as jest.Mock).mockResolvedValue({
      signature: 'relay-signature',
      status: 'pending',
      confirmed: false,
      slot: 42,
    });
    const queryClient = new QueryClient({
      defaultOptions: {mutations: {retry: false}},
    });
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>,
      );
    });

    let record;
    await act(async () => {
      record = await mutation!.mutateAsync({
        recipientAddress: 'recipient',
        amount: 5,
      });
    });

    expect(record).toEqual(
      expect.objectContaining({
        walletAddress: 'sender',
        page: 1,
        pageSize: 1,
        limit: 1,
        offset: 0,
        total: 1,
        status: 'pending',
        data: [
          expect.objectContaining({
            signature: 'relay-signature',
            blockTime: 1_786_962_240,
            status: 'pending',
            from: 'sender',
            to: 'recipient',
          }),
        ],
      }),
    );
    expect(addRecentRecipient).toHaveBeenCalledWith('recipient');

    await act(async () => tree!.unmount());
    queryClient.clear();
    jest.restoreAllMocks();
  });

  it('does not save a recipient when confirmation fails', async () => {
    (waitForTransactionConfirmation as jest.Mock).mockResolvedValue({
      signature: 'relay-signature',
      status: 'failed',
      confirmed: false,
      error: 'transaction rejected',
    });
    const queryClient = new QueryClient({
      defaultOptions: {mutations: {retry: false}},
    });
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>,
      );
    });

    await expect(
      mutation!.mutateAsync({
        recipientAddress: 'recipient',
        amount: 5,
      }),
    ).rejects.toThrow('transaction rejected');
    expect(addRecentRecipient).not.toHaveBeenCalled();

    await act(async () => tree!.unmount());
    queryClient.clear();
  });
});
