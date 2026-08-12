// app/grokoracle/page.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function GrokOraclePage() {
  const { address, isConnected } = useAccount();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/grok',
      body: {
        walletAddress: address ?? null,
      },
    }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Safer scroll – only the messages container, not the whole page
  useEffect(() => {
    if (messages.length === 0) return;
    const el = messagesEndRef.current;
    if (!el) return;

    const scrollParent = el.closest('.overflow-y-auto') as HTMLElement | null;
    if (scrollParent) {
      scrollParent.scrollTop = scrollParent.scrollHeight;
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    await sendMessage({ text });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }

  function getMessageText(m: any): string {
    if (typeof m.content === 'string') return m.content;
    if (Array.isArray(m.parts)) {
      return m.parts.map((p: any) => p.text || '').join('');
    }
    return '';
  }

  const showWelcome = messages.length === 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-8 px-4 flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex flex-col flex-1">
        {/* Standardized hero */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            GROKoracle
          </h1>
          <p className="page-subtitle mt-2">
            AI assistant for the MAUI ecosystem • Powered by Grok
          </p>
        </div>

        {/* Chat card */}
        <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden min-h-[380px] md:min-h-[520px] max-h-[calc(100dvh-11rem)]">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {showWelcome && (
              <div className="flex justify-start">
                <div className="relative max-w-[85%] px-4 py-3 text-sm leading-relaxed bg-zinc-800 text-zinc-100 rounded-2xl rounded-bl-md border border-zinc-700">
                  <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-violet-300">
                    GROKoracle
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    Hey! I&apos;m <strong>GROKoracle</strong> — your MAUI ecosystem
                    assistant powered by Grok.
                    {'\n\n'}
                    Ask me anything about MAUI, BlockDAG, the wallet, chat,
                    token utility, or how the app works.
                  </div>
                </div>
              </div>
            )}

            {messages
              .filter((m) => m.role !== 'system')
              .map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`
                      relative max-w-[85%] px-4 py-3 text-sm leading-relaxed
                      ${
                        m.role === 'user'
                          ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-br-md'
                          : 'bg-zinc-800 text-zinc-100 rounded-2xl rounded-bl-md border border-zinc-700'
                      }
                    `}
                  >
                    {m.role === 'assistant' && (
                      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-violet-300">
                        GROKoracle
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">
                      {getMessageText(m)}
                    </div>
                  </div>
                </div>
              ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-950/50 border-t border-red-900 text-red-300 text-sm">
              {error.message || 'Something went wrong. Please try again.'}
            </div>
          )}

          <div className="border-t border-zinc-700 p-4 bg-zinc-900/80">
            {!isConnected ? (
              <div className="text-center py-3 space-y-3">
                <p className="text-zinc-400 text-sm">
                  Connect your wallet to chat with GROKoracle
                </p>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about MAUI, BlockDAG, the wallet, chat..."
                  rows={1}
                  className="flex-1 resize-none bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 max-h-32"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="shrink-0 h-11 px-5 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                >
                  {isLoading ? '...' : 'Send'}
                </button>
              </form>
            )}

            {isConnected && (
              <p className="mt-2 text-[11px] text-zinc-500 text-center">
                Connected as {address?.slice(0, 6)}…{address?.slice(-4)} •
                Powered by xAI Grok
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-zinc-500">
          <Link
            href="/metamask"
            className="hover:text-zinc-300 transition-colors"
          >
            Wallet
          </Link>
          <Link href="/chat" className="hover:text-zinc-300 transition-colors">
            Chat
          </Link>
          <Link
            href="/contact"
            className="hover:text-zinc-300 transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
