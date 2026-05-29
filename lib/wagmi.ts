import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMask } from 'wagmi/connectors';
import { http } from 'viem';
import { mainnet } from 'wagmi/chains';
import { blockDAGMainnet } from './chains';

export const config = getDefaultConfig({
  appName: 'MAUI — Multiple Application User Interface',
  projectId: '5749b581bcaad6daa175fef0cf3f3d57',
  chains: [blockDAGMainnet, mainnet],
  transports: {
    [blockDAGMainnet.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,

  // Only MetaMask (stable on Vercel)
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'MAUI — Multiple Application User Interface',
        url: 'https://maui-coin.vercel.app',
        iconUrl: 'https://maui-coin.vercel.app/favicon.ico',
      },
    }),
  ],
});
