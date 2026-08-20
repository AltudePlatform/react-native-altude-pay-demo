describe.skip('devnet integration bootstrap', () => {
  it('runs via npm run test:devnet-live instead of Jest', () => {
    // This project uses a Node script for live devnet integration because
    // React Native Jest runtime cannot reliably load the Solana ESM chain.
    // Run: RUN_DEVNET_INTEGRATION=1 npm run test:devnet-live
  });
});
