'use client';

import { useAccount, useBalance, useChainId, useReadContract } from 'wagmi';
import { blockDAGMainnet } from '@/lib/chains';
import { formatUnits } from 'viem';
import { useState } from 'react';

const MAUI_TOKEN_ADDRESS = '0xe584D0963949d90C30Db7F9128765749510c67F6';

function formatCompact(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  return num.toFixed(4);
}

export default function MetaMaskPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { data: bdagBalance } = useBalance({ address, chainId: blockDAGMainnet.id });

  const { data: mauiRaw } = useReadContract({
    address: MAUI_TOKEN_ADDRESS,
    abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const formattedBdag = bdagBalance ? parseFloat(formatUnits(bdagBalance.value, 18)).toFixed(4) : '0.0000';
  const mauiNum = mauiRaw ? parseFloat(formatUnits(mauiRaw as bigint, 18)) : 0;
  const formattedMaui = formatCompact(mauiNum);

  const [showSend, setShowSend] = useState(false);
  const [selectedToken, setSelectedToken] = useState<'BDAG' | 'MAUI'>('BDAG');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const connect = async () => {
    if (!(window as any).ethereum) return alert("MetaMask not detected");
    await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-5xl font-bold mb-2 text-center">MAUI.MetaMask</h1>
        <p className="text-center text-zinc-400 mb-12">Your BlockDAG Wallet Dashboard</p>

        {!isConnected ? (
          <button onClick={connect} className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-3xl text-xl font-medium">Connect MetaMask</button>
        ) : (
          <>
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 mb-8">
              <div className="flex justify-between items-center mb-8">
                <p className="text-emerald-400 font-medium">CONNECTED ON BLOCKDAG</p>
                <button onClick={() => navigator.clipboard.writeText(address!)} className="text-xs bg-zinc-800 px-4 py-2 rounded-2xl font-mono hover:bg-zinc-700">
                  {address?.slice(0,6)}...{address?.slice(-4)} 📋
                </button>
              </div>

              {/* Stacked on mobile, side-by-side on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-sm text-zinc-400">BDAG Balance</p>
                  <p className="text-5xl font-bold tracking-tighter text-white">{formattedBdag}</p>
                  <p className="text-emerald-400">BDAG</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">MAUI Balance</p>
                  <p className="text-5xl font-bold tracking-tighter text-blue-400">{formattedMaui}</p>
                  <p className="text-blue-400">MAUI</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowSend(true)} className="bg-emerald-600 hover:bg-emerald-500 py-8 rounded-3xl text-lg font-medium">Send</button>
              <button onClick={() => alert("Swap feature coming soon")} className="bg-zinc-800 hover:bg-zinc-700 py-8 rounded-3xl text-lg font-medium">Swap</button>
            </div>
          </>
        )}

        {/* Send Modal */}
        {showSend && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 w-full max-w-md">
              <h3 className="text-2xl font-bold mb-6">Send Token</h3>
              <div className="flex gap-3 mb-6">
                <button onClick={() => setSelectedToken('BDAG')} className={`flex-1 py-4 rounded-2xl ${selectedToken === 'BDAG' ? 'bg-emerald-600' : 'bg-zinc-800'}`}>BDAG</button>
                <button onClick={() => setSelectedToken('MAUI')} className={`flex-1 py-4 rounded-2xl ${selectedToken === 'MAUI' ? 'bg-blue-600' : 'bg-zinc-800'}`}>MAUI</button>
              </div>
              <input type="text" placeholder="Recipient 0x..." value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4 mb-4" />
              <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4 mb-6" />
              <div className="flex gap-4">
                <button onClick={() => setShowSend(false)} className="flex-1 py-4 border border-zinc-700 rounded-2xl">Cancel</button>
                <button onClick={() => alert(`Sent ${amount} ${selectedToken}`)} className="flex-1 bg-emerald-600 py-4 rounded-2xl font-medium">Send {selectedToken}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
