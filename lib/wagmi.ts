import { createConfig, http } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { blockDAGMainnet } from './chains';

export const config = createConfig({
  chains: [blockDAGMainnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'MAUI — Multiple Application User Interface',
        url: 'http://localhost:3000',
      },
    }),
  ],
  transports: {
    [blockDAGMainnet.id]: http('https://rpc.bdagscan.com'),
  },
  ssr: true,
});
