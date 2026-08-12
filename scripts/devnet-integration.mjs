import {generateMnemonic, deriveSolanaKeypair} from '@altude/core';
import {Keypair, Connection, PublicKey} from '@solana/web3.js';
import {getOrCreateAssociatedTokenAccount} from '@solana/spl-token';

const DEVNET_RPC_URLS = [
  process.env.SOLANA_RPC_URL,
  'https://api.devnet.solana.com',
  'https://rpc.ankr.com/solana_devnet',
].filter(Boolean);
const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const COMMITMENT = 'confirmed';

async function ensureDevnetFunding(connection, publicKey) {
  const balance = await connection.getBalance(publicKey, COMMITMENT);
  const minimumLamports = 0.05 * 1_000_000_000;

  if (balance >= minimumLamports) {
    return balance;
  }

  const attempts = 4;
  let lastError = null;

  for (let i = 1; i <= attempts; i += 1) {
    try {
      const sig = await connection.requestAirdrop(publicKey, 1_000_000_000);
      const latest = await connection.getLatestBlockhash(COMMITMENT);
      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash: latest.blockhash,
          lastValidBlockHeight: latest.lastValidBlockHeight,
        },
        COMMITMENT,
      );

      return connection.getBalance(publicKey, COMMITMENT);
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 1000 * i));
    }
  }

  throw lastError ?? new Error('Airdrop failed after retries');
}

async function withWorkingConnection(run) {
  let lastError = null;

  for (const rpcUrl of DEVNET_RPC_URLS) {
    try {
      const connection = new Connection(rpcUrl, COMMITMENT);
      const result = await run(connection, rpcUrl);
      return result;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('No working devnet RPC endpoint available');
}

async function main() {
  if (process.env.RUN_DEVNET_INTEGRATION !== '1') {
    throw new Error('Set RUN_DEVNET_INTEGRATION=1 to run live devnet integration');
  }

  const mnemonic = generateMnemonic(12);
  const {privateKey, publicKey} = await deriveSolanaKeypair(mnemonic, 0);

  const payer = Keypair.fromSeed(privateKey);
  const payerAddress = new PublicKey(publicKey).toBase58();
  const mint = new PublicKey(USDC_DEVNET_MINT);

  const result = await withWorkingConnection(async (connection, rpcUrl) => {
    const lamports = await ensureDevnetFunding(connection, payer.publicKey);
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey,
    );
    return {
      lamports,
      tokenAccount: ata.address.toBase58(),
      rpcUrl,
    };
  });

  console.log('Devnet integration success');
  console.log(`rpc: ${result.rpcUrl}`);
  console.log(`wallet: ${payerAddress}`);
  console.log(`mint: ${USDC_DEVNET_MINT}`);
  console.log(`tokenAccount: ${result.tokenAccount}`);
  console.log(`lamports: ${result.lamports}`);
}

main().catch(error => {
  console.error('Devnet integration failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
