// src/components/Positions/PositionsView.tsx
import React, { useState } from 'react';
import type { TradePlan } from '../../types';
import { PositionCard } from './PositionCard';
import { Briefcase, Search, Plus } from 'lucide-react';

interface PositionsViewProps {
  plans: TradePlan[];
  onRefresh: () => void;
  onNewTrade: () => void;
  onViewTimeline: (planId: number) => void;
}

export const PositionsView: React.FC<PositionsViewProps> = ({
  plans,
  onRefresh,
  onNewTrade,
  onViewTimeline,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  const activePlans = plans.filter((p) => p.status === 'ACTIVE');

  const filteredActive = activePlans.filter((p) => {
    if (filterType !== 'ALL' && p.tradeType !== filterType) return false;
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      return (
        p.name.toLowerCase().includes(kw) ||
        p.symbol.toLowerCase().includes(kw) ||
        p.tags.some((t) => t.toLowerCase().includes(kw))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top title and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            <span>持仓纪律监控中心</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            实时对齐买入理由与当前时间尺度，严防“短线变长线”与“中线逻辑被短线震荡洗掉”。
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="搜索标的名称/代码/标签..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterType === 'ALL'
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              全部 ({activePlans.length})
            </button>
            <button
              onClick={() => setFilterType('A')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterType === 'A'
                  ? 'bg-indigo-500/20 text-indigo-300 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              A 产业
            </button>
            <button
              onClick={() => setFilterType('B')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterType === 'B'
                  ? 'bg-purple-500/20 text-purple-300 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              B 催化
            </button>
            <button
              onClick={() => setFilterType('C')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterType === 'C'
                  ? 'bg-amber-500/20 text-amber-300 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              C 情绪
            </button>
          </div>

          <button
            onClick={onNewTrade}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建交易</span>
          </button>
        </div>
      </div>

      {/* Active positions list */}
      {filteredActive.length > 0 ? (
        <div className="space-y-4">
          {filteredActive.map((plan) => (
            <PositionCard
              key={plan.id}
              plan={plan}
              onRefresh={onRefresh}
              onViewTimeline={onViewTimeline}
            />
          ))}
        </div>
      ) : (
        <div className="tg-card rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-white">当前暂无活跃持仓</div>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            空仓是最好的防守。在符合 ABCT 纪律和产业证据前，耐心等待属于您的最高赔率击球点。
          </p>
          <button
            onClick={onNewTrade}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/20 transition-all active:scale-95 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>建立规范交易计划</span>
          </button>
        </div>
      )}
    </div>
  );
};
