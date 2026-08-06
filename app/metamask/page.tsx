'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useDisconnect,
  useBalance,
  useReadContract,
  useSendTransaction,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { blockDAGMainnet } from '@/lib/chains';
import { formatUnits, parseUnits, isAddress } from 'viem';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const MAUI_TOKEN_ADDRESS = '0xe584D0963949d90C30Db7F9128765749510c67F6' as const;

const ERC20_ABI = [
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
] as const;

type TokenType = 'BDAG' | 'MAUI';

export default function MetaMaskPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Balances
  const { data: bdagBalance, refetch: refetchBdag } = useBalance({
    address,
    chainId: blockDAGMainnet.id,
  });

  const { data: mauiRaw, refetch: refetchMaui } = useReadContract({
    address: MAUI_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const formattedBdag = bdagBalance
    ? parseFloat(formatUnits(bdagBalance.value, 18)).toFixed(4)
    : '0.0000';
  const formattedMaui = mauiRaw
    ? parseFloat(formatUnits(mauiRaw as bigint, 18)).toFixed(2)
    : '0.00';

  // Send modal state
  const [showSend, setShowSend] = useState(false);
  const [token, setToken] = useState<TokenType>('BDAG');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Native send (BDAG)
  const {
    sendTransaction,
    data: nativeHash,
    isPending: isNativePending,
    error: nativeError,
    reset: resetNative,
  } = useSendTransaction();

  // ERC20 write (MAUI)
  const {
    writeContract,
    data: tokenHash,
    isPending: isTokenPending,
    error: tokenError,
    reset: resetToken,
  } = useWriteContract();

  // Wait for confirmation
  const activeHash = nativeHash || tokenHash || txHash;
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: activeHash,
  });

  // Sync hash into local state for display
  useEffect(() => {
    if (nativeHash) setTxHash(nativeHash);
    if (tokenHash) setTxHash(tokenHash);
  }, [nativeHash, tokenHash]);

  // Clear errors when inputs change
  useEffect(() => {
    setErrorMsg(null);
  }, [recipient, amount, token]);

  // On confirmed → refetch balances
  useEffect(() => {
    if (isConfirmed) {
      refetchBdag();
      refetchMaui();
    }
  }, [isConfirmed, refetchBdag, refetchMaui]);

  // Show errors from hooks
  useEffect(() => {
    if (nativeError) setErrorMsg(nativeError.message.slice(0, 120));
    if (tokenError) setErrorMsg(tokenError.message.slice(0, 120));
    if (confirmError) setErrorMsg(confirmError.message.slice(0, 120));
  }, [nativeError, tokenError, confirmError]);

  const isPending = isNativePending || isTokenPending || isConfirming;

  // Improved disconnect
  const handleDisconnect = () => {
    disconnect();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wagmi.wallet');
      localStorage.removeItem('walletconnect');
      localStorage.removeItem('-walletconnect-');
    }
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const openSendModal = () => {
    setShowSend(true);
    setRecipient('');
    setAmount('');
    setTxHash(undefined);
    setErrorMsg(null);
    resetNative();
    resetToken();
  };

  const closeSendModal = () => {
    if (isPending) return;
    setShowSend(false);
    setTxHash(undefined);
    setErrorMsg(null);
    resetNative();
    resetToken();
  };

  const handleMax = () => {
    if (token === 'BDAG' && bdagBalance) {
      // Leave a little for gas (~0.001 BDAG)
      const max = parseFloat(formatUnits(bdagBalance.value, 18)) - 0.001;
      setAmount(max > 0 ? max.toFixed(6) : '0');
    } else if (token === 'MAUI' && mauiRaw) {
      setAmount(formatUnits(mauiRaw as bigint, 18));
    }
  };

  const handleSend = async () => {
    setErrorMsg(null);

    if (!address) {
      setErrorMsg('Wallet not connected');
      return;
    }

    if (!isAddress(recipient)) {
      setErrorMsg('Invalid recipient address');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Enter a valid amount greater than 0');
      return;
    }

    // Ensure we are on BlockDAG
    if (chainId !== blockDAGMainnet.id) {
      try {
        await switchChain({ chainId: blockDAGMainnet.id });
      } catch {
        setErrorMsg('Please switch to BlockDAG Mainnet in MetaMask');
        return;
      }
    }

    try {
      const value = parseUnits(amount, 18);

      if (token === 'BDAG') {
        // Native transfer
        if (bdagBalance && value > bdagBalance.value) {
          setErrorMsg('Insufficient BDAG balance');
          return;
        }
        sendTransaction({
          to: recipient as `0x${string}`,
          value,
          chainId: blockDAGMainnet.id,
        });
      } else {
        // MAUI ERC20 transfer
        if (mauiRaw && value > (mauiRaw as bigint)) {
          setErrorMsg('Insufficient MAUI balance');
          return;
        }
        writeContract({
          address: MAUI_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [recipient as `0x${string}`, value],
          chainId: blockDAGMainnet.id,
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message?.slice(0, 120) || 'Transaction failed');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center">MAUI.MetaMask</h1>
        <p className="page-subtitle text-center mb-12">Your BlockDAG Wallet Dashboard</p>

        {!isConnected ? (
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        ) : (
          <>
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 mb-8">
              <div className="flex justify-between items-center mb-8">
                <p className="text-emerald-400 font-medium">CONNECTED ON BLOCKDAG</p>
                <button
                  onClick={handleDisconnect}
                  className="text-sm bg-red-600 hover:bg-red-700 px-5 py-2 rounded-2xl"
                >
                  Disconnect
                </button>
              </div>

              <div className="space-y-10">
                <div className="text-center border-b border-zinc-700 pb-8">
                  <p className="text-sm text-zinc-400 mb-1">BDAG Balance</p>
                  <p className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-white break-all leading-none">
                    {formattedBdag}
                  </p>
                  <p className="text-emerald-400 text-2xl">BDAG</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-zinc-400 mb-1">MAUI Balance</p>
                  <p className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-blue-400 break-all leading-none">
                    {formattedMaui}
                  </p>
                  <p className="text-blue-400 text-2xl">MAUI</p>
                </div>
              </div>
            </div>

            <Link href="/metamask/buy">
              <div className="mb-8 bg-zinc-900 border border-zinc-700 hover:border-amber-500 rounded-3xl p-8 cursor-pointer transition-all flex items-center justify-between">
                <div>
                  <div className="text-5xl mb-4">🛒</div>
                  <h3 className="text-2xl font-semibold">Buy BDAG</h3>
                  <p className="text-zinc-400">Official BlockDAG on-ramp</p>
                </div>
                <span className="text-5xl text-amber-400">→</span>
              </div>
            </Link>

            <button
              onClick={openSendModal}
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-8 rounded-3xl text-lg font-medium transition-colors"
            >
              Send
            </button>
          </>
        )}
      </div>

      {/* ========== SEND MODAL ========== */}
      {showSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Send</h2>
              <button
                onClick={closeSendModal}
                disabled={isPending}
                className="text-3xl text-zinc-400 hover:text-white leading-none disabled:opacity-40"
              >
                ×
              </button>
            </div>

            {/* Token selector */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setToken('BDAG')}
                className={`flex-1 py-3 rounded-2xl font-medium transition-colors ${
                  token === 'BDAG'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                BDAG
              </button>
              <button
                onClick={() => setToken('MAUI')}
                className={`flex-1 py-3 rounded-2xl font-medium transition-colors ${
                  token === 'MAUI'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                MAUI
              </button>
            </div>

            {/* Recipient */}
            <label className="block text-sm text-zinc-400 mb-2">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              placeholder="0x..."
              disabled={isPending || isConfirmed}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 mb-4 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-mono text-sm"
            />

            {/* Amount */}
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-zinc-400">Amount</label>
              <button
                type="button"
                onClick={handleMax}
                disabled={isPending || isConfirmed}
                className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
              >
                Max
              </button>
            </div>
            <div className="relative mb-2">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                disabled={isPending || isConfirmed}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 pr-20 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50 text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">
                {token}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-6">
              Available:{' '}
              {token === 'BDAG' ? `${formattedBdag} BDAG` : `${formattedMaui} MAUI`}
            </p>

            {/* Status / Error */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-2xl text-red-300 text-sm break-words">
                {errorMsg}
              </div>
            )}

            {isConfirmed && activeHash && (
              <div className="mb-4 p-4 bg-emerald-900/40 border border-emerald-600 rounded-2xl text-center">
                <p className="text-emerald-400 font-medium mb-2">✓ Transaction Confirmed</p>
                <a
                  href={`https://bdagscan.com/tx/${activeHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline break-all"
                >
                  View on BDAGScan →
                </a>
              </div>
            )}

            {isPending && !isConfirmed && (
              <div className="mb-4 p-3 bg-zinc-800 rounded-2xl text-center text-zinc-300 text-sm">
                {isConfirming ? 'Waiting for confirmation…' : 'Confirm in MetaMask…'}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeSendModal}
                disabled={isPending}
                className="flex-1 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 font-medium disabled:opacity-40"
              >
                {isConfirmed ? 'Close' : 'Cancel'}
              </button>
              {!isConfirmed && (
                <button
                  onClick={handleSend}
                  disabled={isPending || !recipient || !amount}
                  className={`flex-1 py-4 rounded-2xl font-medium disabled:opacity-40 ${
                    token === 'BDAG'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {isPending ? 'Sending…' : `Send ${token}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}