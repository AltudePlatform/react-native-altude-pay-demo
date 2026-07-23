import {useQuery} from '@tanstack/react-query';
import {walletApi} from '../services/api';
import {useWalletStore} from '../store/walletStore';

export function useBalance() {
  const wallet = useWalletStore(s => s.wallet);

  return useQuery({
    queryKey: ['balance', wallet?.publicKey],
    queryFn: () => walletApi.getBalance(wallet!.publicKey),
    enabled: !!wallet?.publicKey,
    refetchInterval: 30_000, // poll every 30 s
    staleTime: 10_000,
  });
}
