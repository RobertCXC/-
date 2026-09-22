// src/components/Positions/PositionCard.tsx
import React, { useState } from 'react';
import type { TradePlan } from '../../types';
import { differenceInDays, parseISO } from 'date-fns';
import { detectTimeframeMismatch, TRADE_TYPES } from '../../utils/disciplineRules';
import { DailyCheckModal } from './DailyCheckModal';
import { AddPositionModal } from './AddPositionModal';
import { SellPositionModal } from './SellPositionModal';
import {
  Clock,
  Plus,
  TrendingDown,
  CheckCircle,
  GitCommit,
  AlertTriangle,
} from 'lucide-react';

interface PositionCardProps {
  plan: TradePlan;
  onRefresh: () => void;
  onViewTimeline: (planId: number) => void;
}

export const PositionCard: React.FC<PositionCardProps> = ({
  plan,
  onRefresh,
  onViewTimeline,
}) => {
  const [showDailyCheck, setShowDailyCheck] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);

  const holdDays = plan.startDate
    ? differenceInDays(new Date(), parseISO(plan.startDate))
    : 0;
  const expectedDays = plan.expectedDays || 30;
  const progressPercent = Math.min(100, Math.round((holdDays / expectedDays) * 100));

  const typeInfo = TRADE_TYPES[plan.tradeType];
  const mismatchAlert = detectTimeframeMismatch(plan);

  // 浮动盈亏计算
  const avgCost = plan.avgEntryPrice;
  const currentPrice = plan.currentPrice || avgCost;
  const floatingPnlPercent =
    avgCost > 0 ? Number((((currentPrice - avgCost) / avgCost) * 100).toFixed(2)) : 0;

  return (
    <>
      <div className="tg-card tg-card-interactive rounded-2xl p-5 border border-white/5 space-y-4 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-wide">
                  {plan.name}
                </span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">
                  {plan.symbol}
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    plan.tradeType === 'A'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : plan.tradeType === 'B'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {typeInfo?.name || `类型 ${plan.tradeType}`}
                </span>

                {plan.dailyStatus === 'OBSERVING' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    🟡 观察中
                  </span>
                )}
                {plan.dailyStatus === 'RE_EVALUATING' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    🔴 警报重估
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                <span>持仓比例: <strong className="text-white font-mono">{plan.currentPosition || plan.plannedPosition}%</strong></span>
                <span>成本均价: <strong className="text-zinc-200 font-mono">¥{plan.avgEntryPrice}</strong></span>
                <span>当前市价: <strong className="text-zinc-200 font-mono">¥{currentPrice}</strong></span>
              </div>
            </div>
          </div>

          {/* 右上角盈亏与风控信息 */}
          <div className="text-right flex flex-col items-end">
            <div
              className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${
                floatingPnlPercent >= 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {floatingPnlPercent >= 0 ? `+${floatingPnlPercent}%` : `${floatingPnlPercent}%`}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              最大预设风险: <span className="font-mono text-zinc-400">{plan.maxAccountRisk}%</span>
            </div>
          </div>
        </div>

        {/* 时间尺度进度条 */}
        <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>验证周期：已持有 <strong className="text-white font-mono">{holdDays}</strong> 天 / 预期 <strong className="text-zinc-300 font-mono">{expectedDays}</strong> 天</span>
            </div>
            <span className="font-mono text-zinc-400 text-[11px]">{progressPercent}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                holdDays > expectedDays
                  ? 'bg-rose-500'
                  : progressPercent > 80
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ⚠️ 时间尺度错配检测警报横幅 (PRD Section 13) */}
        {mismatchAlert && (
          <div
            className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
              mismatchAlert.type === 'DANGER'
                ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                : mismatchAlert.type === 'WARNING'
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                : 'bg-blue-950/30 border-blue-500/30 text-blue-200'
            }`}
          >
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{mismatchAlert.title}</span>
            </div>
            <p className="text-[11px] opacity-90">{mismatchAlert.message}</p>
          </div>
        )}

        {/* 核心 ABCT 回显卡片 (PRD Section 11) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-indigo-400 font-medium flex items-center gap-1">
              <span>原始买入理由 (Alpha)</span>
            </div>
            <div className="text-zinc-200 leading-snug line-clamp-3">
              {plan.alpha}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-rose-400 font-medium flex items-center gap-1">
              <span>预设证伪条件 (Broken)</span>
            </div>
            <div className="text-zinc-200 leading-snug line-clamp-3">
              {plan.broken}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-emerald-400 font-medium flex items-center gap-1">
              <span>预设加仓条件 (Continue)</span>
            </div>
            <div className="text-zinc-200 leading-snug line-clamp-3">
              {plan.continueCondition}
            </div>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
          <button
            onClick={() => onViewTimeline(plan.id!)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 py-1.5 px-2.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
            <span>生命周期时间轴</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDailyCheck(true)}
              className="flex items-center gap-1 text-xs py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 transition-all active:scale-95"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>每日检查</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 text-xs py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>我要加仓</span>
            </button>

            <button
              onClick={() => setShowSellModal(true)}
              className="flex items-center gap-1 text-xs py-1.5 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-all active:scale-95"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>我要卖出</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDailyCheck && (
        <DailyCheckModal
          plan={plan}
          onClose={() => setShowDailyCheck(false)}
          onSaved={() => {
            setShowDailyCheck(false);
            onRefresh();
          }}
        />
      )}

      {showAddModal && (
        <AddPositionModal
          plan={plan}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}

      {showSellModal && (
        <SellPositionModal
          plan={plan}
          onClose={() => setShowSellModal(false)}
          onSaved={() => {
            setShowSellModal(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
};
