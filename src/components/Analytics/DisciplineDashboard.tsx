// src/components/Analytics/DisciplineDashboard.tsx
import React, { useMemo } from 'react';
import type { TradePlan, AccountSettings } from '../../types';
import { computeDisciplineMetrics } from '../../utils/riskCalculator';
import ReactECharts from 'echarts-for-react';
import {
  BarChart3,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  Compass,
  Smile,
  Frown,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface DisciplineDashboardProps {
  plans: TradePlan[];
  settings: AccountSettings;
}

export const DisciplineDashboard: React.FC<DisciplineDashboardProps> = ({
  plans,
  settings,
}) => {
  const metrics = useMemo(() => {
    return computeDisciplineMetrics(plans, settings);
  }, [plans, settings]);

  const closedPlans = plans.filter((p) => p.status === 'CLOSED');

  // 四象限统计：好交易 vs 坏交易 & 盈利 vs 亏损 (PRD Section 21)
  const matrixData = useMemo(() => {
    let goodWin = 0;   // 好交易 + 赚钱 (知行合一，实至名归)
    let goodLoss = 0;  // 好交易 + 亏钱 (逻辑证伪，严格止损，教科书级)
    let badWin = 0;    // 坏交易 + 赚钱 (违规冲动，侥幸获利，最具毒性)
    let badLoss = 0;   // 坏交易 + 亏钱 (违规冲动，自食其果)

    closedPlans.forEach((p) => {
      const isGood = p.processResult === 'EXCELLENT' || p.processResult === 'NORMAL';
      const isWin = (p.financialResultPercent ?? 0) >= 0;

      if (isGood && isWin) goodWin++;
      else if (isGood && !isWin) goodLoss++;
      else if (!isGood && isWin) badWin++;
      else if (!isGood && !isWin) badLoss++;
    });

    return { goodWin, goodLoss, badWin, badLoss };
  }, [closedPlans]);

  // ECharts: 过程质量 vs 财务收益率散点图
  const scatterOption = useMemo(() => {
    const dataPoints = closedPlans.map((p) => {
      let qualityScore = 1;
      if (p.processResult === 'EXCELLENT') qualityScore = 4;
      else if (p.processResult === 'NORMAL') qualityScore = 3;
      else if (p.processResult === 'MINOR_VIOLATION') qualityScore = 2;
      else qualityScore = 1;

      return {
        name: p.name,
        symbol: p.symbol,
        value: [p.financialResultPercent ?? 0, qualityScore],
        itemStyle: {
          color:
            qualityScore >= 3
              ? (p.financialResultPercent ?? 0) >= 0
                ? '#10b981'
                : '#38bdf8'
              : (p.financialResultPercent ?? 0) >= 0
              ? '#f59e0b'
              : '#f43f5e',
        },
      };
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const item = params.data;
          const returnVal = item.value[0];
          const qualityName =
            item.value[1] === 4
              ? '优秀'
              : item.value[1] === 3
              ? '正常'
              : item.value[1] === 2
              ? '轻微违规'
              : '严重违规';
          return `<div style="font-size:12px;padding:4px 6px;">
            <strong>${item.name} (${item.symbol})</strong><br/>
            财务收益: <span style="font-family:monospace;font-weight:bold;">${returnVal > 0 ? '+' : ''}${returnVal}%</span><br/>
            过程质量: <strong>${qualityName}</strong>
          </div>`;
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '15%',
        bottom: '15%',
      },
      xAxis: {
        name: '实际财务收益率 (%)',
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: '#94a3b8', fontSize: 11 },
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        axisLabel: { color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' },
      },
      yAxis: {
        name: '过程质量等级',
        type: 'value',
        min: 0.5,
        max: 4.5,
        interval: 1,
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        axisLabel: {
          formatter: (val: number) => {
            if (val === 4) return '优秀';
            if (val === 3) return '正常';
            if (val === 2) return '轻微瑕疵';
            if (val === 1) return '严重违规';
            return '';
          },
          color: '#94a3b8',
          fontSize: 10,
        },
      },
      series: [
        {
          type: 'scatter',
          symbolSize: 18,
          data: dataPoints,
          markLine: {
            silent: true,
            lineStyle: { type: 'dashed', color: 'rgba(255,255,255,0.15)' },
            data: [{ xAxis: 0 }, { yAxis: 2.5 }],
          },
        },
      ],
    };
  }, [closedPlans]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 顶部标题 */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>纪律统计仪表盘</span>
          <span className="text-zinc-600">·</span>
          <span>用行为定乾坤</span>
        </div>
        <h2 className="text-xl font-bold text-white">
          交易纪律统计与质量矩阵
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          核心原则：“不要用结果替行为辩护”。统计好交易与坏交易的分布，彻底根除侥幸获利心理。
        </p>
      </div>

      {/* 5 大核心纪律率卡片 (PRD Section 22) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* 计划交易率 */}
        <div className="tg-card rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>计划交易率</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white pt-1">
            {metrics.plannedTradeRate}%
          </div>
          <div className="text-[10px] text-zinc-500">
            计划内 / 全部交易
          </div>
        </div>

        {/* 时间尺度匹配率 */}
        <div className="tg-card rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>时间尺度匹配率</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-sky-400 pt-1">
            {metrics.timeframeMatchRate}%
          </div>
          <div className="text-[10px] text-zinc-500">
            契合预期周期持股
          </div>
        </div>

        {/* 理性加仓率 */}
        <div className="tg-card rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>理性加仓率</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-indigo-400 pt-1">
            {metrics.rationalAddRate}%
          </div>
          <div className="text-[10px] text-zinc-500">
            有客观新增证据加仓
          </div>
        </div>

        {/* 情绪交易率 */}
        <div className="tg-card rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>情绪交易率</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-mono font-bold pt-1 ${metrics.emotionalTradeRate > 15 ? 'text-rose-400' : 'text-zinc-200'}`}>
            {metrics.emotionalTradeRate}%
          </div>
          <div className="text-[10px] text-zinc-500">
            FOMO / 冲动 / 恐慌
          </div>
        </div>

        {/* 综合胜率 */}
        <div className="tg-card rounded-2xl p-4 space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>平仓胜率</span>
            <Compass className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white pt-1">
            {metrics.winRate}%
          </div>
          <div className="text-[10px] text-zinc-500">
            已平仓样本统计
          </div>
        </div>
      </div>

      {/* 过程质量与财务收益四象限矩阵 (PRD Section 21) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：四象限卡片 */}
        <div className="tg-card rounded-2xl p-6 border border-white/5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              <span>交易行为与财务结果四象限 (Process vs Return)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              把“结果好坏”与“过程对错”彻底剥离，认清哪些是实力，哪些是运气。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* 象限 1: 好交易 + 赚钱 */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Smile className="w-4 h-4" /> 好交易 + 赚钱
                </span>
                <span className="font-mono text-base font-bold text-emerald-300">
                  {matrixData.goodWin} 笔
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/70 leading-snug">
                严格恪守 ABCT 假说与纪律，逻辑获市场充分兑现，真正的复利基石。
              </p>
            </div>

            {/* 象限 2: 坏交易 + 赚钱 (最危险) */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> 坏交易 + 赚钱 🚨
                </span>
                <span className="font-mono text-base font-bold text-amber-300">
                  {matrixData.badWin} 笔
                </span>
              </div>
              <p className="text-[11px] text-amber-200/70 leading-snug">
                FOMO 追涨或无逻辑临时建仓，侥幸获利。这是最致命的毒药，极易导致下一次重仓覆灭。
              </p>
            </div>

            {/* 象限 3: 好交易 + 亏钱 */}
            <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> 好交易 + 亏钱 ⭐
                </span>
                <span className="font-mono text-base font-bold text-sky-300">
                  {matrixData.goodLoss} 笔
                </span>
              </div>
              <p className="text-[11px] text-sky-200/70 leading-snug">
                建仓有理有据，事实证伪后坚决执行 Thesis Stop 退出。虽亏犹荣，保全了账户生命线！
              </p>
            </div>

            {/* 象限 4: 坏交易 + 亏钱 */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400 flex items-center gap-1">
                  <Frown className="w-4 h-4" /> 坏交易 + 亏钱
                </span>
                <span className="font-mono text-base font-bold text-rose-300">
                  {matrixData.badLoss} 笔
                </span>
              </div>
              <p className="text-[11px] text-rose-200/70 leading-snug">
                违背纪律冲动交易，被套后甚至死扛补仓改长线，自食苦果，必须深刻痛定思痛。
              </p>
            </div>
          </div>
        </div>

        {/* 右侧：ECharts 散点分布图 */}
        <div className="tg-card rounded-2xl p-6 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              已平仓标的收益率与质量分布
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">
              散点越大，代表样本集中度
            </span>
          </div>

          <div className="h-64 w-full">
            {closedPlans.length > 0 ? (
              <ReactECharts
                option={scatterOption}
                style={{ height: '100%', width: '100%' }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                暂无已平仓交易样本数据
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
