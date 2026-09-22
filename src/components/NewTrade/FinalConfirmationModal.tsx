// src/components/NewTrade/FinalConfirmationModal.tsx
import React, { useState } from 'react';
import type { TradePlan } from '../../types';
import { TRADE_TYPES } from '../../utils/disciplineRules';
import { X, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinalConfirmationModalProps {
  planData: Partial<TradePlan>;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}

export const FinalConfirmationModal: React.FC<FinalConfirmationModalProps> = ({
  planData,
  onConfirm,
  onCancel,
  submitting,
}) => {
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const [c4, setC4] = useState(false);

  const allChecked = c1 && c2 && c3 && c4;
  const typeInfo = planData.tradeType ? TRADE_TYPES[planData.tradeType] : null;

  const handleExecute = () => {
    if (!allChecked) return;
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="tg-card w-full max-w-lg rounded-2xl p-6 border border-indigo-500/30 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>买入前最后一道纪律闸门</span>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">
            你即将建立交易计划并执行建仓
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            请最后一次审视参数与核心承诺。一旦提交，系统将开始以“买入时的你”监督后续每一个操作。
          </p>
        </div>

        {/* 摘要参数卡 */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">交易模式：</span>
            <span className="font-semibold text-indigo-300">
              【{typeInfo?.name || planData.tradeType}】
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">标的股票：</span>
            <span className="font-bold text-white font-mono">
              {planData.name} ({planData.symbol})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">计划仓位：</span>
            <span className="font-bold text-white font-mono">
              {planData.plannedPosition}% 账户资金
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">逻辑验证周期：</span>
            <span className="font-bold text-zinc-200 font-mono">
              {planData.expectedDays} 天 (至 {planData.expectedEndDate})
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-2">
            <span className="text-zinc-400">最大可承受账户冲击：</span>
            <span className="font-bold text-amber-400 font-mono">
              {planData.maxAccountRisk}%
            </span>
          </div>
        </div>

        {/* 4 个强制灵魂复选框 (PRD Section 10) */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-zinc-300">
            最后确认（须全部勾选方可提交）：
          </div>

          <div
            onClick={() => setC1(!c1)}
            className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] cursor-pointer text-xs transition-colors"
          >
            {c1 ? (
              <CheckSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
            )}
            <span className={c1 ? 'text-zinc-100 font-medium' : 'text-zinc-400'}>
              我知道自己到底在为什么而买（清晰阿尔法假说）。
            </span>
          </div>

          <div
            onClick={() => setC2(!c2)}
            className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] cursor-pointer text-xs transition-colors"
          >
            {c2 ? (
              <CheckSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
            )}
            <span className={c2 ? 'text-zinc-100 font-medium' : 'text-zinc-400'}>
              我知道什么客观事实发生时证明自己错了（绝不因亏损更改理由）。
            </span>
          </div>

          <div
            onClick={() => setC3(!c3)}
            className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] cursor-pointer text-xs transition-colors"
          >
            {c3 ? (
              <CheckSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
            )}
            <span className={c3 ? 'text-zinc-100 font-medium' : 'text-zinc-400'}>
              我知道什么新增事实出现才能加仓（绝不盲目摊平成本）。
            </span>
          </div>

          <div
            onClick={() => setC4(!c4)}
            className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] cursor-pointer text-xs transition-colors"
          >
            {c4 ? (
              <CheckSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
            )}
            <span className={c4 ? 'text-zinc-100 font-medium' : 'text-zinc-400'}>
              我平静接受这个逻辑需要完整的验证时间（不拿短线价格波动否定中期逻辑）。
            </span>
          </div>
        </div>

        {/* 确认执行 */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            返回修改
          </button>
          <button
            type="button"
            disabled={!allChecked || submitting}
            onClick={handleExecute}
            className={`px-6 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95 ${
              allChecked
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {submitting ? '提交中...' : '知行合一 · 确认买入'}
          </button>
        </div>
      </div>
    </div>
  );
};
