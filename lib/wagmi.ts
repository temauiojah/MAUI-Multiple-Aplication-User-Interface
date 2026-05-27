import { createConfig, http } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { blockDAGMainnet } from './chains';

export const config = createConfig({
  chains: [blockDAGMainnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'MAUI — Multiple Application User Interface',
        url: 'https://maui-coin.vercel.app',
        iconUrl: 'https://maui-coin.vercel.app/favicon.ico',
      },
    }),
  ],
  transports: {
    [blockDAGMainnet.id]: http('https://rpc.bdagscan.com'),
  },
  ssr: true,
});
