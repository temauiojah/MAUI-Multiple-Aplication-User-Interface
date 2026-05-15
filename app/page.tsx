'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { blockDAGMainnet } from '@/lib/chains';
import { formatUnits } from 'viem';

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balanceData } = useBalance({
    address,
    chainId: blockDAGMainnet.id,
  });

  const formattedBalance = balanceData
    ? parseFloat(formatUnits(balanceData.value, 18)).toFixed(4)
    : '0.0000';

  const copyAddress = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-8">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-7xl font-bold mb-2">MAUI<span className="text-blue-500">.</span></h1>
        <p className="text-xl text-zinc-400 mb-8">Multiple Application User Interface</p>

        <ConnectButton 
          label="Connect MetaMask to MAUI"
          showBalance={false}
        />

        {isConnected && (
          <div className="mt-10 bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center text-2xl">🪙</div>
                <div>
                  <p className="text-sm text-zinc-400">BlockDAG Mainnet</p>
                  <p className="font-mono text-emerald-400">Chain ID: {chainId}</p>
                </div>
              </div>
              <button
                onClick={copyAddress}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-2xl font-mono"
              >
                {address?.slice(0, 6)}...{address?.slice(-4)} 📋
              </button>
            </div>

            <div className="text-center">
              <p className="text-6xl font-bold tracking-tighter">{formattedBalance}</p>
              <p className="text-2xl text-emerald-400 font-medium">BDAG</p>
            </div>

            <div className="mt-6 text-xs text-emerald-400 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              LIVE BALANCE
            </div>
          </div>
        )}

        <p className="mt-12 text-xs text-zinc-500">
          Chain ID: 1404 • BlockDAG Mainnet • Ready for MAUI DNS PAY + MAUI.GROK AI
        </p>
      </div>
    </div>
  );
}
