'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1>MAUI</h1>
        <p className="page-subtitle">Multiple Application User Interface</p>
        <div className="mt-12 bg-zinc-900 border border-zinc-700 rounded-3xl p-10">
          <p className="text-zinc-400 text-lg">Welcome to MAUI — your gateway to the BlockDAG ecosystem.</p>
        </div>
      </div>
    </div>
  );
}
