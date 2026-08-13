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

export function useXmtpClient() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [status, setStatus] = useState<XmtpStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Prevent double-init (React Strict Mode + rapid re-renders)
  const initializingRef = useRef(false);
  const clientRef = useRef<any>(null); // any to avoid SDK type mismatches across versions

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
    if (initializingRef.current || clientRef.current) return;

    initializingRef.current = true;
    setStatus('initializing');
    setError(null);

    try {
      // Close any previous client that might still hold an OPFS handle
      if (clientRef.current) {
        try {
          // Some SDK versions expose close(), others do not – guard it
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

      // Cast options to any so different SDK versions accept the env property
      const xmtpClient = await Client.create(signer, {
        env: XMTP_ENV,
      } as any);

      clientRef.current = xmtpClient;
      setClient(xmtpClient);
      setStatus('ready');
    } catch (err: any) {
      console.error('XMTP init error:', err);
      const message = err?.message || 'Failed to initialize XMTP';
      setError(message);
      setStatus('error');
    } finally {
      initializingRef.current = false;
    }
  }, [address, walletClient]);

  /**
   * Static revocation – works even when Client.create() fails because of the 10/10 limit.
   * Extracts the InboxID from the error message (most reliable) and falls back to the
   * known official MAUI contact InboxID.
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

      // 1. Prefer InboxID from the error message itself
      let inboxId: string | null = null;
      if (previousError) {
        const match = previousError.match(/InboxID\s+([a-f0-9]{64})/i);
        if (match) inboxId = match[1];
      }

      // 2. Fallback for the official MAUI contact
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

      // Use (Client as any) so TypeScript does not complain about static methods
      // that vary between SDK versions
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

      // Give the network a moment, then automatically retry opening the inbox
      setTimeout(() => {
        initialize();
      }, 1500);
    } catch (err: any) {
      console.error('Revoke failed:', err);
      setError(err?.message || 'Failed to revoke installations');
      setStatus('error');
    }
  }, [address, walletClient, error, initialize]);

  // Clean up when wallet disconnects
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