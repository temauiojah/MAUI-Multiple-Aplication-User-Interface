'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useState } from 'react';

export default function BuyPage() {
  const { isConnected } = useAccount();
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'wallet' | null>(null);

  const openMetaMaskBuy = () => {
    window.open('https://portfolio.metamask.io/buy?chainId=1404', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3">MAUI.MetaMask.Buy</h1>
          <p className="text-zinc-400 text-xl">Get MAUI Tokens Instantly</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Credit Card Option */}
            <div 
              onClick={() => setSelectedMethod('card')}
              className={`p-8 rounded-3xl border cursor-pointer transition-all hover:border-blue-500 ${selectedMethod === 'card' ? 'border-blue-500 bg-zinc-800' : 'border-zinc-700'}`}
            >
              <div className="text-5xl mb-6">💳</div>
              <h3 className="text-2xl font-semibold mb-2">Credit / Debit Card</h3>
              <p className="text-zinc-400 mb-6">Visa, Mastercard, Apple Pay, Google Pay via MetaMask</p>
              <p className="text-emerald-400 font-medium">Fast • Secure • No extra accounts</p>
            </div>

            {/* Pay with MetaMask */}
            <div 
              onClick={() => setSelectedMethod('wallet')}
              className={`p-8 rounded-3xl border cursor-pointer transition-all hover:border-emerald-500 ${selectedMethod === 'wallet' ? 'border-emerald-500 bg-zinc-800' : 'border-zinc-700'}`}
            >
              <div className="text-5xl mb-6">🦊</div>
              <h3 className="text-2xl font-semibold mb-2">Pay with MetaMask</h3>
              <p className="text-zinc-400 mb-6">Swap BDAG or other tokens directly for MAUI</p>
              <p className="text-emerald-400 font-medium">Instant • Lowest Fees</p>
            </div>
          </div>
        </div>

        {/* Action Area */}
        {selectedMethod ? (
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-10 text-center">
            {selectedMethod === 'card' ? (
              <div>
                <p className="text-xl mb-6">Buy using MetaMask’s secure checkout</p>
                <button 
                  onClick={openMetaMaskBuy}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-3xl text-xl font-medium"
                >
                  Buy with Credit Card via MetaMask →
                </button>
                <p className="text-xs text-zinc-500 mt-6">Opens MetaMask • Funds arrive as BDAG</p>
              </div>
            ) : (
              <div>
                <p className="text-xl mb-6">Connect your wallet to swap for MAUI</p>
                {!isConnected ? (
                  <Link href="/metamask">
                    <button className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-3xl text-xl font-medium">
                      Connect MetaMask First
                    </button>
                  </Link>
                ) : (
                  <button 
                    onClick={() => alert("Swap interface would appear here (BDAG → MAUI)")}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-3xl text-xl font-medium"
                  >
                    Swap Tokens for MAUI
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-zinc-400">Choose a payment method above</p>
        )}

        <div className="mt-12 text-center">
          <Link href="/metamask" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300">
            ← Back to MAUI.MetaMask
          </Link>
        </div>
      </div>
    </div>
  );
}
