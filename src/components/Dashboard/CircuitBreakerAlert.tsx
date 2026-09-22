// src/components/Dashboard/CircuitBreakerAlert.tsx
import React from 'react';
import { AlertTriangle, ShieldX } from 'lucide-react';

interface CircuitBreakerAlertProps {
  reasons: string[];
  onOpenSettings: () => void;
  onOpenDailyReview: () => void;
}

export const CircuitBreakerAlert: React.FC<CircuitBreakerAlertProps> = ({
  reasons,
  onOpenDailyReview,
}) => {
  if (reasons.length === 0) return null;

  return (
    <div className="rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-rose-900/20 to-[#0d121e] p-5 shadow-xl shadow-rose-950/30">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0 animate-pulse">
          <ShieldX className="w-6 h-6" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-rose-300 tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping"></span>
              🔴 账户已触发熔断风控模式
            </span>
          </div>

          <p className="text-xs text-rose-200/80 leading-relaxed">
            系统检测到当前交易行为已触发预设的账户纪律防线，必须立即警惕！
          </p>

          <ul className="text-xs text-rose-300/90 space-y-1 list-disc list-inside bg-rose-950/30 p-2.5 rounded-lg border border-rose-500/20">
            {reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-zinc-300">守门员建议动作：</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/10">
                1. 暂停新增一切非计划交易
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/10">
                2. 主动核查与降低脆弱仓位
              </span>
              <button
                onClick={onOpenDailyReview}
                className="px-2.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                去完成复盘反思
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
