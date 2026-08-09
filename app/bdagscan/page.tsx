'use client';

import { useAccount, useReadContract, useBalance, useSwitchChain, useChainId } from 'wagmi';
import Link from 'next/link';
import { useState } from 'react';

export default function BdagScanPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const explorerBase = 'https://bdagscan.com';
  const MAUI_CONTRACT = '0xe584D0963949d90C30Db7F9128765749510c67F6' as const;
  const BLOCKDAG_CHAIN_ID = 1404;

  const openInNewTab = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  const erc20Abi = [
    {
      constant: true,
      inputs: [],
      name: 'name',
      outputs: [{ name: '', type: 'string' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'symbol',
      outputs: [{ name: '', type: 'string' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', type: 'uint8' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'totalSupply',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
  ] as const;

  const { data: name } = useReadContract({
    address: MAUI_CONTRACT,
    abi: erc20Abi,
    functionName: 'name',
    chainId: BLOCKDAG_CHAIN_ID,
  });

  const { data: symbol } = useReadContract({
    address: MAUI_CONTRACT,
    abi: erc20Abi,
    functionName: 'symbol',
    chainId: BLOCKDAG_CHAIN_ID,
  });

  const { data: decimals } = useReadContract({
    address: MAUI_CONTRACT,
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: BLOCKDAG_CHAIN_ID,
  });

  const { data: totalSupply } = useReadContract({
    address: MAUI_CONTRACT,
    abi: erc20Abi,
    functionName: 'totalSupply',
    chainId: BLOCKDAG_CHAIN_ID,
  });

  const { data: mauiBalance } = useBalance({
    address,
    token: MAUI_CONTRACT,
    chainId: BLOCKDAG_CHAIN_ID,
    query: { enabled: isConnected && chainId === BLOCKDAG_CHAIN_ID },
  });

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      openInNewTab(`${explorerBase}/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Fixed: both Transfers and Holders now point to the real Contract Overview page
  // (bdagscan.com does not have /token/.../transfers or /holders — those 404)
  const contractOverviewUrl = `${explorerBase}/contractOverview/${MAUI_CONTRACT}`;
  const tokenTransfersUrl = contractOverviewUrl;
  const tokenHoldersUrl = contractOverviewUrl;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            MAUI.bdagscan
          </h1>
          <p className="page-subtitle text-base sm:text-lg md:text-xl text-zinc-400 mt-2">
            Official BlockDAG Explorer • Powered by MAUI
          </p>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real-time data for the MAUI ecosystem on BlockDAG (Chain ID: 1404)
          </p>
        </div>

        {/* Network Status */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 sm:px-6 py-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-center">
              {chainId === BLOCKDAG_CHAIN_ID
                ? 'Connected to BlockDAG Mainnet'
                : 'Not on BlockDAG'}
            </span>
            {isConnected && chainId !== BLOCKDAG_CHAIN_ID && (
              <button
                onClick={() => switchChain?.({ chainId: BLOCKDAG_CHAIN_ID })}
                className="text-xs bg-purple-600 hover:bg-purple-500 px-4 py-1.5 rounded-xl font-medium transition"
              >
                Switch to BlockDAG
              </button>
            )}
          </div>
        </div>

        {/* Search Bar – stacks on mobile */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10 md:mb-12">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search address, tx, block..."
              className="flex-1 w-full bg-zinc-900 border border-zinc-700 focus:border-purple-500 rounded-2xl sm:rounded-3xl px-5 py-4 text-base outline-none placeholder:text-zinc-500"
            />
            <button
              type="submit"
              className="w-full sm:w-auto bg-white text-zinc-950 px-6 py-4 rounded-2xl sm:rounded-3xl font-semibold hover:bg-purple-400 hover:text-white transition whitespace-nowrap"
            >
              Search on BDAG
            </button>
          </div>
        </form>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Token Overview Card */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold">{name || 'MAUI Token'}</h2>
                <p className="text-purple-400 text-lg sm:text-xl font-mono">{symbol || 'MAUI'}</p>
              </div>
              <button
                onClick={() => openInNewTab(contractOverviewUrl)}
                className="w-full sm:w-auto px-5 py-3 bg-white text-zinc-950 rounded-2xl font-semibold text-sm sm:text-base hover:bg-purple-400 hover:text-white transition"
              >
                View Full Contract →
              </button>
            </div>

            {/* Stats – 1 col on mobile, 3 on larger */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Total Supply</p>
                <p className="text-2xl sm:text-3xl font-mono mt-1 break-all">
                  {totalSupply
                    ? (Number(totalSupply) / 10 ** (decimals || 18)).toLocaleString()
                    : '2,000,000,000'}
                </p>
                <p className="text-sm text-zinc-400">{symbol || 'MAUI'}</p>
              </div>

              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Contract</p>
                <p className="font-mono text-xs sm:text-sm break-all mt-1 text-purple-300">
                  {MAUI_CONTRACT}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Your Balance</p>
                {isConnected ? (
                  <p className="text-2xl sm:text-3xl font-mono mt-1">
                    {mauiBalance
                      ? Number(mauiBalance.formatted).toLocaleString()
                      : '0.00'}{' '}
                    <span className="text-sm text-zinc-400">{symbol || 'MAUI'}</span>
                  </p>
                ) : (
                  <p className="text-zinc-400 text-sm mt-3">Connect wallet to see balance</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-8 flex flex-col">
            <h3 className="uppercase text-xs tracking-widest text-zinc-400 mb-4">MAUI Quick Links</h3>

            <div className="space-y-3 flex-1">
              <a
                href={contractOverviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition flex justify-between items-center"
              >
                <span>Contract Overview</span>
                <span className="text-xs text-zinc-400">→</span>
              </a>

              <a
                href={tokenTransfersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition flex justify-between items-center"
              >
                <span>Token Transfers</span>
                <span className="text-xs text-zinc-400">→</span>
              </a>

              <a
                href={tokenHoldersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition flex justify-between items-center"
              >
                <span>Top Holders</span>
                <span className="text-xs text-zinc-400">→</span>
              </a>

              <a
                href={`${explorerBase}/token`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition flex justify-between items-center"
              >
                <span>All Tokens on BlockDAG</span>
                <span className="text-xs text-zinc-400">→</span>
              </a>
            </div>

            <div className="mt-auto pt-6 border-t border-zinc-700 text-xs text-zinc-500">
              Data fetched live from BlockDAG RPC
              <br />
              <span className="font-mono break-all">{MAUI_CONTRACT}</span>
            </div>
          </div>
        </div>

        {/* Full Explorer Links */}
        <div className="text-center">
          <p className="text-zinc-400 mb-4 text-sm sm:text-base">
            Explore more on the official BlockDAG Explorer
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <button
              onClick={() => openInNewTab(explorerBase)}
              className="px-6 py-3.5 sm:px-8 sm:py-4 bg-zinc-900 hover:bg-white hover:text-zinc-950 border border-zinc-700 rounded-2xl sm:rounded-3xl font-medium transition text-sm sm:text-base"
            >
              Home
            </button>
            <button
              onClick={() => openInNewTab(`${explorerBase}/blocks`)}
              className="px-6 py-3.5 sm:px-8 sm:py-4 bg-zinc-900 hover:bg-white hover:text-zinc-950 border border-zinc-700 rounded-2xl sm:rounded-3xl font-medium transition text-sm sm:text-base"
            >
              Latest Blocks
            </button>
            <button
              onClick={() => openInNewTab(`${explorerBase}/tx`)}
              className="px-6 py-3.5 sm:px-8 sm:py-4 bg-zinc-900 hover:bg-white hover:text-zinc-950 border border-zinc-700 rounded-2xl sm:rounded-3xl font-medium transition text-sm sm:text-base"
            >
              Latest Transactions
            </button>
            <button
              onClick={() => openInNewTab(`${explorerBase}/topAccounts`)}
              className="px-6 py-3.5 sm:px-8 sm:py-4 bg-zinc-900 hover:bg-white hover:text-zinc-950 border border-zinc-700 rounded-2xl sm:rounded-3xl font-medium transition text-sm sm:text-base"
            >
              Top Accounts
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-zinc-500 mt-12 sm:mt-16">
          MAUI.bdagscan • Built for the MAUI ecosystem •{' '}
          <Link
            href="https://github.com/temauiojah/MAUI-Multiple-Aplication-User-Interface"
            className="underline hover:text-white"
          >
            View repo
          </Link>
        </div>
      </div>
    </div>
  );
}