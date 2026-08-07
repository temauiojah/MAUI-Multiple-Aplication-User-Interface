// app/chat/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { isAddress } from 'viem';
import { useXmtpClient } from '@/hooks/useXmtpClient';

// Minimal types so we don't fight the full SDK surface yet
type Conversation = {
  id: string;
  peerAddress?: string;
  // keep a reference to the real conversation object for sending/streaming
  _raw: any;
};

type Message = {
  id: string;
  content: string;
  senderAddress: string;
  sentAt: Date;
};

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

  // Load existing conversations once client is ready
  const loadConversations = useCallback(async () => {
    if (!client) return;
    setLoadingConvos(true);
    try {
      // Sync first so we get the latest from the network
      await client.conversations.sync();

      const convos = await client.conversations.list();
      const mapped: Conversation[] = convos.map((c: any) => ({
        id: c.id,
        peerAddress: c.peerAddress ?? c.peerInboxId ?? 'Unknown',
        _raw: c,
      }));
      setConversations(mapped);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingConvos(false);
    }
  }, [client]);

  useEffect(() => {
    if (isReady) {
      loadConversations();
    }
  }, [isReady, loadConversations]);

  // Stream messages for the active conversation
  useEffect(() => {
    if (!activeConv || !client) return;

    let cancelled = false;

    async function startStream() {
      try {
        // Load existing messages
        const existing = await activeConv!._raw.messages();
        if (!cancelled) {
          setMessages(
            existing.map((m: any) => ({
              id: m.id,
              content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
              senderAddress: m.senderAddress ?? m.senderInboxId ?? 'unknown',
              sentAt: m.sentAt ?? new Date(),
            }))
          );
        }

        // Stream new ones
        const stream = await activeConv!._raw.stream();
        streamRef.current = stream;

        for await (const msg of stream) {
          if (cancelled) break;
          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              content: typeof msg.content === 'string' ? msg.content : String(msg.content ?? ''),
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
      } catch {
        // ignore
      }
    };
  }, [activeConv, client]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start a new DM by address
  async function startChat() {
    if (!client || !newPeer.trim()) return;
    const peer = newPeer.trim().toLowerCase();
    if (!isAddress(peer)) {
      alert('Please enter a valid Ethereum address (0x…)');
      return;
    }

    try {
      // In XMTP v3 the preferred way is via inboxId, but createDm still works with address in many cases.
      // Fallback: find existing or create new.
      const dm = await client.conversations.createDm(peer);
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
      alert(err?.message || 'Could not start conversation. Peer may not have XMTP enabled yet.');
    }
  }

  // Send a message
  async function sendMessage() {
    if (!activeConv || !draft.trim() || sending) return;
    setSending(true);
    try {
      await activeConv._raw.send(draft.trim());
      setDraft('');
    } catch (err) {
      console.error('Send failed', err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  // ───────────────────────── UI ─────────────────────────

  // Not connected
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

  // Connected but XMTP not yet initialized
  if (!isReady) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1>MAUI.Chat</h1>
          <p className="page-subtitle">End-to-End Encrypted • Decentralized Messaging</p>

          <div className="mt-12 bg-zinc-900 border border-zinc-700 rounded-3xl p-10 mx-auto max-w-md space-y-6">
            <p className="text-zinc-300 text-sm">
              Signed in as <span className="font-mono text-blue-400">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
            </p>

            {status === 'error' && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              onClick={initialize}
              disabled={status === 'initializing'}
              className="w-full py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {status === 'initializing' ? 'Enabling XMTP…' : 'Enable Encrypted Chat'}
            </button>

            <p className="text-zinc-500 text-xs leading-relaxed">
              You will be asked to sign a message. This does <strong>not</strong> cost gas and only proves you own the wallet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Full chat UI
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-6 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">MAUI.Chat</h1>
          <p className="page-subtitle mt-1">End-to-End Encrypted • Decentralized</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-11rem)]">
          {/* ── Sidebar: Conversations ── */}
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
              {loadingConvos && (
                <p className="text-zinc-500 text-sm p-3">Loading conversations…</p>
              )}
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
                    {c.peerAddress
                      ? `${c.peerAddress.slice(0, 6)}…${c.peerAddress.slice(-4)}`
                      : 'Unknown'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Main: Messages ── */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-700 rounded-3xl flex flex-col overflow-hidden">
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                Select or start a conversation
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-5 py-4 border-b border-zinc-700 flex items-center justify-between">
                  <span className="font-mono text-sm text-blue-400">
                    {activeConv.peerAddress
                      ? `${activeConv.peerAddress.slice(0, 8)}…${activeConv.peerAddress.slice(-6)}`
                      : 'Conversation'}
                  </span>
                  <button
                    onClick={() => setActiveConv(null)}
                    className="text-zinc-500 hover:text-white text-sm"
                  >
                    Close
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => {
                    const isMe =
                      m.senderAddress.toLowerCase() === address?.toLowerCase();
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isMe ? 'text-blue-200' : 'text-zinc-500'
                            }`}
                          >
                            {new Date(m.sentAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
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

