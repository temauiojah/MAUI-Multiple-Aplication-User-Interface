'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-7xl font-bold mb-2">MAUI<span className="text-blue-500">.</span></h1>
        <p className="text-xl text-zinc-400 mb-16">Multiple Application User Interface</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/pay" className="bg-zinc-900 border border-zinc-700 hover:border-emerald-500 rounded-3xl p-8 transition-all">
            <div className="text-4xl mb-4">🌐</div>
            <h2 className="text-2xl font-bold">MAUI PAY</h2>
            <p className="text-zinc-400 mt-2">Pay with MAUI token</p>
          </Link>

          <Link href="/grok" className="bg-zinc-900 border border-zinc-700 hover:border-blue-500 rounded-3xl p-8 transition-all">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold">MAUI.GROK AI</h2>
            <p className="text-zinc-400 mt-2">AI Assistant</p>
          </Link>

          <Link href="/dns" className="bg-zinc-900 border border-zinc-700 hover:border-purple-500 rounded-3xl p-8 transition-all">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-2xl font-bold">MAUI DNS</h2>
            <p className="text-zinc-400 mt-2">Domain Management</p>
          </Link>
        </div>

        <p className="mt-16 text-xs text-zinc-500">Building the MAUI Subdomain Ecosystem</p>
      </div>
    </div>
  );
}
