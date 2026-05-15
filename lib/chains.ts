import { defineChain } from 'viem';

export const blockDAGMainnet = defineChain({
  id: 1404,
  name: 'BlockDAG Mainnet',
  nativeCurrency: { decimals: 18, name: 'BDAG', symbol: 'BDAG' },
  rpcUrls: { default: { http: ['https://rpc.bdagscan.com'] } },
  blockExplorers: { default: { name: 'BDAGScan', url: 'https://bdagscan.com' } },
  testnet: false,
});
