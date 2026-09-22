// src/components/Dashboard/DashboardView.tsx
import React, { useMemo } from 'react';
import type { TradePlan, AccountSettings } from '../../types';
import { evaluateCircuitBreaker } from '../../utils/riskCalculator';
import { StatusHeader } from './StatusHeader';
import { CircuitBreakerAlert } from './CircuitBreakerAlert';
import { DisciplineQuoteCard } from './DisciplineQuoteCard';
import { PositionCard } from '../Positions/PositionCard';
import {
  Briefcase,
  Plus,
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
  ShieldCheck,
} from 'lucide-react';

interface DashboardViewProps {
  plans: TradePlan[];
  settings: AccountSettings;
  onRefresh: () => void;
  onNavigateTab: (tab: any) => void;
  onViewTimeline: (planId: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  plans,
  settings,
  onRefresh,
  onNavigateTab,
  onViewTimeline,
}) => {
  const cb = useMemo(() => {
    return evaluateCircuitBreaker(plans, settings);
  }, [plans, settings]);

  const activePlans = plans.filter((p) => p.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* 熔断告警横幅（触发时自动展示） */}
      <CircuitBreakerAlert
        reasons={cb.reasons}
        onOpenSettings={() => onNavigateTab('settings')}
        onOpenDailyReview={() => onNavigateTab('daily-review')}
      />

      {/* 状态统计卡片 */}
      <StatusHeader
        plans={plans}
        isCircuitBreakerTriggered={cb.isTriggered}
      />

      {/* 交易守门员核心 Slogan 与纪律名言 */}
      <DisciplineQuoteCard />

      {/* 活跃持仓纪律实时监控 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              当前持仓与时间尺度对齐
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {activePlans.length} 标的在守
            </span>
          </div>

          <button
            onClick={() => onNavigateTab('positions')}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>查看完整持仓监控</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activePlans.length > 0 ? (
          <div className="space-y-4">
            {activePlans.map((plan) => (
              <PositionCard
                key={plan.id}
                plan={plan}
                onRefresh={onRefresh}
                onViewTimeline={onViewTimeline}
              />
            ))}
          </div>
        ) : (
          <div className="tg-card rounded-2xl p-10 text-center space-y-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-semibold text-white">当前无任何持仓标的</div>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              “空仓是交易者最强力的武器”。当没有出现值得承受风险的高确定性产业预期前，拒绝任何盲目操作。
            </p>
            <button
              onClick={() => onNavigateTab('new-trade')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>建立新交易计划</span>
            </button>
          </div>
        )}
      </div>

      {/* 底部快捷复盘入口横幅 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div
          onClick={() => onNavigateTab('daily-review')}
          className="tg-card tg-card-interactive rounded-2xl p-4 cursor-pointer border border-white/5 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">每日闭市 6 问复盘</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                严查计划外买入与因浮亏盲目加仓
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => onNavigateTab('weekly-review')}
          className="tg-card tg-card-interactive rounded-2xl p-4 cursor-pointer border border-white/5 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">本周交易纪律报告</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                胜率、计划率与行为质量审计报告
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>
  );
};
