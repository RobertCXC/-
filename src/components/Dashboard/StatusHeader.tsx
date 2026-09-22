// src/components/Dashboard/StatusHeader.tsx
import React from 'react';
import { CheckCircle2, AlertOctagon, TrendingUp, Zap, Clock } from 'lucide-react';
import type { TradePlan } from '../../types';
import { isToday, parseISO, subDays, isAfter } from 'date-fns';

interface StatusHeaderProps {
  plans: TradePlan[];
  isCircuitBreakerTriggered: boolean;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({
  plans,
  isCircuitBreakerTriggered,
}) => {
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);

  // 1. 今日交易统计
  const todayCreatedTrades = plans.filter((p) => {
    try {
      return isToday(parseISO(p.createdAt));
    } catch {
      return false;
    }
  });

  const todayPlannedTrades = todayCreatedTrades.filter((p) => !p.isUnplanned && !p.isFomo).length;
  const todayUnplannedTrades = todayCreatedTrades.filter((p) => p.isUnplanned || p.isFomo).length;

  // 2. 本周纪律违规统计 (FOMO, 临时交易, 坏交易)
  const weekViolations = plans.filter((p) => {
    try {
      const created = parseISO(p.createdAt);
      if (!isAfter(created, sevenDaysAgo)) return false;
      return (
        p.isFomo ||
        p.isUnplanned ||
        p.processResult === 'MINOR_VIOLATION' ||
        p.processResult === 'SEVERE_VIOLATION'
      );
    } catch {
      return false;
    }
  }).length;

  // 3. 当前活跃总仓位
  const activePlans = plans.filter((p) => p.status === 'ACTIVE');
  const totalActivePosition = activePlans.reduce((sum, p) => sum + (p.currentPosition || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
      {/* 状态卡片 */}
      <div className="tg-card rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span>今日交易状态</span>
          {isCircuitBreakerTriggered ? (
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-lg font-bold ${
              isCircuitBreakerTriggered ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {isCircuitBreakerTriggered ? '🔴 熔断警报' : '🟢 纪律正常'}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-500">
          {isCircuitBreakerTriggered ? '触发风控防线' : '未触发熔断条件'}
        </div>
      </div>

      {/* 今日计划交易 */}
      <div className="tg-card rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span>今日计划交易</span>
          <TrendingUp className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-white">
            {todayPlannedTrades}
          </span>
          <span className="text-xs text-zinc-400">笔</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-500">
          按 ABCT 预设建仓
        </div>
      </div>

      {/* 临时/冲动交易 */}
      <div className="tg-card rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span>临时 / 冲动交易</span>
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-2xl font-mono font-bold ${
              todayUnplannedTrades > 0 ? 'text-amber-400' : 'text-zinc-200'
            }`}
          >
            {todayUnplannedTrades}
          </span>
          <span className="text-xs text-zinc-400">笔</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-500">
          {todayUnplannedTrades > 0 ? '⚠️ 存在非计划行为' : '守住冲动防线'}
        </div>
      </div>

      {/* 本周纪律违规 */}
      <div className="tg-card rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span>本周纪律违规</span>
          <AlertOctagon className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-2xl font-mono font-bold ${
              weekViolations > 0 ? 'text-rose-400' : 'text-zinc-200'
            }`}
          >
            {weekViolations}
          </span>
          <span className="text-xs text-zinc-400">次</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-500">
          含 FOMO 与理由漂移
        </div>
      </div>

      {/* 当前总持仓 */}
      <div className="tg-card rounded-xl p-4 flex flex-col justify-between col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-zinc-400 text-xs">
          <span>当前总持仓水位</span>
          <Clock className="w-4 h-4 text-sky-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-white">
            {totalActivePosition}
          </span>
          <span className="text-xs text-zinc-400">%</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-500">
          共计 {activePlans.length} 只标的
        </div>
      </div>
    </div>
  );
};
