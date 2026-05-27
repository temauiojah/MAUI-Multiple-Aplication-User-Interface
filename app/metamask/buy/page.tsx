'use client';
import Link from 'next/link';

export default function BuyPage() {
  const openOfficialPortal = () => {
    window.open('https://purchase3.blockdag.network/swap', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1>MAUI.MetaMask.Buy</h1>
        <p className="page-subtitle">Buy BDAG • Then Swap for MAUI</p>
        {/* rest of buy page content */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-10 text-center">
          <button onClick={openOfficialPortal} className="w-full bg-amber-600 hover:bg-amber-500 py-7 rounded-3xl text-2xl font-medium">
            Open Official Buy Portal →
          </button>
        </div>
      </div>
    </div>
  );
}
