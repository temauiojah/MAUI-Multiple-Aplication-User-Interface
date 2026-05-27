'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Consistent heading style matching MAUI.MetaMask */}
        <h1 className="text-4xl md:text-5xl font-bold mb-2">MAUI</h1>
        <p className="text-blue-400 text-lg md:text-xl mb-12">Multiple Application User Interface</p>

        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-10">
          <p className="text-zinc-400 text-lg leading-relaxed">
            Welcome to MAUI — your gateway to the BlockDAG ecosystem.<br />
            Connect MetaMask to access MetaMask, Buy, GROKoracle, Chat, DNS, BdagScan and more.
          </p>

          <div className="mt-10">
            <Link href="/metamask">
              <button className="bg-blue-600 hover:bg-blue-700 px-12 py-6 rounded-3xl text-xl font-medium">
                Get Started with MetaMask
              </button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <Link href="/metamask" className="block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-3xl p-6 text-left">
            <span className="text-blue-400">MetaMask</span>
          </Link>
          <Link href="/metamask/buy" className="block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-3xl p-6 text-left">
            <span className="text-amber-400">Buy</span>
          </Link>
          <Link href="/grokoracle" className="block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-3xl p-6 text-left">
            <span className="text-blue-400">GROKoracle</span>
          </Link>
          <Link href="/chat" className="block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-3xl p-6 text-left">
            <span className="text-emerald-400">Chat</span>
          </Link>
          <Link href="/dns" className="block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-3xl p-6 text-left">
            <span className="text-blue-400">DNS</span>
          </Link>
          <Link href="/bdagscan" className="block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-3xl p-6 text-left">
            <span className="text-blue-400">BdagScan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
