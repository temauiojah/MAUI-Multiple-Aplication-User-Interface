'use client';

export default function Home() {
  const connectMetaMask = async () => {
    if (!(window as any).ethereum) {
      alert("MetaMask is not installed or not detected!");
      return;
    }

    try {
      const accounts = await (window as any).ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      alert("✅ Connected successfully!\n\nAddress: " + accounts[0]);
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-bold mb-4">MAUI<span className="text-blue-500">.</span></h1>
        <p className="text-xl mb-12">Multiple Application User Interface</p>

        <button
          onClick={connectMetaMask}
          className="bg-blue-600 hover:bg-blue-700 text-xl px-12 py-5 rounded-2xl font-medium transition-all active:scale-95"
        >
          Connect MetaMask to MAUI
        </button>

        <p className="mt-12 text-sm text-zinc-500">
          Simple test version • Live on Vercel
        </p>
      </div>
    </div>
  );
}
