// hooks/useXmtpClient.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client } from '@xmtp/browser-sdk';
import { createXmtpSigner } from '@/lib/xmtp';

export type XmtpStatus = 'idle' | 'initializing' | 'ready' | 'error' | 'revoking';

const XMTP_ENV: 'dev' | 'production' = 'production';

// ── Module-level singleton (survives Next.js route changes) ──────────────
// useRef is destroyed when /chat unmounts. This lives for the whole browser session.
type Singleton = {
  client: any;
  address: string;
  env: string;
};

let singleton: Singleton | null = null;

function sessionKey(address: string) {
  return `maui-xmtp-ready:${address.toLowerCase()}:${XMTP_ENV}`;
}

export function useXmtpClient() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [status, setStatus] = useState<XmtpStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const initializingRef = useRef(false);

  const isInstallationLimitError = (msg: string | null | undefined) =>
    !!msg &&
    /already registered .*\/10 installations|maximum number of installations|10\/10 installations/i.test(
      msg
    );

  // On every mount: if singleton already has a client for this address, restore it
  useEffect(() => {
    if (
      singleton &&
      address &&
      singleton.address === address.toLowerCase() &&
      singleton.env === XMTP_ENV
    ) {
      setClient(singleton.client);
      setStatus('ready');
      setError(null);
    }
  }, [address]);

  const initialize = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!address || !walletClient) {
        setError('Wallet not connected');
        return;
      }

      // Already have a live singleton for this wallet → just restore React state
      if (
        !opts?.force &&
        singleton &&
        singleton.address === address.toLowerCase() &&
        singleton.env === XMTP_ENV
      ) {
        setClient(singleton.client);
        setStatus('ready');
        setError(null);
        return;
      }

      if (initializingRef.current) return;
      initializingRef.current = true;
      setStatus('initializing');
      setError(null);

      try {
        // Only close previous when forcing a brand-new client
        if (opts?.force && singleton?.client) {
          try {
            if (typeof singleton.client.close === 'function') {
              await singleton.client.close();
            }
          } catch {
            // ignore
          }
          singleton = null;
          setClient(null);
        }

        const signer = createXmtpSigner(address, walletClient);

        const xmtpClient = await Client.create(signer, {
          env: XMTP_ENV,
        } as any);

        singleton = {
          client: xmtpClient,
          address: address.toLowerCase(),
          env: XMTP_ENV,
        };

        setClient(xmtpClient);
        setStatus('ready');

        try {
          sessionStorage.setItem(sessionKey(address), '1');
        } catch {
          // ignore
        }
      } catch (err: any) {
        console.error('XMTP init error:', err);
        setError(err?.message || 'Failed to initialize XMTP');
        setStatus('error');
      } finally {
        initializingRef.current = false;
      }
    },
    [address, walletClient]
  );

  const revokeInstallations = useCallback(async () => {
    if (!address || !walletClient) {
      setError('Wallet not connected');
      return;
    }

    setStatus('revoking');
    const previousError = error;
    setError(null);

    try {
      const signer = createXmtpSigner(address, walletClient);

      let inboxId: string | null = null;
      if (previousError) {
        const match = previousError.match(/InboxID\s+([a-f0-9]{64})/i);
        if (match) inboxId = match[1];
      }

      if (
        !inboxId &&
        address.toLowerCase() === '0x185e70a3a13ed9a47fe49029ea7ca9a5c3624940'
      ) {
        inboxId = '8a19eb374d6b8e77a00c16134cfb8f24cde9e6214351a8f78d67d658ab11e22c';
      }

      if (!inboxId) {
        throw new Error(
          'Could not determine InboxID. Please copy the full error text and try again.'
        );
      }

      console.log('[XMTP] Revoking installations for inbox:', inboxId);

      const states = await (Client as any).fetchInboxStates([inboxId], XMTP_ENV);
      const installations = states?.[0]?.installations ?? [];

      if (installations.length === 0) {
        setError('No installations found to revoke. Try opening the inbox again.');
        setStatus('error');
        return;
      }

      const toRevoke = installations.map((i: any) => i.bytes);
      await (Client as any).revokeInstallations(signer, inboxId, toRevoke, XMTP_ENV);

      console.log(`[XMTP] Successfully revoked ${toRevoke.length} installations`);

      try {
        sessionStorage.removeItem(sessionKey(address));
      } catch {
        // ignore
      }

      // Clear singleton so next init is forced
      if (singleton?.client) {
        try {
          if (typeof singleton.client.close === 'function') {
            await singleton.client.close();
          }
        } catch {
          // ignore
        }
      }
      singleton = null;
      setClient(null);

      setTimeout(() => {
        initialize({ force: true });
      }, 1500);
    } catch (err: any) {
      console.error('Revoke failed:', err);
      setError(err?.message || 'Failed to revoke installations');
      setStatus('error');
    }
  }, [address, walletClient, error, initialize]);

  // Auto-restore on mount / when wallet becomes available
  useEffect(() => {
    if (!isConnected || !address || !walletClient) return;

    // Singleton already good → restore immediately (no Client.create)
    if (
      singleton &&
      singleton.address === address.toLowerCase() &&
      singleton.env === XMTP_ENV
    ) {
      setClient(singleton.client);
      setStatus('ready');
      setError(null);
      return;
    }

    if (status === 'initializing' || status === 'revoking' || status === 'ready') return;

    let shouldAuto = false;
    try {
      shouldAuto = sessionStorage.getItem(sessionKey(address)) === '1';
    } catch {
      // ignore
    }

    if (shouldAuto) {
      const t = setTimeout(() => initialize(), 200);
      return () => clearTimeout(t);
    }
  }, [isConnected, address, walletClient, status, initialize]);

  // Tab focus: only restore from singleton – never create a second client
  useEffect(() => {
    function onFocus() {
      if (!isConnected || !address) return;

      if (
        singleton &&
        singleton.address === address.toLowerCase() &&
        singleton.env === XMTP_ENV
      ) {
        setClient(singleton.client);
        setStatus('ready');
        setError(null);
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });
    window.addEventListener('pageshow', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('pageshow', onFocus);
    };
  }, [isConnected, address]);

  // Real wallet disconnect only
  useEffect(() => {
    if (!isConnected) {
      // Do NOT close the singleton here on every brief wagmi flicker.
      // Only clear React state. Singleton is cleared when address actually changes
      // or user explicitly disconnects for a long time.
      setClient(null);
      setStatus('idle');
      setError(null);
    }
  }, [isConnected]);

  // If the user switches to a different wallet, drop the old singleton
  useEffect(() => {
    if (
      address &&
      singleton &&
      singleton.address !== address.toLowerCase()
    ) {
      try {
        if (typeof singleton.client.close === 'function') {
          singleton.client.close();
        }
      } catch {
        // ignore
      }
      singleton = null;
      setClient(null);
      setStatus('idle');
    }
  }, [address]);

  return {
    client,
    status,
    error,
    initialize: () => initialize(),
    revokeInstallations,
    isInstallationLimitError,
    isReady: status === 'ready' && !!client,
    env: XMTP_ENV,
  };
}
