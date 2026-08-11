import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MAUI — Multiple Application User Interface',
  description: 'BDAG + MetaMask Powered dApp',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-950 text-white overflow-x-hidden`}>
        <Providers>
          <Header />
          <main className="pt-20 min-h-screen">
            {children}
          </main>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}