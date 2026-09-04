import {Keypair, SystemProgram, Transaction} from '@solana/web3.js';
import {ed25519} from '@noble/curves/ed25519.js';

const mockSourceKeypair = Keypair.generate();
const mockSignTransaction = jest.fn(async (transaction: Transaction) => {
  transaction.partialSign(mockSourceKeypair);
  return transaction;
});

jest.mock('../src/services/dynamicClient', () => ({
  dynamicClient: {
    wallets: {
      primary: null,
      userWallets: [],
    },
    solana: {
      getSigner: jest.fn(() => ({
        signTransaction: mockSignTransaction,
      })),
    },
  },
}));

import {buildSigner} from '../src/services/solana';
import {dynamicClient} from '../src/services/dynamicClient';

describe('Dynamic Solana signer adapter', () => {
  it('signs the transaction and returns a raw signature for its message bytes', async () => {
    (dynamicClient.wallets as any).primary = {
      id: 'dynamic-wallet',
      address: mockSourceKeypair.publicKey.toBase58(),
      chain: 'sol',
    };
    const transaction = new Transaction({
      feePayer: Keypair.generate().publicKey,
      recentBlockhash: Keypair.generate().publicKey.toBase58(),
    }).add(
      SystemProgram.transfer({
        fromPubkey: mockSourceKeypair.publicKey,
        toPubkey: Keypair.generate().publicKey,
        lamports: 1,
      }),
    );
    const messageBytes = transaction.serializeMessage();
    const signer = buildSigner({
      publicKey: mockSourceKeypair.publicKey.toBase58(),
      provider: 'dynamic',
    });

    const signature = await signer.signTransactionMessage(messageBytes);

    expect(mockSignTransaction).toHaveBeenCalledTimes(1);
    expect(signature).toHaveLength(64);
    expect(
      ed25519.verify(
        signature,
        messageBytes,
        mockSourceKeypair.publicKey.toBytes(),
      ),
    ).toBe(true);
  });
});