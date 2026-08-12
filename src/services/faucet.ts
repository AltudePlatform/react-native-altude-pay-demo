const FAUCET_BASE_URL = 'http://localhost:54363';

export interface FaucetResponse {
  success: boolean;
  toppedUp?: boolean;
  amount?: number;
  balance?: number;
  signature?: string;
}

export async function topupWallet(
  wallet: string,
): Promise<FaucetResponse> {
  const response = await fetch(
    `${FAUCET_BASE_URL}/api/faucet/initialize`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}