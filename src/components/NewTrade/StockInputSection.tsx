// src/components/NewTrade/StockInputSection.tsx
import React, { useState, useEffect, useRef } from 'react';
import { searchStocks, lookupStockByCode, type StockSearchResult } from '../../utils/stockSearch';
import { Search, Loader2, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface StockInputSectionProps {
  name: string;
  symbol: string;
  onNameChange: (name: string) => void;
  onSymbolChange: (symbol: string) => void;
}

export const StockInputSection: React.FC<StockInputSectionProps> = ({
  name,
  symbol,
  onNameChange,
  onSymbolChange,
}) => {
  const [activeField, setActiveField] = useState<'name' | 'symbol' | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 执行联想搜索
  const triggerSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setResults([]);
      setShowDropdown(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const list = await searchStocks(trimmed);
        setResults(list);
        setShowDropdown(list.length > 0);
      } catch (err) {
        console.error('股票搜索失败', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);
  };

  // 处理标的名称变化
  const handleNameInput = (val: string) => {
    onNameChange(val);
    setActiveField('name');
    setQuery(val);
    triggerSearch(val);
  };

  // 处理标的代码变化
  const handleSymbolInput = (val: string) => {
    onSymbolChange(val);
    setActiveField('symbol');
    setQuery(val);
    triggerSearch(val);
  };

  // 选中某只股票时，双向联动回填
  const handleSelectStock = (stock: StockSearchResult) => {
    onNameChange(stock.name);
    onSymbolChange(stock.code);
    setSelectedMarket(stock.market);
    setShowDropdown(false);
    setActiveField(null);
  };

  // 当代码输入框失去焦点时，若名称为空且代码格式有效，尝试自动匹配名称
  const handleSymbolBlur = async () => {
    setTimeout(async () => {
      if (!name.trim() && symbol.trim()) {
        const match = await lookupStockByCode(symbol.trim());
        if (match) {
          onNameChange(match.name);
          onSymbolChange(match.code);
          setSelectedMarket(match.market);
        }
      }
    }, 200);
  };

  // 市场标签颜色
  const getMarketBadgeClass = (market: string) => {
    if (market.includes('科创板')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (market.includes('创业板')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (market.includes('沪')) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (market.includes('深')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    if (market.includes('港')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (market.includes('美')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    if (market.includes('北交所')) return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    return 'bg-zinc-700/50 text-zinc-300 border-zinc-600';
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      {/* 联动状态提示 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>代码与名称智能联动</span>
          <span className="text-[10px] text-zinc-500 font-normal">
            (输入代码、中文名称或拼音简写，均可自动联想匹配)
          </span>
        </div>
        {selectedMarket && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getMarketBadgeClass(
              selectedMarket
            )}`}
          >
            {selectedMarket}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 标的名称 */}
        <div className="relative">
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            标的名称 *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="例如：贵州茅台 / 拼音 gzmt"
              value={name}
              onChange={(e) => handleNameInput(e.target.value)}
              onFocus={() => {
                if (name) {
                  setActiveField('name');
                  triggerSearch(name);
                }
              }}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 pr-8"
            />
            {activeField === 'name' && isLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin absolute right-2.5 top-2.5" />
            ) : (
              <Search className="w-3.5 h-3.5 text-zinc-600 absolute right-2.5 top-2.5" />
            )}
          </div>
        </div>

        {/* 标的代码 */}
        <div className="relative">
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            标的代码 *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="例如：600519 / 300308 / NVDA"
              value={symbol}
              onChange={(e) => handleSymbolInput(e.target.value)}
              onFocus={() => {
                if (symbol) {
                  setActiveField('symbol');
                  triggerSearch(symbol);
                }
              }}
              onBlur={handleSymbolBlur}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 pr-8"
            />
            {activeField === 'symbol' && isLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin absolute right-2.5 top-2.5" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-zinc-600 absolute right-2.5 top-2.5" />
            )}
          </div>
        </div>
      </div>

      {/* 联想匹配下拉列表 */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-zinc-900/95 backdrop-blur-md border border-indigo-500/30 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-white/5">
          <div className="px-3 py-1.5 text-[10px] text-zinc-400 bg-white/[0.02] flex items-center justify-between">
            <span>找到 {results.length} 个匹配标的（点击自动回填代码与名称）</span>
            <span className="text-zinc-500 font-mono text-[9px]">输入 “{query}”</span>
          </div>
          {results.map((stock, idx) => (
            <div
              key={`${stock.code}-${stock.marketCode}-${idx}`}
              onClick={() => handleSelectStock(stock)}
              className="px-3 py-2 hover:bg-indigo-600/20 cursor-pointer flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-xs text-white group-hover:text-indigo-300">
                  {stock.code}
                </span>
                <span className="text-xs text-zinc-200 group-hover:text-white font-medium">
                  {stock.name}
                </span>
                {stock.pinyin && (
                  <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                    {stock.pinyin}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${getMarketBadgeClass(
                    stock.market
                  )}`}
                >
                  {stock.market}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
