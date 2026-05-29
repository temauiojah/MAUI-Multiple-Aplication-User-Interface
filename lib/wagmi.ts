// VERCEL BUILD FIX — Only MetaMask (May 29 2026)
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import { http } from 'viem';
import { mainnet } from 'wagmi/chains';
import { blockDAGMainnet } from './chains';

const projectId = '5749b581bcaad6daa175fef0cf3f3d57';

export const config = getDefaultConfig({
  appName: 'MAUI — Multiple Application User Interface',
  projectId,
  chains: [blockDAGMainnet, mainnet],
  transports: {
    [blockDAGMainnet.id]: http(),
    [mainnet.id]: http(),
  },
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet],
    },
  ],
  ssr: true,
});

