import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { blockDAGMainnet } from './chains';

export const config = getDefaultConfig({
  appName: 'MAUI — Multiple Application User Interface',
  projectId: '5749b581bcaad6daa175fef0cf3f3d57', 
  chains: [blockDAGMainnet],
  ssr: true,
});
