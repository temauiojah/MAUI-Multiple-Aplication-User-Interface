import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { mainnet } from 'wagmi/chains';
import { blockDAGMainnet } from './chains';

export const config = getDefaultConfig({
  appName: 'MAUI — Multiple Application User Interface',
  projectId: '5749b581bcaad6daa175fef0cf3f3d57',
  chains: [blockDAGMainnet, mainnet],
  transports: {
    [blockDAGMainnet.id]: http(),
  },
  ssr: true,
});
