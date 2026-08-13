// lib/payments.ts
// Drop-in helpers for MAUI.Chat payment requests

export const BASE_CHAIN_ID = 8453;
export const BLOCKDAG_CHAIN_ID = 1404; // your BlockDAG mainnet

/** Official USDC on Base mainnet (6 decimals) */
export const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

/** MAUI token on BlockDAG */
export const MAUI_TOKEN = '0xe584D0963949d90C30Db7F9128765749510c67F6' as const;

export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const;

export type PayToken = 'USDC' | 'MAUI' | 'BDAG';

export type PaymentRequest = {
  v: 1;
  kind: 'payment_request';
  id: string;
  token: PayToken;
  amount: string; // human string e.g. "15.5"
  to: string;
  from: string;
  note?: string;
  chainId: number;
  createdAt: number;
};

export type PaymentReceipt = {
  v: 1;
  kind: 'payment_receipt';
  requestId: string;
  token: PayToken;
  amount: string;
  to: string;
  from: string;
  txHash: string;
  chainId: number;
  createdAt: number;
};

const REQ_PREFIX = 'MAUI_PAY_REQ:';
const RCPT_PREFIX = 'MAUI_PAY_RCPT:';

export function encodePaymentRequest(req: PaymentRequest): string {
  return REQ_PREFIX + JSON.stringify(req);
}

export function encodePaymentReceipt(rcpt: PaymentReceipt): string {
  return RCPT_PREFIX + JSON.stringify(rcpt);
}

export function parsePaymentPayload(
  content: string
): PaymentRequest | PaymentReceipt | null {
  try {
    if (content.startsWith(REQ_PREFIX)) {
      const data = JSON.parse(content.slice(REQ_PREFIX.length));
      if (data?.kind === 'payment_request' && data?.v === 1) return data as PaymentRequest;
    }
    if (content.startsWith(RCPT_PREFIX)) {
      const data = JSON.parse(content.slice(RCPT_PREFIX.length));
      if (data?.kind === 'payment_receipt' && data?.v === 1) return data as PaymentReceipt;
    }
  } catch {
    // ignore
  }
  return null;
}

export function isPaymentMessage(content: string): boolean {
  return content.startsWith(REQ_PREFIX) || content.startsWith(RCPT_PREFIX);
}

export function tokenDecimals(token: PayToken): number {
  return token === 'USDC' ? 6 : 18;
}

export function chainLabel(chainId: number): string {
  if (chainId === BASE_CHAIN_ID) return 'Base';
  if (chainId === BLOCKDAG_CHAIN_ID) return 'BlockDAG';
  return `Chain ${chainId}`;
}

export function explorerTxUrl(chainId: number, txHash: string): string {
  if (chainId === BASE_CHAIN_ID) return `https://basescan.org/tx/${txHash}`;
  // BlockDAG explorer — adjust if you have a canonical URL
  return `https://bdagscan.com/tx/${txHash}`;
}

export function newRequestId(): string {
  return `pr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultChainForToken(token: PayToken): number {
  if (token === 'USDC') return BASE_CHAIN_ID;
  return BLOCKDAG_CHAIN_ID;
}
