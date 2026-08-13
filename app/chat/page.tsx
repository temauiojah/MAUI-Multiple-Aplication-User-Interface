// app/chat/page.tsx
'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { isAddress } from 'viem';
import { IdentifierKind } from '@xmtp/browser-sdk';
import { useXmtpClient } from '@/hooks/useXmtpClient';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

type AppTab = 'inbox' | 'browser' | 'profile';

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
  const {
    client,
    status,
    error,
    initialize,
    revokeInstallations,
    isInstallationLimitError,
    isReady,
  } = useXmtpClient();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<AppTab>('inbox');
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

  // Browser tab state
  const [browserUrl, setBrowserUrl] = useState('https://mauicoin.vercel.app/grokoracle');
  const [browserInput, setBrowserInput] = useState('https://mauicoin.vercel.app/grokoracle');
  const [browserKey, setBrowserKey] = useState(0);

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
      const mapped: Conversation[] = [];
      for (const c of convos as any[]) {
        let peer: string | undefined;
        try {
          const members = await c.members?.();
          if (members && address) {
            const other = members.find(
              (m: any) =>
                m.accountIdentifiers?.[0]?.identifier?.toLowerCase() !==
                address.toLowerCase()
            );
            peer =
              other?.accountIdentifiers?.[0]?.identifier ||
              other?.inboxId ||
              undefined;
          }
        } catch {
          // ignore
        }
        mapped.push({ id: c.id, peerAddress: peer, _raw: c });
      }
      setConversations(mapped);
    } catch (err) {
      console.error('loadConversations', err);
    } finally {
      setLoadingConvos(false);
    }
  }, [client, address]);

  useEffect(() => {
    if (isReady) loadConversations();
  }, [isReady, loadConversations]);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'visible' && isReady) {
        loadConversations();
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isReady, loadConversations]);

  // ── Auto-start from ?to= ───────────────────────────────────────
  useEffect(() => {
    if (!isReady || !client || autoStartedRef.current) return;

    const to = searchParams.get('to')?.trim().toLowerCase();
    if (!to || !isAddress(to)) return;

    autoStartedRef.current = true;
    setNewPeer(to);
    setTab('inbox');

    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 300));
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
      } catch (err) {
        console.error(err);
      }
    })();
  }, [isReady, client, searchParams]);

  // ── Load messages for active conversation ──────────────────────
  useEffect(() => {
    if (!activeConv || !client) return;

    let cancelled = false;

    (async () => {
      try {
        if (streamRef.current?.return) {
          try {
            streamRef.current.return();
          } catch {
            // ignore
          }
        }

        await activeConv._raw.sync?.();
        const msgs = await activeConv._raw.messages();
        if (cancelled) return;

        const mapped: Message[] = (msgs || [])
          .map((m: any) => ({
            id: m.id,
            content: extractContent(m),
            senderAddress:
              m.senderInboxId ||
              m.senderAddress ||
              m.sender?.address ||
              '',
            sentAt: m.sentAt ? new Date(m.sentAt) : new Date(),
          }))
          .filter((m: Message) => isRealTextMessage(m.content));

        setMessages(mapped);

        // Stream new messages
        const stream = await activeConv._raw.stream();
        streamRef.current = stream;
        for await (const m of stream) {
          if (cancelled) break;
          const content = extractContent(m);
          if (!isRealTextMessage(content)) continue;
          const msg: Message = {
            id: m.id,
            content,
            senderAddress:
              m.senderInboxId ||
              m.senderAddress ||
              m.sender?.address ||
              '',
            sentAt: m.sentAt ? new Date(m.sentAt) : new Date(),
          };
          setMessages((prev) => {
            if (prev.some((p) => p.id === msg.id)) return prev;
            return [...prev, msg];
          });
          const isMe =
            msg.senderAddress.toLowerCase() === address?.toLowerCase() ||
            msg.senderAddress
              .toLowerCase()
              .includes(address?.toLowerCase().slice(2) || '');
          if (!isMe) {
            showNotification(
              isOfficialContact(activeConv.peerAddress)
                ? 'MAUI Official Contact'
                : shortAddr(activeConv.peerAddress || 'New message'),
              content
            );
          }
        }
      } catch (err) {
        console.error('message load/stream', err);
      }
    })();

    return () => {
      cancelled = true;
      if (streamRef.current?.return) {
        try {
          streamRef.current.return();
        } catch {
          // ignore
        }
      }
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
      alert('Enter a valid 0x address');
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
      setTab('inbox');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Could not start conversation');
    }
  }

  async function sendMessage() {
    if (!activeConv || !draft.trim() || sending) return;
    setSending(true);
    try {
      await activeConv._raw.send(draft.trim());
      setDraft('');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  function contactOfficial() {
    setTab('inbox');
    setTimeout(() => {
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

  function goBrowser() {
    let url = browserInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    setBrowserUrl(url);
    setBrowserInput(url);
    setBrowserKey((k) => k + 1);
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
            {status === 'error' && (
              <p className="text-red-400 text-sm break-words">{error}</p>
            )}

            {status === 'error' && error && isInstallationLimitError(error) && (
              <div className="space-y-3">
                <p className="text-amber-400/90 text-xs leading-relaxed">
                  This wallet has hit XMTP’s 10-installation limit (common during testing).
                  Click below to revoke the old installations, then try opening the inbox again.
                </p>
                <button
                  onClick={revokeInstallations}
                  className="w-full py-3 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 font-medium transition-colors"
                >
                  Revoke Old Installations
                </button>
              </div>
            )}

            <button
              onClick={initialize}
              disabled={status === 'initializing' || status === 'revoking'}
              className="w-full py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {status === 'initializing'
                ? 'Opening your inbox…'
                : status === 'revoking'
                  ? 'Please wait…'
                  : 'Open My Inbox'}
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

  // ── Full multi-tab UI ──────────────────────────────────────────
  const isMobileChatOpen = tab === 'inbox' && !!activeConv;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-14 sm:pt-20 pb-24 sm:pb-6 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header – title hidden on mobile (global Header already shows MAUI) */}
        <div className="mb-2 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="hidden sm:block text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">MAUI</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Multiple Application User Interface
            </p>
          </div>

          {tab !== 'browser' && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
                <button
                  onClick={requestNotifications}
                  className="min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 transition-colors"
                >
                  Enable notifications
                </button>
              )}
              {notifPermission === 'granted' && (
                <span className="text-xs text-emerald-400 px-2 hidden sm:inline">Notifications on</span>
              )}
              <button
                onClick={contactOfficial}
                className="min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 transition-colors"
              >
                Official Contact
              </button>
            </div>
          )}
        </div>

        {/* Tab bar – larger touch targets; fixed bottom on mobile */}
        <div className="fixed bottom-0 inset-x-0 z-40 sm:static sm:z-auto sm:mb-4 bg-zinc-950/95 sm:bg-transparent backdrop-blur border-t border-zinc-800 sm:border-0 p-2 sm:p-0">
          <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-700 rounded-2xl max-w-5xl mx-auto">
            {(
              [
                { id: 'inbox' as const, label: 'Inbox' },
                { id: 'browser' as const, label: 'Browser' },
                { id: 'profile' as const, label: 'Profile' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  if (t.id !== 'inbox') setActiveConv(null);
                }}
                className={`flex-1 min-h-[48px] px-3 sm:px-5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ════════ INBOX TAB ════════ */}
        {tab === 'inbox' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 h-[calc(100dvh-9.5rem)] sm:h-[calc(100vh-12rem)]">
            {/* Sidebar – hide on mobile when a chat is open */}
            <div
              className={`bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden ${
                isMobileChatOpen ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="p-3 sm:p-4 border-b border-zinc-700">
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
                    className="flex-1 min-h-[44px] bg-zinc-800 border border-zinc-600 rounded-xl px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={startChat}
                    className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
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
                      className={`w-full text-left px-4 py-4 min-h-[56px] border-b border-zinc-800 transition-colors ${
                        active ? 'bg-zinc-800' : 'hover:bg-zinc-800/60 active:bg-zinc-800'
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

            {/* Main chat panel – full width on mobile when open */}
            <div
              className={`md:col-span-2 bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden ${
                isMobileChatOpen ? 'flex' : 'hidden md:flex'
              }`}
            >
              {!activeConv ? (
                <div className="flex-1 flex items-center justify-center p-8 text-center">
                  <div className="space-y-4 max-w-sm">
                    <p className="text-zinc-400 text-sm sm:text-base">
                      Select a conversation from your inbox or start a new one.
                    </p>
                    <button
                      onClick={contactOfficial}
                      className="min-h-[48px] px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 font-medium transition-colors"
                    >
                      Message Official MAUI Contact
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 sm:p-4 border-b border-zinc-700 flex items-center gap-3">
                    {/* Mobile back button */}
                    <button
                      onClick={() => setActiveConv(null)}
                      className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300"
                      aria-label="Back to inbox"
                    >
                      ←
                    </button>
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-100 truncate">
                        {isOfficialContact(activeConv.peerAddress)
                          ? 'MAUI Official Contact'
                          : shortAddr(activeConv.peerAddress || 'Unknown')}
                      </p>
                      {isOfficialContact(activeConv.peerAddress) && (
                        <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate">
                          {MAUI_CONTACT_ADDRESS}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
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
                            className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
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

                  <div className="p-3 sm:p-4 border-t border-zinc-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message…"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && !e.shiftKey && sendMessage()
                        }
                        className="flex-1 min-h-[48px] bg-zinc-800 border border-zinc-600 rounded-2xl px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!draft.trim() || sending}
                        className="min-h-[48px] min-w-[72px] px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                      >
                        {sending ? '…' : 'Send'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ════════ BROWSER TAB ════════ */}
        {tab === 'browser' && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col h-[calc(100dvh-8.5rem)] sm:h-[calc(100vh-12rem)]">
            {/* Address bar only */}
            <div className="p-2 sm:p-3 border-b border-zinc-700 flex gap-2 items-center">
              <input
                type="text"
                value={browserInput}
                onChange={(e) => setBrowserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && goBrowser()}
                placeholder="Search or enter address"
                className="flex-1 min-h-[44px] bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-2 text-base sm:text-sm font-mono focus:outline-none focus:border-blue-500"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
              />
              <button
                onClick={goBrowser}
                disabled={!browserInput.trim()}
                className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-sm font-medium transition-colors"
              >
                Go
              </button>
              {browserUrl && (
                <a
                  href={browserUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-sm font-medium transition-colors inline-flex items-center justify-center"
                  title="Open in system browser"
                >
                  ↗
                </a>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 bg-zinc-950 relative">
              {browserUrl ? (
                <iframe
                  key={browserKey}
                  src={browserUrl}
                  title="MAUI Browser"
                  className="absolute inset-0 w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                  <p className="text-zinc-500 text-sm max-w-xs">
                    Enter a URL above. Some sites block embedding — use ↗ to open in your system browser.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ PROFILE TAB ════════ */}
        {tab === 'profile' && (
          <div className="max-w-xl mx-auto space-y-4 pb-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xl font-bold shrink-0">
                  {address ? address.slice(2, 4).toUpperCase() : '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-zinc-100 truncate">
                    {address ? shortAddr(address) : 'Not connected'}
                  </p>
                  <p className="text-xs font-mono text-zinc-500 mt-1 break-all">
                    {address}
                  </p>
                  <p className="text-sm text-zinc-400 mt-3">
                    No <span className="text-blue-400">.maui</span> name linked yet.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-semibold text-zinc-100">
                    {conversations.length}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Conversations</p>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-semibold text-emerald-400">On</p>
                  <p className="text-xs text-zinc-500 mt-1">XMTP production</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-3">
              <h2 className="font-semibold text-zinc-100">Quick actions</h2>
              <button
                onClick={() => {
                  setTab('inbox');
                  contactOfficial();
                }}
                className="w-full text-left min-h-[56px] px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
              >
                <p className="text-sm font-medium text-zinc-100">Message Official Contact</p>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                  {shortAddr(MAUI_CONTACT_ADDRESS)}
                </p>
              </button>
              <Link
                href="/dns"
                className="block w-full text-left min-h-[56px] px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
              >
                <p className="text-sm font-medium text-zinc-100">Register a .maui name</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Claim your on-chain identity
                </p>
              </Link>
              <Link
                href="/metamask"
                className="block w-full text-left min-h-[56px] px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
              >
                <p className="text-sm font-medium text-zinc-100">Wallet dashboard</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Send BDAG & MAUI
                </p>
              </Link>
            </div>

            <p className="text-center text-xs text-zinc-600 px-4 leading-relaxed">
              On mobile, Chrome or MetaMask&apos;s browser works best for XMTP.
              Brave can hang while opening the inbox.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12 px-4 flex items-center justify-center">
          <p className="text-zinc-400">Loading…</p>
        </div>
      }
    >
      <ChatPageClient />
    </Suspense>
  );
}
