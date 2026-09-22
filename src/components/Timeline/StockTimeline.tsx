// src/components/Timeline/StockTimeline.tsx
import React, { useState, useEffect } from 'react';
import type { TradePlan, TradeEvent } from '../../types';
import { db } from '../../db/database';
import { TRADE_TYPES, STOP_TYPE_INFO } from '../../utils/disciplineRules';
import {
  GitCommit,
  Plus,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';

interface StockTimelineProps {
  plans: TradePlan[];
  initialSelectedId?: number;
}

export const StockTimeline: React.FC<StockTimelineProps> = ({
  plans,
  initialSelectedId,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>(
    initialSelectedId || plans[0]?.id
  );
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // 追加新增信息的简易表单
  const [newInfoText, setNewInfoText] = useState('');
  const [addingInfo, setAddingInfo] = useState(false);

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedPlanId(initialSelectedId);
    } else if (!selectedPlanId && plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
  }, [initialSelectedId, plans]);

  useEffect(() => {
    if (!selectedPlanId) {
      setEvents([]);
      return;
    }

    const loadEvents = async () => {
      setLoading(true);
      try {
        const evs = await db.tradeEvents
          .where('tradeId')
          .equals(selectedPlanId)
          .reverse()
          .sortBy('createdAt');
        setEvents(evs.reverse()); // 正序排列以呈现时间演进
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [selectedPlanId]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleAddInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !newInfoText.trim()) return;
    setAddingInfo(true);
    try {
      const nowIso = new Date().toISOString();
      await db.tradeEvents.add({
        tradeId: selectedPlanId,
        type: 'INFO',
        reason: `【标的动态跟踪】${newInfoText.trim()}`,
        createdAt: nowIso,
      });
      setNewInfoText('');

      const evs = await db.tradeEvents
        .where('tradeId')
        .equals(selectedPlanId)
        .sortBy('createdAt');
      setEvents(evs);
    } finally {
      setAddingInfo(false);
    }
  };

  const getEventIcon = (type: TradeEvent['type']) => {
    switch (type) {
      case 'PLAN_CREATED':
        return <Calendar className="w-4 h-4 text-indigo-400" />;
      case 'BUY':
        return <ArrowDownCircle className="w-4 h-4 text-sky-400" />;
      case 'ADD':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'REDUCE':
      case 'SELL':
        return <TrendingDown className="w-4 h-4 text-rose-400" />;
      case 'INFO':
        return <Info className="w-4 h-4 text-amber-400" />;
      default:
        return <GitCommit className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题 */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
          <GitCommit className="w-4 h-4" />
          <span>全生命周期跟踪</span>
          <span className="text-zinc-600">·</span>
          <span>因果证据链复盘</span>
        </div>
        <h2 className="text-xl font-bold text-white">
          单只标的决策历程时间轴
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          记录“当时为什么买 → 中间发生什么 → 为什么加仓 → 最后为什么卖”，让每次操作都有据可查。
        </p>
      </div>

      {/* 标的选择器 Tab 栏 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5">
        {plans.map((p) => {
          const isSel = p.id === selectedPlanId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlanId(p.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                isSel
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{p.name}</span>
              <span className="font-mono text-[10px] opacity-75">{p.symbol}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded ${
                  p.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-zinc-700 text-zinc-300'
                }`}
              >
                {p.status === 'ACTIVE' ? '持仓中' : '已平仓'}
              </span>
            </button>
          );
        })}
      </div>

      {selectedPlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：标的档案与 ABCT 基准 */}
          <div className="space-y-4">
            <div className="tg-card rounded-2xl p-5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedPlan.name}
                  </h3>
                  <div className="text-xs font-mono text-zinc-400 mt-0.5">
                    {selectedPlan.symbol} · {TRADE_TYPES[selectedPlan.tradeType]?.name}
                  </div>
                </div>
                <div
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    selectedPlan.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {selectedPlan.status === 'ACTIVE' ? '活跃持仓' : '已完成归档'}
                </div>
              </div>

              {/* 核心 ABCT 模型 */}
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="text-indigo-400 font-semibold">
                    买入核心逻辑 (Alpha)
                  </div>
                  <div className="text-zinc-200 leading-relaxed">
                    {selectedPlan.alpha}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="text-rose-400 font-semibold">
                    预设证伪事实 (Broken)
                  </div>
                  <div className="text-zinc-200 leading-relaxed font-mono">
                    {selectedPlan.broken}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="text-emerald-400 font-semibold">
                    允许加仓证据 (Continue)
                  </div>
                  <div className="text-zinc-200 leading-relaxed">
                    {selectedPlan.continueCondition}
                  </div>
                </div>
              </div>

              {/* 周期与风控数据 */}
              <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>建仓时间:</span>
                  <span className="font-mono text-zinc-200">{selectedPlan.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>预期验证期:</span>
                  <span className="font-mono text-zinc-200">{selectedPlan.expectedDays} 天</span>
                </div>
                <div className="flex justify-between">
                  <span>最大承受风险:</span>
                  <span className="font-mono text-amber-400">{selectedPlan.maxAccountRisk}% 账户资金</span>
                </div>
                {selectedPlan.status === 'CLOSED' && (
                  <>
                    <div className="flex justify-between border-t border-white/5 pt-1 text-white">
                      <span>实际财务回报:</span>
                      <span className={`font-mono font-bold ${(selectedPlan.financialResultPercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(selectedPlan.financialResultPercent ?? 0) > 0 ? '+' : ''}{selectedPlan.financialResultPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>过程质量评级:</span>
                      <span className="font-medium text-indigo-300">
                        {selectedPlan.processResult}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 追加信息小卡片 (仅持仓状态时开放) */}
            {selectedPlan.status === 'ACTIVE' && (
              <form onSubmit={handleAddInfo} className="tg-card rounded-2xl p-4 border border-white/5 space-y-2">
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>追加跟踪事实 / 产业调研数据</span>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="记录今天出现的相关行业、订单或盘面事实..."
                  value={newInfoText}
                  onChange={(e) => setNewInfoText(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={addingInfo}
                  className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-medium transition-colors"
                >
                  {addingInfo ? '写入中...' : '记录到时间轴'}
                </button>
              </form>
            )}
          </div>

          {/* 右侧：纵向演进时间轴 */}
          <div className="lg:col-span-2 tg-card rounded-2xl p-6 border border-white/5">
            <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>决策脉络（按时间顺序演进）</span>
            </h4>

            {loading ? (
              <div className="text-center py-12 text-xs text-zinc-500">
                加载时间轴记录...
              </div>
            ) : events.length > 0 ? (
              <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                {events.map((ev, index) => (
                  <div key={ev.id || index} className="relative group">
                    {/* 时间轴节点圆形标记 */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0d1322] border border-white/20 flex items-center justify-center shadow-sm">
                      {getEventIcon(ev.type)}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-zinc-500">
                          {ev.createdAt.slice(0, 16).replace('T', ' ')}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                            ev.type === 'PLAN_CREATED'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : ev.type === 'BUY'
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                              : ev.type === 'ADD'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : ev.type === 'SELL'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {ev.type}
                        </span>

                        {ev.price && (
                          <span className="text-xs font-mono font-medium text-zinc-300">
                            ¥{ev.price}
                          </span>
                        )}
                        {ev.positionDelta && (
                          <span className="text-[11px] font-mono text-zinc-400">
                            (仓位变化: {ev.positionDelta > 0 ? '+' : ''}{ev.positionDelta}%)
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-200 leading-relaxed space-y-1.5">
                        <div>{ev.reason}</div>

                        {/* 若有加仓证据展示 */}
                        {ev.addEvidenceTypes && ev.addEvidenceTypes.length > 0 && (
                          <div className="text-[11px] text-emerald-400 flex flex-wrap gap-1 mt-1">
                            <span className="text-zinc-500">验证证据：</span>
                            {ev.addEvidenceTypes.map((et, i) => (
                              <span key={i} className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                                {et}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 若有平仓止损类型展示 */}
                        {ev.stopType && (
                          <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-1">
                            <span>机制归类:</span>
                            <span className="text-indigo-300 font-semibold font-mono">
                              {STOP_TYPE_INFO[ev.stopType]?.name || ev.stopType}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-zinc-500">
                暂无时间轴事件
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="tg-card rounded-2xl p-12 text-center text-xs text-zinc-500">
          暂无标的数据，请先建立交易计划
        </div>
      )}
    </div>
  );
};
