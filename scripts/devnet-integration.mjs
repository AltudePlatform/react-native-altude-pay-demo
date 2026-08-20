import {generateMnemonic, deriveSolanaKeypair} from '@altude/core';
import {
  address,
  appendTransactionMessageInstruction,
  createKeyPairSignerFromPrivateKeyBytes,
  createSolanaRpc,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  lamports,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from '@solana/kit';
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';

const DEVNET_RPC_URLS = [
  process.env.SOLANA_RPC_URL,
  'https://api.devnet.solana.com',
  'https://rpc.ankr.com/solana_devnet',
].filter(Boolean);
const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const COMMITMENT = 'confirmed';

async function confirmSignature(rpc, signature, attempts = 30, delayMs = 1000) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const {value} = await rpc
      .getSignatureStatuses([signature], {searchTransactionHistory: true})
      .send();
    const status = value?.[0];

    if (status?.err) {
      throw new Error(
        `Transaction ${signature} failed: ${JSON.stringify(status.err)}`,
      );
    }

    if (
      status?.confirmationStatus === 'confirmed' ||
      status?.confirmationStatus === 'finalized'
    ) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error(`Timed out waiting for confirmation of ${signature}`);
}

async function ensureDevnetFunding(rpc, payerAddress) {
  const {value: balance} = await rpc
    .getBalance(payerAddress, {commitment: COMMITMENT})
    .send();
  const minimumLamports = 50_000_000n;

  if (BigInt(balance) >= minimumLamports) {
    return BigInt(balance);
  }

  const attempts = 4;
  let lastError = null;

  for (let i = 1; i <= attempts; i += 1) {
    try {
      const signature = await rpc
        .requestAirdrop(payerAddress, lamports(1_000_000_000n), {
          commitment: COMMITMENT,
        })
        .send();

      await confirmSignature(rpc, signature);

      const {value: funded} = await rpc
        .getBalance(payerAddress, {commitment: COMMITMENT})
        .send();
      return BigInt(funded);
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 1000 * i));
    }
  }

  throw lastError ?? new Error('Airdrop failed after retries');
}

async function createAssociatedTokenAccount(rpc, payer, mint) {
  const [ata] = await findAssociatedTokenPda({
    mint,
    owner: payer.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const {value: latestBlockhash} = await rpc
    .getLatestBlockhash({commitment: COMMITMENT})
    .send();

  const transactionMessage = pipe(
    createTransactionMessage({version: 0}),
    message => setTransactionMessageFeePayerSigner(payer, message),
    message =>
      setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
    message =>
      appendTransactionMessageInstruction(
        getCreateAssociatedTokenIdempotentInstruction({
          payer,
          ata,
          owner: payer.address,
          mint,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        }),
        message,
      ),
  );

  const signedTransaction = await signTransactionMessageWithSigners(
    transactionMessage,
  );
  const signature = getSignatureFromTransaction(signedTransaction);

  await rpc
    .sendTransaction(getBase64EncodedWireTransaction(signedTransaction), {
      encoding: 'base64',
      preflightCommitment: COMMITMENT,
    })
    .send();

  await confirmSignature(rpc, signature);

  return ata;
}

async function withWorkingRpc(run) {
  let lastError = null;

  for (const rpcUrl of DEVNET_RPC_URLS) {
    try {
      const rpc = createSolanaRpc(rpcUrl);
      const result = await run(rpc, rpcUrl);
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
  const {privateKey} = await deriveSolanaKeypair(mnemonic, 0);

  const payer = await createKeyPairSignerFromPrivateKeyBytes(privateKey);
  const mint = address(USDC_DEVNET_MINT);

  const result = await withWorkingRpc(async (rpc, rpcUrl) => {
    const balance = await ensureDevnetFunding(rpc, payer.address);
    const tokenAccount = await createAssociatedTokenAccount(rpc, payer, mint);

    return {
      lamports: balance,
      tokenAccount,
      rpcUrl,
    };
  });

  console.log('Devnet integration success');
  console.log(`rpc: ${result.rpcUrl}`);
  console.log(`wallet: ${payer.address}`);
  console.log(`mint: ${USDC_DEVNET_MINT}`);
  console.log(`tokenAccount: ${result.tokenAccount}`);
  console.log(`lamports: ${result.lamports}`);
}

main().catch(error => {
  console.error('Devnet integration failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
