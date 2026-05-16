'use client';

export default function Grok() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-5xl font-bold mb-8">🤖 MAUI.GROK AI</h1>
      <p className="text-xl text-zinc-400 mb-8">Ask Grok anything</p>
      {/* Grok chat interface will go here */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl h-96 mb-6 p-4 overflow-y-auto" id="chat">
          Welcome to MAUI.GROK AI
        </div>
        <div className="flex gap-3">
          <input type="text" placeholder="Ask about BlockDAG or MAUI..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4" />
          <button className="bg-blue-600 hover:bg-blue-500 px-8 rounded-2xl font-medium">Send</button>
        </div>
      </div>
    </div>
  );
}
