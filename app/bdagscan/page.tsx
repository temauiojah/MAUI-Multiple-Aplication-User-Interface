'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function BdagScanPage() {
  const { address, isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-center">MAUI.bdagscan</h1>
        <p className="page-subtitle text-center">Official BlockDAG Explorer</p>
        {/* rest of your bdagscan content remains */}
      </div>
    </div>
  );
}
