import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import { http } from 'viem';
import { mainnet } from 'wagmi/chains';
import { blockDAGMainnet } from './chains';

const projectId = '5749b581bcaad6daa175fef0cf3f3d57';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet],
    },
  ],
  {
    projectId,
    appName: 'MAUI — Multiple Application User Interface',
  }
);

export const config = getDefaultConfig({
  appName: 'MAUI — Multiple Application User Interface',
  projectId,
  chains: [blockDAGMainnet, mainnet],
  transports: {
    [blockDAGMainnet.id]: http(),
    [mainnet.id]: http(),
  },
  connectors,        // ← Only MetaMask will appear
  ssr: true,
});
