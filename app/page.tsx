'use client';

import Header from '../components/Header';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20">
      <Header />
      
      <div className="max-w-4xl mx-auto px-8 py-20 text-center">
        <h1 className="text-7xl font-bold mb-6">Welcome to MAUI</h1>
        <p className="text-2xl text-zinc-400">Multiple Application User Interface on BlockDAG</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          <Link href="/metamask" className="bg-zinc-900 border border-zinc-700 hover:border-blue-500 rounded-3xl p-10 transition-all">
            <div className="text-5xl mb-6">🔗</div>
            <h2 className="text-3xl font-bold">MAUI.MetaMask</h2>
            <p className="text-zinc-400 mt-3">Wallet + Balance</p>
          </Link>

          <Link href="/pay" className="bg-zinc-900 border border-zinc-700 hover:border-emerald-500 rounded-3xl p-10 transition-all">
            <div className="text-5xl mb-6">🌐</div>
            <h2 className="text-3xl font-bold">MAUI PAY</h2>
            <p className="text-zinc-400 mt-3">Pay with MAUI</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
