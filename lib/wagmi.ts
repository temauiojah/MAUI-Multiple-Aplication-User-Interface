import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { blockDAGMainnet } from './chains';

export const config = getDefaultConfig({
  appName: 'MAUI — Multiple Application User Interface',
  projectId: '5749b581bcaad6daa175fef0cf3f3d57',   // ←←← Replace this with your real Project ID
  chains: [blockDAGMainnet],
  ssr: true,
  // Mobile deep link improvements
  mobileWalletOptions: {
    // Prioritise direct MetaMask mobile connection
    metaMask: true,
  },
});
