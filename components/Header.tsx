'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-zinc-900/95 border-b border-zinc-800 backdrop-blur-md z-50">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold">
          MAUI
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/metamask" className={`px-5 py-2 rounded-2xl transition-all ${isActive('/metamask') ? 'bg-blue-600 text-white' : 'hover:text-blue-400'}`}> .MetaMask </Link>
          <Link href="/pay" className={`px-5 py-2 rounded-2xl transition-all ${isActive('/pay') ? 'bg-blue-600 text-white' : 'hover:text-emerald-400'}`}> .Pay </Link>
          <Link href="/grok" className={`px-5 py-2 rounded-2xl transition-all ${isActive('/grok') ? 'bg-blue-600 text-white' : 'hover:text-purple-400'}`}> .Grok AI </Link>
          <Link href="/dns" className={`px-5 py-2 rounded-2xl transition-all ${isActive('/dns') ? 'bg-blue-600 text-white' : 'hover:text-amber-400'}`}> .DNS </Link>
        </div>

        {/* Mobile Hamburger */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-3xl focus:outline-none"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-zinc-900 border-t border-zinc-800 py-6">
          <div className="flex flex-col gap-4 px-8 text-lg">
            <Link href="/metamask" onClick={() => setMenuOpen(false)} className={`py-3 px-5 rounded-2xl ${isActive('/metamask') ? 'bg-blue-600 text-white' : 'hover:bg-zinc-800'}`}> .MetaMask </Link>
            <Link href="/pay" onClick={() => setMenuOpen(false)} className={`py-3 px-5 rounded-2xl ${isActive('/pay') ? 'bg-blue-600 text-white' : 'hover:bg-zinc-800'}`}> .Pay </Link>
            <Link href="/grok" onClick={() => setMenuOpen(false)} className={`py-3 px-5 rounded-2xl ${isActive('/grok') ? 'bg-blue-600 text-white' : 'hover:bg-zinc-800'}`}> .Grok AI </Link>
            <Link href="/dns" onClick={() => setMenuOpen(false)} className={`py-3 px-5 rounded-2xl ${isActive('/dns') ? 'bg-blue-600 text-white' : 'hover:bg-zinc-800'}`}> .DNS </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
