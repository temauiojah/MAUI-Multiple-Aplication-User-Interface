import { createConfig, http } from 'wagmi';
import { metaMask, walletConnect } from 'wagmi/connectors';
import { blockDAGMainnet } from './chains';

const projectId = '9083d5cd-a434-4b3b-873c-e8d678fb57f7';   // Your Project ID

export const config = createConfig({
  chains: [blockDAGMainnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'MAUI — Multiple Application User Interface',
        url: 'https://maui-multiple-aplication-user-inter.vercel.app',
      },
    }),
    walletConnect({ projectId }),   // ← This fixes the modal on Vercel
  ],
  transports: {
    [blockDAGMainnet.id]: http('https://rpc.bdagscan.com'),
  },
  ssr: true,
});
