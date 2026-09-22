// src/components/Layout/Header.tsx
import React, { useState, useEffect } from 'react';
import { DISCIPLINE_QUOTES } from '../../utils/disciplineRules';
import { Plus, RefreshCw, Database } from 'lucide-react';

interface HeaderProps {
  onNewTradeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewTradeClick }) => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % DISCIPLINE_QUOTES.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const currentQuote = DISCIPLINE_QUOTES[quoteIndex];

  return (
    <header className="h-16 px-6 border-b border-white/5 bg-[#090d16]/80 backdrop-blur-md flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
      {/* Slogan & Quote Ticker */}
      <div className="flex items-center gap-3 overflow-hidden max-w-2xl">
        <div className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-medium flex-shrink-0">
          守门员问讯
        </div>
        <div className="flex items-baseline gap-2 truncate">
          <span className="text-xs font-semibold text-zinc-100 tracking-wide transition-all duration-300">
            “{currentQuote.quote}”
          </span>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            —— {currentQuote.sub}
          </span>
        </div>
        <button
          onClick={() => setQuoteIndex((prev) => (prev + 1) % DISCIPLINE_QUOTES.length)}
          title="切换名言"
          className="text-zinc-600 hover:text-zinc-400 transition-colors p-1"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-500">
          <Database className="w-3.5 h-3.5 text-zinc-600" />
          <span>本地存储 · 安全离线</span>
        </div>

        <button
          onClick={onNewTradeClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>我要买入</span>
        </button>
      </div>
    </header>
  );
};
