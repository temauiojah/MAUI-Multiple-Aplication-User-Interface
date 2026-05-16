'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-zinc-900/95 border-b border-zinc-800 backdrop-blur-md z-50">
      <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="text-2xl font-bold">
            MAUI
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link 
              href="/metamask" 
              className={`px-5 py-2 rounded-2xl transition-all ${isActive('/metamask') ? 'bg-blue-600 text-white' : 'hover:text-blue-400'}`}
            >
              .MetaMask
            </Link>
            <Link 
              href="/pay" 
              className={`px-5 py-2 rounded-2xl transition-all ${isActive('/pay') ? 'bg-blue-600 text-white' : 'hover:text-emerald-400'}`}
            >
              .Pay
            </Link>
            <Link 
              href="/grok" 
              className={`px-5 py-2 rounded-2xl transition-all ${isActive('/grok') ? 'bg-blue-600 text-white' : 'hover:text-purple-400'}`}
            >
              .Grok AI
            </Link>
            <Link 
              href="/dns" 
              className={`px-5 py-2 rounded-2xl transition-all ${isActive('/dns') ? 'bg-blue-600 text-white' : 'hover:text-amber-400'}`}
            >
              .DNS
            </Link>
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          MAUI Subdomain Ecosystem
        </div>
      </div>
    </nav>
  );
}
