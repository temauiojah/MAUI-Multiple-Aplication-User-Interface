'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client } from '@xmtp/browser-sdk';
import { createXmtpSigner } from '@/lib/xmtp';

type XmtpStatus = 'idle' | 'initializing' | 'ready' | 'error';

export function useXmtpClient() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [status, setStatus] = useState<XmtpStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Prevent double-init in React Strict Mode
  const initializingRef = useRef(false);

  const initialize = useCallback(async () => {
    if (!address || !walletClient) {
      setError('Wallet not connected');
      return;
    }
    if (initializingRef.current || client) return;

    initializingRef.current = true;
    setStatus('initializing');
    setError(null);

    try {
      const signer = createXmtpSigner(address, walletClient);
      const xmtpClient = await Client.create(signer);

      setClient(xmtpClient);
      setStatus('ready');
    } catch (err: any) {
      console.error('XMTP init error:', err);
      setError(err?.message || 'Failed to initialize XMTP');
      setStatus('error');
    } finally {
      initializingRef.current = false;
    }
  }, [address, walletClient, client]);

  // Clean up when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      if (client) {
        try {
          client.close();
        } catch {
          // ignore
        }
      }
      setClient(null);
      setStatus('idle');
      setError(null);
    }
  }, [isConnected, client]);

  return {
    client,
    status,
    error,
    initialize,
    isReady: status === 'ready' && !!client,
  };
}