import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { blockDAGMainnet } from './chains';

export const config = getDefaultConfig({
  appName: 'MAUI — Multiple Application User Interface',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID',   // ←←← Replace this (see note below)
  chains: [blockDAGMainnet],
  ssr: true,
});
