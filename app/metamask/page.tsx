'use client';

import { useAccount, useDisconnect, useBalance, useReadContract } from 'wagmi';
import { blockDAGMainnet } from '@/lib/chains';
import { formatUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

const MAUI_TOKEN_ADDRESS = '0xe584D0963949d90C30Db7F9128765749510c67F6';

export default function MetaMaskPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const { data: bdagBalance } = useBalance({ 
    address, 
    chainId: blockDAGMainnet.id 
  });

  const { data: mauiRaw } = useReadContract({
    address: MAUI_TOKEN_ADDRESS,
    abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const formattedBdag = bdagBalance ? parseFloat(formatUnits(bdagBalance.value, 18)).toFixed(4) : '0.0000';
  const formattedMaui = mauiRaw ? parseFloat(formatUnits(mauiRaw as bigint, 18)).toFixed(2) : '0.00';

  const handleDisconnect = () => disconnect();

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Responsive heading */}
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center">MAUI.MetaMask</h1>
        <p className="text-blue-400 text-lg md:text-xl text-center mb-12">Your BlockDAG Wallet Dashboard</p>

        {!isConnected ? (
          <div className="flex justify-center">
            <ConnectButton 
              label="Connect Wallet"
              showBalance={false}
            />
          </div>
        ) : (
          <>
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 mb-8">
              <div className="flex justify-between items-center mb-8">
                <p className="text-emerald-400 font-medium">CONNECTED ON BLOCKDAG</p>
                <button 
                  onClick={handleDisconnect} 
                  className="text-sm bg-red-600 hover:bg-red-700 px-5 py-2 rounded-2xl"
                >
                  Disconnect
                </button>
              </div>

              <div className="space-y-10">
                <div className="text-center border-b border-zinc-700 pb-8">
                  <p className="text-sm text-zinc-400 mb-1">BDAG Balance</p>
                  <p className="text-5xl md:text-6xl font-bold tracking-tighter text-white">{formattedBdag}</p>
                  <p className="text-emerald-400 text-2xl">BDAG</p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-zinc-400 mb-1">MAUI Balance</p>
                  <p className="text-5xl md:text-6xl font-bold tracking-tighter text-blue-400">{formattedMaui}</p>
                  <p className="text-blue-400 text-2xl">MAUI</p>
                </div>
              </div>
            </div>

            <Link href="/metamask/buy">
              <div className="mb-8 bg-zinc-900 border border-zinc-700 hover:border-amber-500 rounded-3xl p-8 cursor-pointer transition-all flex items-center justify-between">
                <div>
                  <div className="text-5xl mb-4">🔄</div>
                  <h3 className="text-2xl font-semibold">Buy BDAG</h3>
                  <p className="text-zinc-400">Official BlockDAG on-ramp</p>
                </div>
                <span className="text-5xl text-amber-400">→</span>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-4">
              <button className="bg-emerald-600 hover:bg-emerald-500 py-8 rounded-3xl text-lg font-medium">Send</button>
              <button className="bg-zinc-800 hover:bg-zinc-700 py-8 rounded-3xl text-lg font-medium">Swap</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
