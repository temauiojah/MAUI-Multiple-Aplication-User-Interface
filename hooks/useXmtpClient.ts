// hooks/useXmtpClient.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client } from '@xmtp/browser-sdk';
import { createXmtpSigner } from '@/lib/xmtp';

export type XmtpStatus = 'idle' | 'initializing' | 'ready' | 'error' | 'revoking';

/**
 * Change this to 'production' for the live site.
 * Keep 'dev' only while actively developing / testing.
 */
const XMTP_ENV: 'dev' | 'production' = 'production';

function sessionKey(address: string) {
  return `maui-xmtp-ready:${address.toLowerCase()}:${XMTP_ENV}`;
}

export function useXmtpClient() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [status, setStatus] = useState<XmtpStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Prevent double-init (React Strict Mode + rapid re-renders)
  const initializingRef = useRef(false);
  const clientRef = useRef<any>(null);
  const addressRef = useRef<string | undefined>(address);

  // Keep address ref current for visibility handler
  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  const isInstallationLimitError = (msg: string | null | undefined) =>
    !!msg &&
    /already registered .*\/10 installations|maximum number of installations|10\/10 installations/i.test(
      msg
    );

  const initialize = useCallback(async () => {
    if (!address || !walletClient) {
      setError('Wallet not connected');
      return;
    }
    if (initializingRef.current) return;
    // If we already have a live client for this session, keep it
    if (clientRef.current && status === 'ready') return;

    initializingRef.current = true;
    setStatus('initializing');
    setError(null);

    try {
      // Close any previous client that might still hold an OPFS handle
      if (clientRef.current) {
        try {
          if (typeof clientRef.current.close === 'function') {
            await clientRef.current.close();
          }
        } catch {
          // ignore
        }
        clientRef.current = null;
        setClient(null);
      }

      const signer = createXmtpSigner(address, walletClient);

      const xmtpClient = await Client.create(signer, {
        env: XMTP_ENV,
      } as any);

      clientRef.current = xmtpClient;
      setClient(xmtpClient);
      setStatus('ready');

      // Remember that this wallet has successfully opened the inbox in this browser session
      try {
        sessionStorage.setItem(sessionKey(address), '1');
      } catch {
        // private mode / blocked storage – ignore
      }
    } catch (err: any) {
      console.error('XMTP init error:', err);
      const message = err?.message || 'Failed to initialize XMTP';
      setError(message);
      setStatus('error');
    } finally {
      initializingRef.current = false;
    }
  }, [address, walletClient, status]);

  /**
   * Static revocation – works even when Client.create() fails because of the 10/10 limit.
   */
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

      // Clear the session flag so the next init is clean
      try {
        sessionStorage.removeItem(sessionKey(address));
      } catch {
        // ignore
      }

      setTimeout(() => {
        initialize();
      }, 1500);
    } catch (err: any) {
      console.error('Revoke failed:', err);
      setError(err?.message || 'Failed to revoke installations');
      setStatus('error');
    }
  }, [address, walletClient, error, initialize]);

  // Auto-open inbox when wallet is connected and we already opened it this session
  useEffect(() => {
    if (!isConnected || !address || !walletClient) return;
    if (status === 'ready' || status === 'initializing' || status === 'revoking') return;

    let shouldAuto = false;
    try {
      shouldAuto = sessionStorage.getItem(sessionKey(address)) === '1';
    } catch {
      // ignore
    }

    if (shouldAuto) {
      // Small delay so walletClient is fully ready after tab focus
      const t = setTimeout(() => {
        initialize();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isConnected, address, walletClient, status, initialize]);

  // When the tab becomes visible again, re-open if needed (keeps inbox alive across tab switches)
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== 'visible') return;
      const addr = addressRef.current;
      if (!addr || !isConnected) return;

      // If we already have a client, stay ready
      if (clientRef.current && status === 'ready') return;

      // If we previously opened the inbox this session, auto re-init
      let shouldAuto = false;
      try {
        shouldAuto = sessionStorage.getItem(sessionKey(addr)) === '1';
      } catch {
        // ignore
      }
      if (shouldAuto && status !== 'initializing' && status !== 'revoking') {
        initialize();
      }
    }

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isConnected, status, initialize]);

  // Clean up only when the wallet truly disconnects
  useEffect(() => {
    if (!isConnected) {
      if (clientRef.current) {
        try {
          if (typeof clientRef.current.close === 'function') {
            clientRef.current.close();
          }
        } catch {
          // ignore
        }
        clientRef.current = null;
      }
      setClient(null);
      setStatus('idle');
      setError(null);
    }
  }, [isConnected]);

  return {
    client,
    status,
    error,
    initialize,
    revokeInstallations,
    isInstallationLimitError,
    isReady: status === 'ready' && !!client,
    env: XMTP_ENV,
  };
}
