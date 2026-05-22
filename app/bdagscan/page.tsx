'use client';

import { useAccount } from 'wagmi';
import { useState } from 'react';

export default function BdagScanPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'recent' | 'my'>('recent');

  const explorerBase = 'https://bdagscan.com';
  const recentUrl = `${explorerBase}/tx`;
  const myUrl = isConnected && address 
    ? `${explorerBase}/address/${address}` 
    : `${explorerBase}/tx`;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-3">MAUI.bdagscan</h1>
          <p className="text-zinc-400 text-xl">BlockDAG Explorer — Live inside MAUI</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-zinc-900 border border-zinc-700 rounded-3xl p-2 mb-8 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-4 rounded-3xl font-medium transition-all ${
              activeTab === 'recent' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            Recent Transactions
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-4 rounded-3xl font-medium transition-all ${
              activeTab === 'my' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            My Transactions
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden h-[680px] relative">
          {/* Embedded Explorer */}
          <iframe
            src={activeTab === 'recent' ? recentUrl : myUrl}
            className="w-full h-full border-0"
            title={activeTab === 'recent' ? 'Recent Transactions' : 'My Wallet Transactions'}
          />

          {/* Fallback if iframe is blocked */}
          <div className="absolute inset-0 hidden flex-col items-center justify-center bg-zinc-900/95 text-center px-8" id="fallback">
            <div className="text-6xl mb-6">🔎</div>
            <h3 className="text-2xl font-semibold mb-2">Explorer view blocked by BlockDAG</h3>
            <p className="text-zinc-400 max-w-xs mb-8">
              For security reasons, bdagscan.com cannot be shown directly inside MAUI.
            </p>
            <button
              onClick={() => window.open(activeTab === 'recent' ? recentUrl : myUrl, '_blank')}
              className="bg-white text-zinc-950 px-8 py-4 rounded-3xl font-medium hover:bg-emerald-400 transition"
            >
              Open Explorer in New Tab →
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-8">
          Your MAUI URL stays the same • Explorer runs live inside this page
        </p>
      </div>
    </div>
  );
}
