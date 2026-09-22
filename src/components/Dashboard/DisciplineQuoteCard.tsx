// src/components/Dashboard/DisciplineQuoteCard.tsx
import React from 'react';
import { Compass } from 'lucide-react';

export const DisciplineQuoteCard: React.FC = () => {
  return (
    <div className="tg-card rounded-xl p-6 relative overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>交易核心准则 · 守门员铁律</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            你现在做的事情，和当初买它的理由匹配吗？
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            TradeGuard
            不负责选股、不预测涨跌。它的唯一使命是确保您在买入、持仓、加仓、卖出时，始终保持“交易理由、时间尺度和实际操作”严格一致。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] flex-shrink-0">
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-zinc-300">
            <div className="text-indigo-400 font-semibold mb-0.5">时间尺度匹配</div>
            不要拿中线逻辑买入，却要求短线价格证明自己。
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-zinc-300">
            <div className="text-emerald-400 font-semibold mb-0.5">仓位是风险结果</div>
            仓位是可承受风险的数学计算，而非虚妄的信心表达。
          </div>
        </div>
      </div>
    </div>
  );
};
