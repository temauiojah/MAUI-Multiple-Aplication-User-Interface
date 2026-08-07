// lib/xmtp.ts
// Helper: turn a connected MetaMask wallet (wagmi/viem) into an XMTP Signer

import type { Signer } from '@xmtp/browser-sdk';
import { IdentifierKind } from '@xmtp/browser-sdk';
import { toBytes, type WalletClient, type Address } from 'viem';

/**
 * Creates an XMTP EOA Signer from a wagmi/viem WalletClient.
 * This is what Client.create() expects.
 */
export function createXmtpSigner(
  address: Address,
  walletClient: WalletClient
): Signer {
  return {
    type: 'EOA',
    getIdentifier: () => ({
      identifier: address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string): Promise<Uint8Array> => {
      // walletClient.signMessage returns a hex string
      const signature = await walletClient.signMessage({
        account: address,
        message,
      });
      // XMTP expects raw bytes
      return toBytes(signature);
    },
  };
}