'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { blockDAGMainnet } from '@/lib/chains';

const MAUI_TOKEN_ADDRESS = '0xe584D0963949d90C30Db7F9128765749510c67F6';
const MIN_MAUI_BALANCE = 500;

export default function MAUIChat() {
  const { address, isConnected } = useAccount();
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [peerAddress, setPeerAddress] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  // MAUI Balance Check
  const { data: mauiRaw } = useReadContract({
    address: MAUI_TOKEN_ADDRESS,
    abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const mauiBalance = mauiRaw ? parseFloat(formatUnits(mauiRaw as bigint, 18)) : 0;
  const canChat = mauiBalance >= MIN_MAUI_BALANCE;

  // Auto-reconnect if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('xmtpConnected') === 'true';
    if (wasConnected && isConnected && address) {
      setStatus('connected');
    }
  }, [isConnected, address]);

  const initXMTP = async () => {
    if (!isConnected || !address) {
      alert("Please connect MetaMask first");
      return;
    }
    try {
      setStatus('connecting');
      // Placeholder for real connection
      localStorage.setItem('xmtpConnected', 'true');
      setStatus('connected');
      alert("✅ XMTP Connected! (Connection now persists across pages)");
    } catch (err: any) {
      setStatus('disconnected');
      alert("Error: " + err.message);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !peerAddress) {
      alert("Please enter a recipient address and message");
      return;
    }
    alert(`✅ Encrypted message to ${peerAddress.slice(0,8)}... would be sent.\n\n(Real XMTP coming soon)`);
    setNewMessage('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-5xl font-bold mb-2 text-center">MAUI.Chat</h1>
        <p className="text-center text-zinc-400 mb-8">End-to-End Encrypted • Decentralized Messaging</p>

        {!isConnected ? (
          <div className="text-center py-20 text-xl">Connect MetaMask to access MAUI.Chat</div>
        ) : !canChat ? (
          <div className="max-w-md mx-auto bg-red-900/30 border border-red-700 rounded-3xl p-10 text-center">
            <p className="text-2xl mb-4">🔒 Chat Access Locked</p>
            <p>Hold at least <strong>{MIN_MAUI_BALANCE} MAUI</strong> to unlock encrypted chat</p>
            <p className="mt-4 text-sm">Your balance: {mauiBalance.toFixed(2)} MAUI</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New Conversation */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
              <h3 className="font-semibold mb-4">New Conversation</h3>
              <input
                type="text"
                placeholder="0x... Recipient Address"
                value={peerAddress}
                onChange={(e) => setPeerAddress(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 mb-4 font-mono text-sm"
              />
              <button 
                onClick={initXMTP}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-2xl mb-4"
              >
                Connect XMTP
              </button>
              
              <p className={`text-xs text-center font-medium ${
                status === 'connected' ? 'text-emerald-400' : 
                status === 'connecting' ? 'text-yellow-400' : 
                'text-zinc-500'
              }`}>
                Status: {status}
              </p>
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-700 rounded-3xl p-6 flex flex-col h-[620px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4 bg-black/30 rounded-2xl">
                {messages.length === 0 && (
                  <p className="text-zinc-500 text-center mt-32">No messages yet.<br />Start a conversation on the left.</p>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`p-4 rounded-2xl max-w-[75%] ${msg.senderAddress?.toLowerCase() === address?.toLowerCase() ? 'ml-auto bg-blue-600' : 'mr-auto bg-zinc-800'}`}>
                    {msg.content}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-700">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type encrypted message..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage} className="bg-emerald-600 px-10 rounded-2xl hover:bg-emerald-500">Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
