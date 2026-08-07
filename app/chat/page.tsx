// app/chat/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { isAddress } from 'viem';
import { IdentifierKind } from '@xmtp/browser-sdk';
import { useXmtpClient } from '@/hooks/useXmtpClient';

type Conversation = {
  id: string;
  peerAddress?: string;
  _raw: any;
};

type Message = {
  id: string;
  content: string;
  senderAddress: string;
  sentAt: Date;
};

function extractContent(raw: any): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw.content === 'string') return raw.content;
  if (typeof raw.text === 'string') return raw.text;
  if (raw.content?.text) return String(raw.content.text);
  if (raw.content?.content) return String(raw.content.content);
  try {
    return JSON.stringify(raw);
  } catch {
    return '[unsupported message]';
  }
}

export default function ChatPage() {
  const { address, isConnected } = useAccount();
  const { client, status, error, initialize, isReady } = useXmtpClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newPeer, setNewPeer] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<{ return?: () => void } | null>(null);

  const loadConversations = useCallback(async () => {
    if (!client) return;
    setLoadingConvos(true);
    try {
      await client.conversations.sync();
      const convos = await client.conversations.list();

      const mapped: Conversation[] = convos.map((c: any) => {
        let peer = 'Unknown';
        if (typeof c.peerAddress === 'string') peer = c.peerAddress;
        else if (typeof c.peerInboxId === 'string') peer = c.peerInboxId;
        else if (c.peerAddress?.identifier) peer = c.peerAddress.identifier;

        return { id: c.id, peerAddress: peer, _raw: c };
      });

      setConversations(mapped);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingConvos(false);
    }
  }, [client]);

  useEffect(() => {
    if (isReady) loadConversations();
  }, [isReady, loadConversations]);

  useEffect(() => {
    if (!activeConv || !client) return;
    let cancelled = false;

    async function startStream() {
      try {
        const existing = await activeConv!._raw.messages();
        if (!cancelled) {
          setMessages(
            existing.map((m: any) => ({
              id: m.id,
              content: extractContent(m.content ?? m),
              senderAddress: m.senderAddress ?? m.senderInboxId ?? 'unknown',
              sentAt: m.sentAt ?? new Date(),
            }))
          );
        }

        const stream = await activeConv!._raw.stream();
        streamRef.current = stream;

        for await (const msg of stream) {
          if (cancelled) break;
          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              content: extractContent(msg.content ?? msg),
              senderAddress: msg.senderAddress ?? msg.senderInboxId ?? 'unknown',
              sentAt: msg.sentAt ?? new Date(),
            },
          ]);
        }
      } catch (err) {
        if (!cancelled) console.error('Message stream error', err);
      }
    }

    startStream();
    return () => {
      cancelled = true;
      try {
        streamRef.current?.return?.();
      } catch {}
    };
  }, [activeConv, client]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function startChat() {
    if (!client || !newPeer.trim()) return;
    const peer = newPeer.trim().toLowerCase();
    if (!isAddress(peer)) {
      alert('Please enter a valid Ethereum address (0x…)');
      return;
    }

    try {
      const dm = await client.conversations.createDmWithIdentifier({
        identifier: peer,
        identifierKind: IdentifierKind.Ethereum,
      });

      const mapped: Conversation = {
        id: dm.id,
        peerAddress: peer,
        _raw: dm,
      };

      setConversations((prev) => {
        if (prev.some((c) => c.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });
      setActiveConv(mapped);
      setNewPeer('');
    } catch (err: any) {
      console.error(err);
      alert(
        err?.message ||
          'Could not start conversation. Make sure the other account has also clicked “Enable Encrypted Chat”.'
      );
    }
  }

  async function sendMessage() {
    if (!activeConv || !draft.trim() || sending) return;
    setSending(true);
    try {
      await activeConv._raw.sendText(draft.trim());
      setDraft('');
    } catch (err) {
      console.error('Send failed', err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1>MAUI.Chat</h1>
          <p className="page-subtitle">End-to-End Encrypted • Decentralized Messaging</p>
          <div className="mt-12 bg-zinc-900 border border-zinc-700 rounded-3xl p-10 mx-auto max-w-md space-y-6">
            <p className="text-zinc-400">Connect MetaMask to access MAUI.Chat</p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1>MAUI.Chat</h1>
          <p className="page-subtitle">End-to-End Encrypted • Decentralized Messaging</p>
          <div className="mt-12 bg-zinc-900 border border-zinc-700 rounded-3xl p-10 mx-auto max-w-md space-y-6">
            <p className="text-zinc-300 text-sm">
              Signed in as{' '}
              <span className="font-mono text-blue-400">
                {address?.slice(0, 6)}…{address?.slice(-4)}
              </span>
            </p>
            {status === 'error' && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={initialize}
              disabled={status === 'initializing'}
              className="w-full py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {status === 'initializing' ? 'Enabling XMTP…' : 'Enable Encrypted Chat'}
            </button>
            <p className="text-zinc-500 text-xs leading-relaxed">
              You will be asked to sign a message. This does <strong>not</strong> cost gas and only
              proves you own the wallet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-6 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">MAUI.Chat</h1>
          <p className="page-subtitle mt-1">End-to-End Encrypted • Decentralized</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-11rem)]">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-700">
              <p className="text-sm font-medium text-zinc-300 mb-3">New conversation</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x… address"
                  value={newPeer}
                  onChange={(e) => setNewPeer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startChat()}
                  className="flex-1 bg-zinc-800 border border-zinc-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={startChat}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
                >
                  Start
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingConvos && <p className="text-zinc-500 text-sm p-3">Loading conversations…</p>}
              {!loadingConvos && conversations.length === 0 && (
                <p className="text-zinc-500 text-sm p-3">No conversations yet</p>
              )}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConv(c)}
                  className={`w-full text-left px-3 py-3 rounded-2xl text-sm transition-colors ${
                    activeConv?.id === c.id
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <span className="font-mono">
                    {typeof c.peerAddress === 'string' && c.peerAddress.length > 10
                      ? `${c.peerAddress.slice(0, 6)}…${c.peerAddress.slice(-4)}`
                      : c.peerAddress || 'Unknown'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-zinc-900 border border-zinc-700 rounded-3xl flex flex-col overflow-hidden">
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                Select or start a conversation
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-zinc-700 flex items-center justify-between">
                  <span className="font-mono text-sm text-blue-400">
                    {typeof activeConv.peerAddress === 'string' && activeConv.peerAddress.length > 10
                      ? `${activeConv.peerAddress.slice(0, 8)}…${activeConv.peerAddress.slice(-6)}`
                      : activeConv.peerAddress || 'Conversation'}
                  </span>
                  <button
                    onClick={() => setActiveConv(null)}
                    className="text-zinc-500 hover:text-white text-sm"
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => {
                    const isMe = m.senderAddress.toLowerCase() === address?.toLowerCase();
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-zinc-500'}`}>
                            {new Date(m.sentAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-zinc-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      className="flex-1 bg-zinc-800 border border-zinc-600 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!draft.trim() || sending}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {sending ? '…' : 'Send'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}