import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMask } from 'wagmi/connectors';
import { blockDAGMainnet } from './chains';

export const config = getDefaultConfig({
  appName: 'MAUI — Multiple Application User Interface',
  projectId: '5749b581bcaad6daa175fef0cf3f3d57',
  chains: [blockDAGMainnet],
  ssr: true,
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
