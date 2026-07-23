import {useEffect} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {getWalletBalances} from '../services/solana';
import {getCachedBalance, saveCachedBalance} from '../services/storage';
import {useWalletStore} from '../store/walletStore';

export function useBalance() {
  const wallet = useWalletStore(s => s.wallet);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!wallet?.publicKey) {
      return;
    }

    (async () => {
      const cached = await getCachedBalance(wallet.publicKey);
      if (cached) {
        queryClient.setQueryData(['balance', wallet.publicKey], cached);
      }
    })();
  }, [queryClient, wallet?.publicKey]);

  return useQuery({
    queryKey: ['balance', wallet?.publicKey],
    queryFn: async () => {
      const balance = await getWalletBalances(wallet!.publicKey);
      await saveCachedBalance(balance);
      return balance;
    },
    enabled: !!wallet?.publicKey,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
