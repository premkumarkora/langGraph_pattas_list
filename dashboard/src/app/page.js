'use client';

import { useState, useEffect } from 'react';
import { GlassButton } from '@/components/GlassButton';
import { SectorSection } from '@/components/SectorSection';

export default function Home() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, ANALYZING, COMPLETE
  const [lastUpdated, setLastUpdated] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      // no-store to ensure we get fresh data after analysis
      const res = await fetch('/api/stocks', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json.data);
      setLastUpdated(json.date);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartAnalysis = async () => {
    setStatus('ANALYZING');

    try {
      const response = await fetch('/api/analyze', { method: 'POST' });

      if (!response.body) {
        throw new Error('ReadableStream not supported.');
      }

      const reader = response.body.getReader();
      let done = false;

      while (!done) {
        const { done: doneReading } = await reader.read();
        done = doneReading;
        // We just consume the stream to wait for completion
      }

      setStatus('COMPLETE');
      await fetchStocks();

      // Reset to IDLE after 3 seconds
      setTimeout(() => setStatus('IDLE'), 3000);

    } catch (err) {
      console.error(err);
      setStatus('IDLE');
    }
  };

  // Button Content Logic
  const getButtonContent = () => {
    switch (status) {
      case 'ANALYZING':
        return (
          <span className="text-red-500 font-bold tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
            ANALYZING STOCK...
          </span>
        );
      case 'COMPLETE':
        return (
          <span className="text-neon-green font-bold tracking-widest drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]">
            ANALYSIS COMPLETE
          </span>
        );
      default:
        return "INITIATE SCAN";
    }
  };

  // Button Style Logic
  const getButtonStyles = () => {
    switch (status) {
      case 'ANALYZING':
        // Red Border + Background + Pulse Animation on the whole button
        return "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] bg-red-900/20 cursor-wait animate-pulse";
      case 'COMPLETE':
        // Solid Green Border + Background (No Animation)
        return "border-neon-green shadow-[0_0_15px_rgba(57,255,20,0.5)] bg-green-900/20";
      default:
        return "hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] border-neon-cyan/50 text-neon-cyan";
    }
  };

  return (
    <main className="min-h-screen p-8 md:p-12 relative overflow-hidden bg-[url('/grid.svg')] bg-fixed">
      {/* Cyberpunk Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-neon-purple rounded-full blur-[150px] opacity-20 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-neon-cyan rounded-full blur-[150px] opacity-20 animate-pulse animation-delay-2000" />
      </div>

      <div className="max-w-[1600px] mx-auto space-y-12 relative z-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40 tracking-tighter shadow-neon">
              PATTAS
              <span className="text-neon-pink">.AI</span>
            </h1>
            <p className="text-neon-cyan/80 mt-2 text-lg font-mono flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status === 'ANALYZING' ? 'bg-red-500 animate-ping' : 'bg-neon-green animate-blink'}`}></span>
              SYSTEM ONLINE // {status === 'ANALYZING' ? 'SCANNING SECURE FREQUENCIES...' : 'READY FOR ANALYSIS'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-4">
            <div className="font-mono text-xs text-white/40">
              LAST_UPDATE: <span className="text-neon-green">{lastUpdated || 'NULL'}</span>
            </div>
            <GlassButton
              onClick={handleStartAnalysis}
              disabled={status === 'ANALYZING'}
              className={`transition-all duration-300 ${getButtonStyles()}`}
            >
              {getButtonContent()}
            </GlassButton>
          </div>
        </header>

        {/* Content Grid */}
        <div className="min-h-[500px]">
          {!data ? (
            <div className="flex items-center justify-center h-full text-neon-cyan/50 font-mono animate-pulse">
              LOADING_DATAFEED...
            </div>
          ) : (
            Object.entries(data).map(([sector, stocks]) => (
              <SectorSection key={sector} sector={sector} stocks={stocks} />
            ))
          )}
        </div>

      </div>
    </main>
  );
}
