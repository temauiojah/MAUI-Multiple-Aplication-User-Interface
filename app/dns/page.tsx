'use client';

import { useState, useMemo } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { blockDAGMainnet } from '@/lib/chains';
import Link from 'next/link';

const MAUI_TOKEN = '0xe584D0963949d90C30Db7F9128765749510c67F6';

function isValidName(raw: string): { ok: boolean; reason?: string } {
  const name = raw.trim().toLowerCase();
  if (!name) return { ok: false, reason: 'Enter a name' };
  if (name.length < 3) return { ok: false, reason: 'Minimum 3 characters' };
  if (name.length > 32) return { ok: false, reason: 'Maximum 32 characters' };
  if (!/^[a-z0-9-]+$/.test(name)) {
    return { ok: false, reason: 'Only lowercase letters, numbers and hyphens' };
  }
  if (name.startsWith('-') || name.endsWith('-')) {
    return { ok: false, reason: 'Cannot start or end with a hyphen' };
  }
  if (name.includes('--')) {
    return { ok: false, reason: 'No consecutive hyphens' };
  }
  return { ok: true };
}

export default function DnsPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [search, setSearch] = useState('');
  const [searched, setSearched] = useState(false);

  const validation = useMemo(() => isValidName(search), [search]);
  const cleanName = search.trim().toLowerCase();
  const fullName = cleanName ? `${cleanName}.maui` : '';

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!validation.ok) return;
    setSearched(true);
  }

  async function handleRegisterClick() {
    if (!isConnected) return;
    if (chainId !== blockDAGMainnet.id) {
      try {
        await switchChain({ chainId: blockDAGMainnet.id });
      } catch {
        // user rejected
      }
      return;
    }
    alert(
      'MauiDNS contract is not deployed yet.\n\nWhen live, this will:\n1. Approve MAUI tokens\n2. Call register("' +
        cleanName +
        '")\n3. Give you permanent ownership of the name'
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            MAUI.DNS
          </h1>
          <p className="page-subtitle mt-2 text-zinc-400 text-base md:text-lg">
            Web3 Domain & Subdomain Manager
          </p>
          <p className="text-sm text-zinc-500 mt-3 max-w-xl mx-auto leading-relaxed">
            Own a permanent on-chain identity. Register{' '}
            <span className="text-blue-400 font-medium">yourname.maui</span> and
            unlock profiles, messaging, payments and websites across the entire
            MAUI ecosystem.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 md:p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-500 font-medium mb-2">
                Search a name
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSearched(false);
                    }}
                    placeholder="yourname"
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-blue-500 rounded-2xl px-5 py-4 text-lg outline-none placeholder:text-zinc-600 font-mono"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm pointer-events-none">
                    .maui
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!validation.ok}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-zinc-950 font-semibold hover:bg-blue-400 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Check
                </button>
              </div>
              {!validation.ok && search.trim() && (
                <p className="mt-2 text-sm text-amber-400">{validation.reason}</p>
              )}
            </div>
          </form>

          {/* Result */}
          {searched && validation.ok && (
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-2xl font-mono font-semibold text-blue-300">
                    {fullName}
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Name format is valid · Ready for registration
                  </p>
                </div>

                {isConnected ? (
                  <button
                    onClick={handleRegisterClick}
                    className="shrink-0 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 font-semibold transition shadow-lg shadow-blue-900/20"
                  >
                    {chainId !== blockDAGMainnet.id
                      ? 'Switch to BlockDAG'
                      : 'Register with MAUI'}
                  </button>
                ) : (
                  <div className="shrink-0">
                    <ConnectButton />
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
                Registration will require a MAUI token payment. The name is
                permanent and fully owned by your wallet. No annual renewals.
              </p>
            </div>
          )}
        </div>

        {/* What you unlock */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-semibold mb-5">
            What you get with a .maui name
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <p className="font-medium text-zinc-100">On-chain Identity</p>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                Permanent name controlled only by your wallet key.
              </p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <p className="font-medium text-zinc-100">Receive by Name</p>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                People can send BDAG & MAUI to yourname.maui.
              </p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <p className="font-medium text-zinc-100">Profile Page</p>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                Public profile with bio, avatar, links and website.
              </p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <p className="font-medium text-zinc-100">Messaging</p>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                Chat via XMTP using your name instead of 0x address.
              </p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <p className="font-medium text-zinc-100">In-app Browser</p>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                Point your name to IPFS or a URL and serve a site.
              </p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <p className="font-medium text-zinc-100">Token Utility</p>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                Registration paid in MAUI — real demand for the token.
              </p>
            </div>
          </div>
        </div>

        {/* Status + How it works */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <h3 className="font-semibold text-lg mb-3">Current Status</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">●</span>
                Frontend live
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">●</span>
                MauiDNS contract — not yet deployed
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-500 mt-0.5">●</span>
                Registration & resolution coming next
              </li>
            </ul>
            <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
              Once the contract is live on BlockDAG (Chain ID 1404), this page
              will support real availability checks, MAUI payments, and on-chain
              ownership.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <h3 className="font-semibold text-lg mb-3">How it works</h3>
            <ol className="space-y-3 text-sm text-zinc-400 list-decimal list-inside">
              <li>Search a name (3–32 characters)</li>
              <li>Connect MetaMask on BlockDAG</li>
              <li>Pay the registration fee in MAUI</li>
              <li>You become the permanent owner</li>
              <li>Set address, profile data & content later</li>
            </ol>
          </div>
        </div>

        {/* Token note */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-center">
          <p className="text-sm text-zinc-400">
            MAUI token contract:{' '}
            <code className="text-blue-300 font-mono text-xs break-all">
              {MAUI_TOKEN}
            </code>
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            Holding MAUI unlocks the full Multiple Application User Interface —
            identity, chat, profiles, browser and more.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/metamask"
              className="text-sm px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition"
            >
              Wallet Dashboard
            </Link>
            <Link
              href="/chat"
              className="text-sm px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition"
            >
              Open Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}