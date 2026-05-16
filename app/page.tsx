'use client';

import { useState } from 'react';

export default function Home() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const connectMetaMask = async () => {
    if (!(window as any).ethereum) {
      alert("MetaMask not detected!");
      return;
    }

    try {
      const accounts = await (window as any).ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setConnectedAddress(accounts[0]);
      alert("✅ Connected successfully!\n\nAddress: " + accounts[0]);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-7xl font-bold mb-2">MAUI<span className="text-blue-500">.</span></h1>
        <p className="text-xl text-zinc-400 mb-12">Multiple Application User Interface</p>

        <button
          onClick={connectMetaMask}
          className="bg-blue-600 hover:bg-blue-700 px-12 py-5 rounded-2xl text-xl font-medium mb-16 transition-all active:scale-95"
        >
          {connectedAddress ? "✅ Connected" : "Connect MetaMask to MAUI"}
        </button>

        {connectedAddress && (
          <p className="text-emerald-400 mb-12 font-mono text-sm">
            Connected: {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
          </p>
        )}

        {/* MAUI DNS PAY - Updated with .maui and MAUI token */}
        <div className="mb-12 bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-3">
            🌐 MAUI DNS PAY
          </h2>
          <p className="text-zinc-400 mb-8">Pay for domains and services with MAUI</p>
          
          <input 
            type="text" 
            placeholder="yourname.maui" 
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4 mb-6 text-lg"
          />
          
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => alert("10 MAUI payment for 1 year domain initiated")} className="bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl font-medium">1 Year - 10 MAUI</button>
            <button onClick={() => alert("25 MAUI payment for 3 years initiated")} className="bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl font-medium">3 Years - 25 MAUI</button>
            <button onClick={() => alert("50 MAUI payment for Lifetime initiated")} className="bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl font-medium">Lifetime - 50 MAUI</button>
          </div>
        </div>

        {/* MAUI.GROK AI MODULE */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6">🤖 MAUI.GROK AI MODULE</h2>
          <p className="text-zinc-400 mb-6">Ask Grok anything</p>
          
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl h-64 mb-4 p-4 overflow-y-auto text-left text-sm" id="chat">
            Welcome! Ask me about BlockDAG, MAUI, vesting tokens, or DNS.
          </div>
          
          <div className="flex gap-3">
            <input 
              id="prompt" 
              type="text" 
              placeholder="What is MAUI DNS?" 
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4"
              onKeyPress={(e) => e.key === 'Enter' && alert("Grok would answer here (API coming soon)")}
            />
            <button 
              onClick={() => alert("Grok would answer here (API coming soon)")}
              className="bg-blue-600 hover:bg-blue-500 px-8 rounded-2xl font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
