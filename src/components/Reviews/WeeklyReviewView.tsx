// src/components/Reviews/WeeklyReviewView.tsx
import React, { useMemo } from 'react';
import type { TradePlan } from '../../types';
import { subDays, isAfter, parseISO, format } from 'date-fns';
import {
  CalendarCheck,
  Award,
  AlertTriangle,
} from 'lucide-react';

interface WeeklyReviewViewProps {
  plans: TradePlan[];
}

export const WeeklyReviewView: React.FC<WeeklyReviewViewProps> = ({ plans }) => {
  const today = new Date();
  const weekAgo = subDays(today, 7);

  // 筛选近 7 天创建或闭仓的交易
  const weekTrades = useMemo(() => {
    return plans.filter((p) => {
      try {
        const createdDate = parseISO(p.createdAt);
        const closedDate = p.closeDate ? parseISO(p.closeDate) : null;
        return isAfter(createdDate, weekAgo) || (closedDate && isAfter(closedDate, weekAgo));
      } catch {
        return false;
      }
    });
  }, [plans, weekAgo]);

  const closedTradesThisWeek = weekTrades.filter((p) => p.status === 'CLOSED');
  const totalTradesCount = weekTrades.length;

  const profitTradesCount = closedTradesThisWeek.filter(
    (p) => (p.financialResultPercent ?? 0) > 0
  ).length;
  const lossTradesCount = closedTradesThisWeek.filter(
    (p) => (p.financialResultPercent ?? 0) < 0
  ).length;
  const winRate =
    closedTradesThisWeek.length > 0
      ? Math.round((profitTradesCount / closedTradesThisWeek.length) * 100)
      : 0;

  // 纪律违规指标深度剖析 (PRD Section 20)
  const plannedTradesCount = weekTrades.filter((p) => !p.isUnplanned && !p.isFomo).length;
  const unplannedCount = weekTrades.filter((p) => p.isUnplanned).length;
  const fomoCount = weekTrades.filter((p) => p.isFomo).length;
  const timeframeMismatchCount = weekTrades.filter((p) => {
    return (
      (p.tradeType === 'C' && p.expectedDays <= 5 && (p.currentPosition || 0) > 0) ||
      (p.tradeType === 'A' && (p.financialResultPercent ?? 0) < 0 && p.stopType === 'PRICE_STOP')
    );
  }).length;
  const overRiskCount = weekTrades.filter((p) => p.maxAccountRisk > 2.0).length;

  const totalViolations = unplannedCount + fomoCount + timeframeMismatchCount + overRiskCount;

  // 纪律评分定级
  let grade = 'S · 知行合一';
  let gradeColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  if (totalViolations >= 5) {
    grade = 'D · 严重失控';
    gradeColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  } else if (totalViolations >= 3) {
    grade = 'C · 需高度警惕';
    gradeColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  } else if (totalViolations >= 1) {
    grade = 'B · 存在瑕疵';
    gradeColor = 'text-sky-400 border-sky-500/30 bg-sky-500/10';
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 顶部标题 */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
          <CalendarCheck className="w-4 h-4" />
          <span>周度纪律审计</span>
          <span className="text-zinc-600">·</span>
          <span>系统自动生成</span>
        </div>
        <h2 className="text-xl font-bold text-white">
          本周交易纪律报告
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          统计区间：近 7 天 ({format(weekAgo, 'MM-dd')} ～ {format(today, 'MM-dd')})。财务结果代表市场赏罚，过程纪律决定长期复利。
        </p>
      </div>

      {/* 评分大卡片 */}
      <div className="tg-card rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-xs text-zinc-400 font-medium">本周交易行为质量综述</div>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold px-3 py-1 rounded-xl border ${gradeColor}`}>
              {grade}
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            本周共记录 {totalTradesCount} 笔标的操作，出现 {totalViolations} 次纪律偏差。
            记住：<strong className="text-zinc-200">“仓位是风险的结果，不是信心的表达；买入理由已经消失，不要因为亏损改变理由。”</strong>
          </p>
        </div>

        {/* 核心数据仪表 */}
        <div className="grid grid-cols-3 gap-3 text-center flex-shrink-0">
          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <div className="text-[11px] text-zinc-500">平仓胜率</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {winRate}%
            </div>
            <div className="text-[10px] text-zinc-500">
              {profitTradesCount}赢 / {lossTradesCount}亏
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <div className="text-[11px] text-zinc-500">计划执行率</div>
            <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
              {totalTradesCount > 0 ? Math.round((plannedTradesCount / totalTradesCount) * 100) : 100}%
            </div>
            <div className="text-[10px] text-zinc-500">
              {plannedTradesCount}/{totalTradesCount} 笔计划内
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <div className="text-[11px] text-zinc-500">纪律违规</div>
            <div className={`text-xl font-bold font-mono mt-1 ${totalViolations > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalViolations}
            </div>
            <div className="text-[10px] text-zinc-500">
              项纪律瑕疵
            </div>
          </div>
        </div>
      </div>

      {/* 详细纪律统计矩阵 (PRD Section 20) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="tg-card rounded-2xl p-5 border border-white/5 space-y-3">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span>交易计划遵循度</span>
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-zinc-300">计划内按预设买入：</span>
              <span className="font-mono font-bold text-emerald-400">{plannedTradesCount} 笔</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-zinc-300">计划外临时起意建仓：</span>
              <span className={`font-mono font-bold ${unplannedCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                {unplannedCount} 笔
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-zinc-300">FOMO (追涨急躁)：</span>
              <span className={`font-mono font-bold ${fomoCount > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                {fomoCount} 次
              </span>
            </div>
          </div>
        </div>

        <div className="tg-card rounded-2xl p-5 border border-white/5 space-y-3">
          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>认知偏差与尺度错配</span>
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-zinc-300">时间尺度错配与超期：</span>
              <span className={`font-mono font-bold ${timeframeMismatchCount > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                {timeframeMismatchCount} 次
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-zinc-300">超出账户单笔风控上限：</span>
              <span className={`font-mono font-bold ${overRiskCount > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                {overRiskCount} 次
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-zinc-300">好交易但止损亏钱 (严格守纪)：</span>
              <span className="font-mono font-bold text-sky-400">
                {weekTrades.filter((p) => (p.financialResultPercent ?? 0) < 0 && p.processResult === 'EXCELLENT').length} 笔
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 本周相关标的清单 */}
      <div className="tg-card rounded-2xl p-5 border border-white/5 space-y-3">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          本周发生动态的标的明细
        </h4>

        {weekTrades.length > 0 ? (
          <div className="divide-y divide-white/5 text-xs">
            {weekTrades.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{t.name}</span>
                    <span className="font-mono text-zinc-500 text-[11px]">{t.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-zinc-400">
                      {t.tradeType === 'A' ? '产业预期' : t.tradeType === 'B' ? '事件催化' : '趋势情绪'}
                    </span>
                    {t.isFomo && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                        FOMO
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1 line-clamp-1 max-w-xl">
                    Alpha: {t.alpha}
                  </div>
                </div>

                <div className="text-right font-mono">
                  {t.status === 'CLOSED' ? (
                    <div>
                      <span className={`font-bold ${(t.financialResultPercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(t.financialResultPercent ?? 0) > 0 ? '+' : ''}{t.financialResultPercent}%
                      </span>
                      <div className="text-[10px] text-zinc-500">
                        质量: {t.processResult}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-indigo-300">持有中 {t.currentPosition}%</span>
                      <div className="text-[10px] text-zinc-500">
                        风控: {t.maxAccountRisk}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-zinc-500">
            本周暂无标的动态
          </div>
        )}
      </div>
    </div>
  );
};
