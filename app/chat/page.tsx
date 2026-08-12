// app/chat/page.tsx
'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { isAddress } from 'viem';
import { IdentifierKind } from '@xmtp/browser-sdk';
import { useXmtpClient } from '@/hooks/useXmtpClient';
import { useSearchParams } from 'next/navigation';


/** Official MAUI contact address — same constant used on /contact */
export const MAUI_CONTACT_ADDRESS =
  '0x185E70a3A13Ed9A47Fe49029EA7Ca9a5c3624940';

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
  return '';
}

function isRealTextMessage(content: string): boolean {
  if (!content || content.trim() === '') return false;
  // Filter out system / membership JSON messages
  if (content.startsWith('{') || content.startsWith('[')) return false;
  return true;
}

function shortAddr(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function isOfficialContact(peer?: string) {
  return (
    !!peer &&
    peer.toLowerCase() === MAUI_CONTACT_ADDRESS.toLowerCase()
  );
}

function ChatPageClient() {
  const { address, isConnected } = useAccount();
  const { client, status, error, initialize, isReady } = useXmtpClient();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newPeer, setNewPeer] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [sending, setSending] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );

  // Track whether we already auto-started from ?to=
  const autoStartedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<{ return?: () => void } | null>(null);

  // ── Notifications ──────────────────────────────────────────────
  async function requestNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      setNotifPermission('granted');
      return;
    }
    if (Notification.permission === 'denied') {
      setNotifPermission('denied');
      return;
    }
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  function showNotification(title: string, body: string) {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    )
      return;
    // Only notify when the tab is in the background
    if (document.visibilityState === 'visible') return;

    try {
      new Notification(title, {
        body: body.slice(0, 120),
        icon: '/favicon.ico',
        tag: 'maui-chat',
      });
    } catch {
      // ignore
    }
  }

  // ── Conversations ──────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!client) return;
    setLoadingConvos(true);
    try {
      await client.conversations.sync();
      const convos = await client.conversations.list();

      const mapped: Conversation[] = convos.map((c: any) => {
        let peer = 'Unknown';

        if (typeof c.peerAddress === 'string' && c.peerAddress.startsWith('0x')) {
          peer = c.peerAddress;
        } else if (c.peerAddress?.identifier) {
          peer = c.peerAddress.identifier;
        } else if (typeof c.peerInboxId === 'string') {
          peer = c.peerInboxId.slice(0, 10) + '…';
        }

        return { id: c.id, peerAddress: peer, _raw: c };
      });

      // Put official contact conversation at the top if present
      mapped.sort((a, b) => {
        const aOfficial = isOfficialContact(a.peerAddress) ? 0 : 1;
        const bOfficial = isOfficialContact(b.peerAddress) ? 0 : 1;
        return aOfficial - bOfficial;
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

  // ── Auto-start from ?to= ───────────────────────────────────────
  useEffect(() => {
    if (!isReady || !client || autoStartedRef.current) return;

    const to = searchParams.get('to')?.trim().toLowerCase();
    if (!to || !isAddress(to)) return;

    autoStartedRef.current = true;
    setNewPeer(to);

    (async () => {
      try {
        // Wait a tick so conversations may already be loaded
        await new Promise((r) => setTimeout(r, 300));

        // Prefer existing conversation if already in state
        setConversations((prev) => {
          const existing = prev.find(
            (c) => c.peerAddress?.toLowerCase() === to
          );
          if (existing) {
            setActiveConv(existing);
            setNewPeer('');
            return prev;
          }
          return prev;
        });

        // If still no active conv for this peer, create one
        // (small race is fine — createDm is idempotent enough for UX)
        const dm = await client.conversations.createDmWithIdentifier({
          identifier: to,
          identifierKind: IdentifierKind.Ethereum,
        });

        const mapped: Conversation = {
          id: dm.id,
          peerAddress: to,
          _raw: dm,
        };

        setConversations((prev) => {
          if (prev.some((c) => c.id === mapped.id)) return prev;
          return [mapped, ...prev];
        });
        setActiveConv(mapped);
        setNewPeer('');
      } catch (err: any) {
        console.error('Auto-start DM failed', err);
        // Leave the address in the input so user can retry
      }
    })();
  }, [isReady, client, searchParams]);

  // ── Message stream ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeConv || !client) return;
    let cancelled = false;

    async function startStream() {
      try {
        const existing = await activeConv!._raw.messages();
        if (!cancelled) {
          const textMessages = existing
            .map((m: any) => ({
              id: m.id,
              content: extractContent(m.content ?? m),
              senderAddress: m.senderAddress ?? m.senderInboxId ?? 'unknown',
              sentAt: m.sentAt ?? new Date(),
            }))
            .filter((m: Message) => isRealTextMessage(m.content));

          setMessages(textMessages);
        }

        const stream = await activeConv!._raw.stream();
        streamRef.current = stream;

        for await (const msg of stream) {
          if (cancelled) break;

          const content = extractContent(msg.content ?? msg);
          if (!isRealTextMessage(content)) continue;

          const sender =
            msg.senderAddress ?? msg.senderInboxId ?? 'unknown';
          const isFromMe =
            sender.toLowerCase() === address?.toLowerCase() ||
            sender.toLowerCase().includes(address?.toLowerCase().slice(2) || '');

          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              content,
              senderAddress: sender,
              sentAt: msg.sentAt ?? new Date(),
            },
          ]);

          // Browser notification for incoming messages
          if (!isFromMe) {
            showNotification(
              isOfficialContact(activeConv?.peerAddress)
                ? 'MAUI Official Reply'
                : `New message from ${shortAddr(activeConv?.peerAddress || sender)}`,
              content
            );
          }
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
  }, [activeConv, client, address]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Actions ────────────────────────────────────────────────────
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

  // Quick-start official contact
  function contactOfficial() {
    setNewPeer(MAUI_CONTACT_ADDRESS);
    // Trigger start after state update
    setTimeout(() => {
      // We call startChat after setting, but easier to just set and let user click,
      // or invoke the logic directly:
      (async () => {
        if (!client) return;
        try {
          const dm = await client.conversations.createDmWithIdentifier({
            identifier: MAUI_CONTACT_ADDRESS.toLowerCase(),
            identifierKind: IdentifierKind.Ethereum,
          });
          const mapped: Conversation = {
            id: dm.id,
            peerAddress: MAUI_CONTACT_ADDRESS.toLowerCase(),
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
          alert(err?.message || 'Could not open official contact chat.');
        }
      })();
    }, 0);
  }

  // ── UI states ──────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">MAUI.Chat</h1>
          <p className="page-subtitle mt-2">End-to-End Encrypted • Decentralized Messaging</p>
          <div className="mt-12 bg-zinc-900 border border-zinc-700 rounded-3xl p-10 mx-auto max-w-md space-y-6">
            <p className="text-zinc-400">
              Connect MetaMask to open your personal inbox. Every wallet gets its own encrypted
              messaging space.
            </p>
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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">MAUI.Chat</h1>
          <p className="page-subtitle mt-2">End-to-End Encrypted • Decentralized Messaging</p>
          <div className="mt-12 bg-zinc-900 border border-zinc-700 rounded-3xl p-10 mx-auto max-w-md space-y-6">
            <p className="text-zinc-300 text-sm">
              Signed in as{' '}
              <span className="font-mono text-blue-400">
                {address?.slice(0, 6)}…{address?.slice(-4)}
              </span>
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Every wallet that connects gets its own private encrypted inbox.
              Messages stay between you and the people you chat with — no central server.
            </p>
            {status === 'error' && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={initialize}
              disabled={status === 'initializing'}
              className="w-full py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {status === 'initializing' ? 'Opening your inbox…' : 'Open My Inbox'}
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

  // Full chat UI
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-6 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">MAUI.Chat</h1>
            <p className="page-subtitle mt-1">End-to-End Encrypted • Decentralized Messaging</p>
          </div>

          {/* Notification + official contact shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
              <button
                onClick={requestNotifications}
                className="px-3 py-1.5 text-xs rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 transition-colors"
              >
                Enable notifications
              </button>
            )}
            {notifPermission === 'granted' && (
              <span className="text-xs text-emerald-400 px-2">Notifications on</span>
            )}
            <button
              onClick={contactOfficial}
              className="px-3 py-1.5 text-xs rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 transition-colors"
            >
              Message Official Contact
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-11rem)]">
          {/* ── Sidebar: Personal Inbox ── */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-zinc-200">Your Inbox</p>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                  {address ? `${address.slice(0, 4)}…${address.slice(-4)}` : ''}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x… address to message"
                  value={newPeer}
                  onChange={(e) => setNewPeer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startChat()}
                  className="flex-1 bg-zinc-800 border border-zinc-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={startChat}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
                >
                  Start
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConvos && (
                <p className="p-4 text-sm text-zinc-500">Loading your inbox…</p>
              )}
              {!loadingConvos && conversations.length === 0 && (
                <p className="p-4 text-sm text-zinc-500">
                  Your inbox is empty. Start a conversation above or message the Official Contact.
                </p>
              )}
              {conversations.map((c) => {
                const official = isOfficialContact(c.peerAddress);
                const active = activeConv?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c)}
                    className={`w-full text-left px-4 py-3 border-b border-zinc-800 transition-colors ${
                      active
                        ? 'bg-zinc-800'
                        : 'hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {official && (
                        <span className="shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40">
                          Official
                        </span>
                      )}
                      <span
                        className={`font-mono text-sm truncate ${
                          official ? 'text-blue-300' : 'text-zinc-200'
                        }`}
                      >
                        {official
                          ? 'MAUI Contact'
                          : shortAddr(c.peerAddress || 'Unknown')}
                      </span>
                    </div>
                    {official && (
                      <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                        {shortAddr(MAUI_CONTACT_ADDRESS)}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Main chat panel ── */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-700 rounded-3xl flex flex-col overflow-hidden">
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="space-y-4 max-w-sm">
                  <p className="text-zinc-400">
                    Select a conversation from your inbox or start a new one.
                  </p>
                  <button
                    onClick={contactOfficial}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 font-medium transition-colors"
                  >
                    Message Official MAUI Contact
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header of active chat */}
                <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-100">
                      {isOfficialContact(activeConv.peerAddress)
                        ? 'MAUI Official Contact'
                        : shortAddr(activeConv.peerAddress || 'Unknown')}
                    </p>
                    {isOfficialContact(activeConv.peerAddress) && (
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">
                        {MAUI_CONTACT_ADDRESS}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => {
                    const isMe =
                      m.senderAddress.toLowerCase() === address?.toLowerCase() ||
                      m.senderAddress
                        .toLowerCase()
                        .includes(address?.toLowerCase().slice(2) || '');
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

                {/* Composer */}
                <div className="p-4 border-t border-zinc-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && !e.shiftKey && sendMessage()
                      }
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


export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4 flex items-center justify-center">
          <p className="text-zinc-400">Loading chat…</p>
        </div>
      }
    >
      <ChatPageClient />
    </Suspense>
  );
}

