'use client';

import { useState } from 'react';

export default function MetaMaskPage() {
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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-6xl font-bold mb-8">MAUI<span className="text-blue-500">.</span></h1>
        <p className="text-2xl mb-12">MetaMask Portal</p>

        <button
          onClick={connectMetaMask}
          className="w-full bg-blue-600 hover:bg-blue-700 px-12 py-6 rounded-3xl text-2xl font-medium mb-12 transition-all"
        >
          Connect MetaMask
        </button>

        {connectedAddress && (
          <div className="bg-zinc-900 border border-emerald-500 rounded-3xl p-8">
            <p className="text-emerald-400 mb-2">CONNECTED</p>
            <p className="font-mono text-lg break-all">{connectedAddress}</p>
          </div>
        )}
      </div>
    </div>
  );
}
