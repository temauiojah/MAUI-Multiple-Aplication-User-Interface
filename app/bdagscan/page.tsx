'use client';

import { useAccount } from 'wagmi';

export default function BdagScanPage() {
  const { address, isConnected } = useAccount();
  const explorerUrl = "https://bdagscan.com";

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h1 className="text-5xl font-bold mb-2">MAUI.bdagscan</h1>
        <p className="text-zinc-400 mb-12">Official BlockDAG Explorer</p>

        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 mb-8">
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="block p-6 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-center text-xl font-medium mb-6">
            🌐 Open Full BlockDAG Explorer
          </a>

          {isConnected && address && (
            <div className="grid grid-cols-1 gap-4">
              <a href={`${explorerUrl}/address/${address}`} target="_blank" rel="noopener noreferrer" className="block p-6 bg-blue-600 hover:bg-blue-700 rounded-2xl text-center">
                👤 View My Wallet on Explorer
              </a>
              <a href={`${explorerUrl}/txs`} target="_blank" rel="noopener noreferrer" className="block p-6 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-center">
                📜 View Recent Transactions
              </a>
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-500">Powered by BlockDAG • Integrated in MAUI</p>
      </div>
    </div>
  );
}
