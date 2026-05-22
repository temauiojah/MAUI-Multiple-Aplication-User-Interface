'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function BdagScanPage() {
  const { address, isConnected } = useAccount();
  const explorerBase = 'https://bdagscan.com';

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-3">MAUI.bdagscan</h1>
          <p className="text-zinc-400 text-xl">Official BlockDAG Explorer</p>
        </div>

        {/* Smart Main Button - Recent / My Transactions */}
        <div 
          onClick={() => {
            const path = isConnected && address ? `/address/${address}` : '/tx';
            openInNewTab(`${explorerBase}${path}`);
          }}
          className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 cursor-pointer hover:border-emerald-500 transition-all active:scale-[0.98] mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              {isConnected && address ? (
                <>
                  <div className="inline-flex items-center gap-2 bg-blue-900/30 text-blue-400 text-sm font-medium px-4 py-1 rounded-2xl mb-3">
                    YOUR WALLET
                  </div>
                  <h3 className="text-2xl font-semibold">My Recent Transactions</h3>
                  <p className="font-mono text-xs text-blue-300 mt-4 break-all">{address}</p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 bg-emerald-900/30 text-emerald-400 text-sm font-medium px-4 py-1 rounded-2xl mb-3">
                    LIVE
                  </div>
                  <h3 className="text-2xl font-semibold">Recent Transactions</h3>
                </>
              )}
              <p className="text-zinc-400 mt-3">
                {isConnected && address 
                  ? 'All your sends, receives, and token activity' 
                  : 'Latest blocks and network activity'}
              </p>
            </div>
            <span className="text-6xl text-emerald-400">↗</span>
          </div>
        </div>

        {/* Full Explorer */}
        <div 
          onClick={() => openInNewTab(explorerBase)}
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

        <div className="mt-12 text-center">
          <Link href="/metamask" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300">
            ← Back to MAUI.MetaMask
          </Link>
        </div>
      </div>
    </div>
  );
}
