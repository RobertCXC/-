// src/components/Reviews/DailyReviewView.tsx
import React, { useState, useEffect } from 'react';
import type { DailyReview, TradePlan } from '../../types';
import { db } from '../../db/database';
import { format } from 'date-fns';
import { BrainCircuit, History, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyReviewViewProps {
  plans: TradePlan[];
}

export const DailyReviewView: React.FC<DailyReviewViewProps> = ({ plans }) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [unplannedTrade, setUnplannedTrade] = useState(false);
  const [timeframeMismatch, setTimeframeMismatch] = useState(false);
  const [shortToLong, setShortToLong] = useState(false);
  const [emotionalAdd, setEmotionalAdd] = useState(false);
  const [fomo, setFomo] = useState(false);

  const [worstTradeId, setWorstTradeId] = useState<number | undefined>(plans[0]?.id);
  const [problemType, setProblemType] = useState<DailyReview['problemType']>('NORMAL_LOSS');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [pastReviews, setPastReviews] = useState<DailyReview[]>([]);

  const loadPastReviews = async () => {
    const list = await db.dailyReviews.reverse().sortBy('date');
    setPastReviews(list);
  };

  useEffect(() => {
    loadPastReviews();
  }, []);

  const hasAnyViolation = unplannedTrade || timeframeMismatch || shortToLong || emotionalAdd || fomo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedWorstPlan = plans.find((p) => p.id === worstTradeId);

      await db.dailyReviews.add({
        date: todayStr,
        unplannedTrade,
        timeframeMismatch,
        shortToLong,
        emotionalAdd,
        fomo,
        worstTradeId,
        worstTradeSymbol: selectedWorstPlan?.symbol,
        worstTradeName: selectedWorstPlan?.name,
        problemType,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      });

      if (!hasAnyViolation) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      setNotes('');
      await loadPastReviews();
      alert('今日闭市复盘已完成记录！保持自律与敬畏。');
    } catch (err) {
      console.error(err);
      alert('复盘记录保存失败');
    } finally {
      setSaving(false);
    }
  };

  const problemTypeLabels: Record<DailyReview['problemType'], string> = {
    PREDICTION_ERROR: '判断错误 (假说未被验证)',
    EXECUTION_ERROR: '执行错误 (未按计划离场)',
    POSITION_ERROR: '仓位错误 (仓位超出风控)',
    TIMEFRAME_ERROR: '时间尺度错误 (短线变长线/中线被震出)',
    EMOTION_ERROR: '情绪问题 (FOMO/焦虑慌乱抛售)',
    NORMAL_LOSS: '正常亏损 (逻辑证伪的优质防守)',
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* 顶部标题 */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
          <BrainCircuit className="w-4 h-4" />
          <span>每日闭市问讯</span>
          <span className="text-zinc-600">·</span>
          <span>前额叶自检</span>
        </div>
        <h2 className="text-xl font-bold text-white">
          每日复盘 · 守门员 6 问
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          收盘后只回答 6 个核心问题。诚实面对自己的交易行为，绝不用当天的收益结果替违规行为辩护。
        </p>
      </div>

      {/* 6 问交互表单 */}
      <form onSubmit={handleSubmit} className="tg-card rounded-2xl p-6 border border-white/5 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <span className="text-xs font-bold text-zinc-200">
            复盘日期：<span className="font-mono text-indigo-400">{todayStr}</span>
          </span>
          <span className="text-[11px] text-zinc-500">
            答卷原则：知错认错，克制贪婪
          </span>
        </div>

        <div className="space-y-4 text-xs">
          {/* 1 */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-zinc-200">1. 今天盘中有没有发生计划外交易？</span>
              <p className="text-[11px] text-zinc-500 mt-0.5">未提前录入 ABCT 计划，看盘临时起意下单买入</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUnplannedTrade(false)}
                className={`px-4 py-1.5 rounded-lg font-medium border ${
                  !unplannedTrade ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'border-white/10 text-zinc-500 hover:bg-white/5'
                }`}
              >
                NO (严格守纪)
              </button>
              <button
                type="button"
                onClick={() => setUnplannedTrade(true)}
                className={`px-4 py-1.5 rounded-lg font-medium border ${
                  unplannedTrade ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'border-white/10 text-zinc-500 hover:bg-white/5'
                }`}
              >
                YES (存在临时交易)
              </button>
            </div>
          </div>

          {/* 2 */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-zinc-200">2. 有没有：产业逻辑买入，却因为短期两三天的价格波动卖出？</span>
              <p className="text-[11px] text-zinc-500 mt-0.5">时间尺度严重错配，拿数月周期的逻辑却被日内分时吓退</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimeframeMismatch(false)}
                className={`px-4 py-1.5 rounded-lg font-medium border ${
                  !timeframeMismatch ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'border-white/10 text-zinc-500 hover:bg-white/5'
                }`}
              >
                NO
              </button>
              <button
                type="button"
                onClick={() => setTimeframeMismatch(true)}
                className={`px-4 py-1.5 rounded-lg font-medium border ${
                  timeframeMismatch ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'border-white/10 text-zinc-500 hover:bg-white/5'
                }`}
              >
                YES
              </button>
            </div>
          </div>

          {/* 3 */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-zinc-200">3. 有没有：短线情绪交易被套以后，自我安慰改做中长线价值投资？</span>
              <p className="text-[11px] text-zinc-500 mt-0.5">最危险的鸵鸟心态，让有限亏损演变成致命套牢</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShortToLong(false)}
                className={`px-4 py-1.5 rounded-lg font-medium border ${
                  !shortToLong ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'border-white/10 text-zinc-500 hover:bg-white/5'
                }`}
              >
                NO
              </button>
              <button
                type="button"
                onClick={() => setShortToLong(true)}
                className={`px-4 py-1.5 rounded-lg font-medium border ${
                  shortToLong ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'border-white/10 text-zinc-500 hover:bg-white/5'
                }`}
              >
                YES
              </button>
            </div>
          </div>

          {/* 4 */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-zinc-200">4. 有没有：仅仅因为浮亏而加仓摊薄成本，而不是因为新增证据？</span>
              <p className="text-[11px] text-zinc-500 mt-0.5">破除成本锚定，无新增客观事实绝不加码</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEmotionalAdd(false)}
                className={`px-4 py-1.5 rounded-lg font-medium border ${
                  !emotionalAdd ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'border-white/10 text-zinc-500 hover:bg-white/5'
                }`}
              >
                NO
              </button>
              <button
                type="button"
                onClick={() => setEmotionalAdd(true)}
                className={`px-4 py-1.5 rounded-lg font-medium border ${
                  emotionalAdd ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'border-white/10 text-zinc-500 hover:bg-white/5'
                }`}
              >
                YES
              </button>
            </div>
          </div>

          {/* 5 */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-zinc-200">5. 今天有没有发生 FOMO (害怕踏空) 情绪交易？</span>
              <p className="text-[11px] text-zinc-500 mt-0.5">看到涨停板或板块急拉，心跳加速直接挂单抢筹</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFomo(false)}
                className={`px-4 py-1.5 rounded-lg font-medium border ${
                  !fomo ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'border-white/10 text-zinc-500 hover:bg-white/5'
                }`}
              >
                NO
              </button>
              <button
                type="button"
                onClick={() => setFomo(true)}
                className={`px-4 py-1.5 rounded-lg font-medium border ${
                  fomo ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'border-white/10 text-zinc-500 hover:bg-white/5'
                }`}
              >
                YES
              </button>
            </div>
          </div>

          {/* 6. 最差交易与归因 */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
            <span className="font-semibold text-zinc-200">
              6. 复盘今天最差或最需警惕的一笔交易：
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 text-[11px] mb-1">
                  关联标的
                </label>
                <select
                  value={worstTradeId || ''}
                  onChange={(e) => setWorstTradeId(Number(e.target.value))}
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">（无特定最差标的 / 今日未操作）</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] mb-1">
                  主要问题归属于哪种类型？
                </label>
                <select
                  value={problemType}
                  onChange={(e) => setProblemType(e.target.value as any)}
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  {Object.entries(problemTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-[11px] mb-1">
                复盘心得与明日自律备忘录
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="记录今天的心态变化、市场给的教训、或对纪律坚守的肯定..."
                className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="text-xs">
            {hasAnyViolation ? (
              <span className="text-rose-400 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4" />
                今日存在纪律偏离，记录在案，保持谦逊。
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-4 h-4" />
                完美遵守纪律！知行合一，保持状态。
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? '保存中...' : '提交今日闭市复盘'}
          </button>
        </div>
      </form>

      {/* 历史复盘记录列表 */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <span>历史闭市复盘日志</span>
        </h3>

        {pastReviews.length > 0 ? (
          <div className="space-y-3">
            {pastReviews.map((rev) => {
              const countViolations = [
                rev.unplannedTrade,
                rev.timeframeMismatch,
                rev.shortToLong,
                rev.emotionalAdd,
                rev.fomo,
              ].filter(Boolean).length;

              return (
                <div
                  key={rev.id}
                  className="tg-card rounded-2xl p-4 border border-white/5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">
                        {rev.date}
                      </span>
                      {countViolations === 0 ? (
                        <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          🟢 零违规 · 纪律典范
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                          🔴 存在 {countViolations} 项违背
                        </span>
                      )}
                    </div>
                    {rev.worstTradeName && (
                      <span className="text-zinc-400 text-[11px]">
                        核查标的: <strong className="text-zinc-200">{rev.worstTradeName}</strong> ({problemTypeLabels[rev.problemType]})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400 pt-1">
                    {rev.unplannedTrade && <span className="px-1.5 py-0.2 rounded bg-rose-950/40 border border-rose-500/20 text-rose-300">临时交易</span>}
                    {rev.timeframeMismatch && <span className="px-1.5 py-0.2 rounded bg-rose-950/40 border border-rose-500/20 text-rose-300">时间错配</span>}
                    {rev.shortToLong && <span className="px-1.5 py-0.2 rounded bg-rose-950/40 border border-rose-500/20 text-rose-300">短线改长线</span>}
                    {rev.emotionalAdd && <span className="px-1.5 py-0.2 rounded bg-rose-950/40 border border-rose-500/20 text-rose-300">亏损无据加仓</span>}
                    {rev.fomo && <span className="px-1.5 py-0.2 rounded bg-rose-950/40 border border-rose-500/20 text-rose-300">FOMO冲动</span>}
                  </div>

                  {rev.notes && (
                    <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-zinc-300 text-[11px] leading-relaxed italic">
                      “{rev.notes}”
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="tg-card rounded-2xl p-8 text-center text-xs text-zinc-500">
            暂无历史复盘记录
          </div>
        )}
      </div>
    </div>
  );
};
