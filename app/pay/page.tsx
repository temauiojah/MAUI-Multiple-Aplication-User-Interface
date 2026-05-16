'use client';

export default function Pay() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-5xl font-bold mb-8">🌐 MAUI PAY</h1>
      <p className="text-xl text-zinc-400 mb-12">Pay for services with MAUI token</p>
      {/* Your DNS PAY content goes here */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
        <input type="text" placeholder="yourname.maui" className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4 mb-6 text-lg" />
        <div className="grid grid-cols-3 gap-4">
          <button className="bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl font-medium">1 Year - 10 MAUI</button>
          <button className="bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl font-medium">3 Years - 25 MAUI</button>
          <button className="bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl font-medium">Lifetime - 50 MAUI</button>
        </div>
      </div>
    </div>
  );
}
