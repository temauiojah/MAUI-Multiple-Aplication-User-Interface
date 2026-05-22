'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function BdagScanPage() {
  const { address, isConnected } = useAccount();
  const explorerBase = 'https://bdagscan.com';

  const openExplorer = (path: string) => {
    window.open(`${explorerBase}${path}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-3">MAUI.bdagscan</h1>
          <p className="text-zinc-400 text-xl">Official BlockDAG Explorer</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-900 border border-zinc-700 rounded-3xl p-1 mb-8">
          <button
            onClick={() => openExplorer('/tx')}
            className="flex-1 py-5 text-lg font-medium rounded-3xl transition-all bg-emerald-600 text-white shadow-inner"
          >
            Recent Transactions
          </button>
          <button
            onClick={() => openExplorer(address ? `/address/${address}` : '/tx')}
            className="flex-1 py-5 text-lg font-medium rounded-3xl transition-all hover:bg-zinc-800"
          >
            My Transactions
          </button>
        </div>

        <div className="space-y-6">
          {/* Recent Transactions Card */}
          <div 
            onClick={() => openExplorer('/tx')}
            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 cursor-pointer hover:border-emerald-500 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-900/30 text-emerald-400 text-sm font-medium px-4 py-1 rounded-2xl mb-3">
                  LIVE
                </div>
                <h3 className="text-2xl font-semibold">Recent Transactions</h3>
                <p className="text-zinc-400 mt-2">Latest blocks and activity across the entire BlockDAG network</p>
              </div>
              <span className="text-6xl text-emerald-400">↗</span>
            </div>
          </div>

          {/* My Transactions Card (only if connected) */}
          {isConnected && address ? (
            <div 
              onClick={() => openExplorer(`/address/${address}`)}
              className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 cursor-pointer hover:border-blue-500 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 bg-blue-900/30 text-blue-400 text-sm font-medium px-4 py-1 rounded-2xl mb-3">
                    YOUR WALLET
                  </div>
                  <h3 className="text-2xl font-semibold">My Transactions</h3>
                  <p className="font-mono text-xs text-blue-300 mt-3 break-all">{address}</p>
                  <p className="text-zinc-400 mt-2">All your sends, receives, and token activity</p>
                </div>
                <span className="text-6xl text-blue-400">↗</span>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-dashed border-zinc-700 rounded-3xl p-8 text-center">
              <p className="text-zinc-400">Connect MetaMask to see your personal transaction history</p>
            </div>
          )}

          {/* Full Explorer */}
          <div 
            onClick={() => openExplorer('')}
            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-5">
              <span className="text-5xl">🔎</span>
              <div>
                <h3 className="text-xl font-semibold">Open Full Explorer</h3>
                <p className="text-zinc-400">Blocks • Contracts • Stats • Everything</p>
              </div>
            </div>
            <span className="text-4xl">↗</span>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/metamask" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300">
            ← Back to MAUI.MetaMask
          </Link>
        </div>
      </div>
    </div>
  );
}
