'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-zinc-950 border-b border-zinc-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-3xl font-bold tracking-tight">MAUI</Link>

          {/* Desktop Menu - No top-level Buy anymore */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/metamask" className={isActive('/metamask') ? 'text-blue-400' : 'hover:text-zinc-300'}>MetaMask</Link>
            <Link href="/grokoracle" className={isActive('/grokoracle') ? 'text-blue-400' : 'hover:text-zinc-300'}>GROKoracle</Link>
            <Link href="/chat" className={isActive('/chat') ? 'text-blue-400' : 'hover:text-zinc-300'}>Chat</Link>
            <Link href="/dns" className={isActive('/dns') ? 'text-blue-400' : 'hover:text-zinc-300'}>DNS</Link>
            <Link href="/bdagscan" className={isActive('/bdagscan') ? 'text-blue-400' : 'hover:text-zinc-300'}>BdagScan</Link>
          </nav>

          <button 
            onClick={() => setMenuOpen(true)}
            className="md:hidden text-3xl text-white"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Mobile Sidebar - Buy removed from top level */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50 md:hidden" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-80 bg-zinc-900 border-r border-zinc-700 z-50 shadow-2xl md:hidden">
            <div className="p-6 flex items-center justify-between border-b border-zinc-700">
              <Link href="/" className="text-3xl font-bold">MAUI</Link>
              <button onClick={() => setMenuOpen(false)} className="text-4xl text-zinc-400 hover:text-white">✕</button>
            </div>
            <div className="flex flex-col p-6 text-lg font-medium gap-6">
              <Link href="/metamask" onClick={() => setMenuOpen(false)} className={isActive('/metamask') ? 'text-blue-400' : ''}>MetaMask</Link>
              <Link href="/grokoracle" onClick={() => setMenuOpen(false)} className={isActive('/grokoracle') ? 'text-blue-400' : ''}>GROKoracle</Link>
              <Link href="/chat" onClick={() => setMenuOpen(false)} className={isActive('/chat') ? 'text-blue-400' : ''}>Chat</Link>
              <Link href="/dns" onClick={() => setMenuOpen(false)} className={isActive('/dns') ? 'text-blue-400' : ''}>DNS</Link>
              <Link href="/bdagscan" onClick={() => setMenuOpen(false)} className={isActive('/bdagscan') ? 'text-blue-400' : ''}>BdagScan</Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
