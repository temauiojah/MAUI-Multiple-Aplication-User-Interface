import { createConfig, http } from 'wagmi';
import { metaMask, walletConnect } from 'wagmi/connectors';
import { blockDAGMainnet } from './chains';

const projectId = '84450fed570622615a4c3f3862b57c72';   // ← Your Project ID

export const config = createConfig({
  chains: [blockDAGMainnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'MAUI — Multiple Application User Interface',
        url: 'https://maui-multiple-aplication-user-inter.vercel.app',
      },
    }),
    walletConnect({ projectId }),
  ],
  transports: {
    [blockDAGMainnet.id]: http('https://rpc.bdagscan.com'),
  },
  ssr: true,
});
