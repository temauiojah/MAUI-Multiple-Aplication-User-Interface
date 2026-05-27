'use client';

import Link from 'next/link';

export default function BuyPage() {
  const openOfficialPortal = () => {
    window.open('https://purchase3.blockdag.network/swap', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center">MAUI.MetaMask.Buy</h1>
        <p className="text-blue-400 text-lg md:text-xl text-center mb-12">Buy BDAG • Then Swap for MAUI</p>

        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-10 text-center">
          <div className="mx-auto max-w-xs">
            <div className="text-6xl mb-6">🔄</div>
            <h2 className="text-3xl font-semibold mb-3">Official BlockDAG On-Ramp</h2>
            <p className="text-zinc-400 mb-8">
              Buy BDAG directly with XRP, ETH, BNB, USDT and other cryptos using BlockDAG’s official portal.
            </p>

            <button
              onClick={openOfficialPortal}
              className="w-full bg-amber-600 hover:bg-amber-500 py-7 rounded-3xl text-2xl font-medium mb-6"
            >
              Open Official Buy Portal →
            </button>

            <p className="text-xs text-zinc-500">
              • Memo required for XRP<br />
              • Funds arrive as BDAG on BlockDAG network<br />
              • Then swap to MAUI inside MAUI
            </p>
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
