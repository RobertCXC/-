// src/components/Positions/SellPositionModal.tsx
import React, { useState } from 'react';
import type { TradePlan } from '../../types';
import { db } from '../../db/database';
import { format } from 'date-fns';
import { SELL_REASON_OPTIONS, STOP_TYPE_INFO } from '../../utils/disciplineRules';
import { X, AlertTriangle, TrendingDown } from 'lucide-react';

interface SellPositionModalProps {
  plan: TradePlan;
  onClose: () => void;
  onSaved: () => void;
}

export const SellPositionModal: React.FC<SellPositionModalProps> = ({
  plan,
  onClose,
  onSaved,
}) => {
  const [selectedReasonId, setSelectedReasonId] = useState<string>('THESIS_BROKEN');
  const [exitPrice, setExitPrice] = useState<number>(plan.currentPrice || plan.avgEntryPrice);
  const [didBrokenConditionOccur, setDidBrokenConditionOccur] = useState<boolean | null>(null);
  const [customExitNote, setCustomExitNote] = useState('');
  const [selectedStopType, setSelectedStopType] = useState<'PRICE_STOP' | 'THESIS_STOP' | 'TIME_STOP' | 'PROFIT_TAKE'>('THESIS_STOP');
  const [processQuality, setProcessQuality] = useState<'EXCELLENT' | 'NORMAL' | 'MINOR_VIOLATION' | 'SEVERE_VIOLATION'>('EXCELLENT');
  const [saving, setSaving] = useState(false);

  const selectedReasonObj = SELL_REASON_OPTIONS.find((r) => r.id === selectedReasonId);
  const isEmotionalReason = selectedReasonObj?.isEmotional ?? false;

  // 收益率计算
  const avgCost = plan.avgEntryPrice;
  const returnPercent = avgCost > 0 ? Number((((exitPrice - avgCost) / avgCost) * 100).toFixed(2)) : 0;

  const handleReasonChange = (reasonId: string) => {
    setSelectedReasonId(reasonId);
    const opt = SELL_REASON_OPTIONS.find((r) => r.id === reasonId);
    if (opt) {
      setSelectedStopType(opt.stopType as any);
      if (opt.isEmotional) {
        setProcessQuality('SEVERE_VIOLATION');
      } else if (opt.id === 'THESIS_BROKEN' || opt.id === 'TARGET_MET') {
        setProcessQuality('EXCELLENT');
      } else {
        setProcessQuality('NORMAL');
      }
    }
  };

  const handleSave = async () => {
    if (!plan.id) return;
    if (isEmotionalReason && didBrokenConditionOccur === null) {
      alert('请先回答客观证伪核验：上述证伪条件究竟有没有发生？');
      return;
    }

    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const violations: string[] = [];
      if (isEmotionalReason) {
        violations.push(selectedReasonObj?.label || '情绪化冲动卖出');
      }
      if (isEmotionalReason && didBrokenConditionOccur === false) {
        violations.push('在原始逻辑未被证伪时因短期情绪波动抛售');
      }

      await db.tradePlans.update(plan.id, {
        status: 'CLOSED',
        closeDate: todayStr,
        exitPrice,
        financialResultPercent: returnPercent,
        processResult: processQuality,
        stopType: selectedStopType,
        exitReason: `${selectedReasonObj?.label || ''}。${customExitNote ? ' 详情: ' + customExitNote : ''}`,
        exitViolations: violations,
        currentPosition: 0,
        updatedAt: nowIso,
      });

      await db.tradeEvents.add({
        tradeId: plan.id,
        type: 'SELL',
        price: exitPrice,
        positionDelta: -(plan.currentPosition || plan.plannedPosition),
        sellReasonCategory: selectedReasonId,
        isEmotionalSell: isEmotionalReason,
        stopType: selectedStopType,
        processResult: processQuality,
        reason: `【卖出平仓】离场价 ¥${exitPrice}，财务盈亏 ${returnPercent > 0 ? '+' : ''}${returnPercent}%。过程评级：${processQuality}。类型：${selectedStopType}。原因：${selectedReasonObj?.label}。${
          isEmotionalReason ? '⚠️ 情绪化卖出标记' : ''
        }`,
        createdAt: nowIso,
      });

      onSaved();
    } catch (e) {
      console.error(e);
      alert('平仓记录保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="tg-card w-full max-w-xl rounded-2xl p-6 border border-white/10 shadow-2xl relative space-y-5 my-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>平仓卖出与过程复盘</span>
            <span className="text-zinc-600">·</span>
            <span>{plan.symbol} {plan.name}</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            不能直接卖出，请先向“买入时的自己”述职
          </h3>
        </div>

        {/* 1. 为什么卖？ */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            1. 本次决定卖出的首要原因是什么？
          </label>
          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {SELL_REASON_OPTIONS.map((opt) => {
              const isSelected = selectedReasonId === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleReasonChange(opt.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? opt.isEmotional
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-200'
                        : 'bg-indigo-500/20 border-indigo-500/60 text-white'
                      : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isSelected ? (opt.isEmotional ? 'bg-rose-400' : 'bg-indigo-400') : 'bg-zinc-600'}`} />
                    <span>{opt.label}</span>
                  </div>
                  {opt.isEmotional && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      情绪陷阱
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 情绪化卖出拦截反问卡 */}
        {isEmotionalReason && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3 animate-fade-in">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>⚠️ 情绪卖出提醒：盘面波动并不等于逻辑证伪</span>
            </div>

            <div className="text-xs text-zinc-300 space-y-2 bg-black/40 p-3 rounded-lg border border-white/5">
              <div>
                <span className="text-zinc-500">你买入当天写下的初衷：</span>
                <div className="text-zinc-200 mt-0.5 font-medium">{plan.alpha}</div>
              </div>
              <div>
                <span className="text-rose-400/90">你最初设定的证伪条件 (Broken)：</span>
                <div className="text-zinc-200 mt-0.5 font-mono">{plan.broken}</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-rose-200 mb-2">
                请诚实核验：上述客观证伪条件真实发生了吗？
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDidBrokenConditionOccur(true)}
                  className={`py-2 rounded-lg text-xs font-medium border ${
                    didBrokenConditionOccur === true
                      ? 'bg-rose-600 text-white border-rose-400'
                      : 'border-white/10 text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  YES，事实确实证伪了逻辑
                </button>
                <button
                  type="button"
                  onClick={() => setDidBrokenConditionOccur(false)}
                  className={`py-2 rounded-lg text-xs font-medium border ${
                    didBrokenConditionOccur === false
                      ? 'bg-amber-600 text-white border-amber-400'
                      : 'border-white/10 text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  NO，单纯是价格下跌心里难受
                </button>
              </div>
            </div>

            <p className="text-[11px] text-rose-300/80 italic">
              （TradeGuard 旨在助您看清情绪，绝不替您决策。若仍要卖出，请在下方完成质量定级）
            </p>
          </div>
        )}

        {/* 2. 止损机制与价格输入 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              实际卖出价格 (¥)
            </label>
            <input
              type="number"
              step="0.01"
              value={exitPrice}
              onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              测算财务盈亏结果
            </label>
            <div className={`h-[34px] rounded-xl border px-3 flex items-center font-mono text-xs font-bold ${
              returnPercent >= 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {returnPercent >= 0 ? `+${returnPercent}%` : `${returnPercent}%`}
            </div>
          </div>
        </div>

        {/* 3. 止损机制归类 */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            2. 本次退出属于哪种止损 / 兑现机制？
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(STOP_TYPE_INFO) as Array<keyof typeof STOP_TYPE_INFO>).map((key) => {
              const info = STOP_TYPE_INFO[key];
              const isSel = selectedStopType === key;
              return (
                <div
                  key={key}
                  onClick={() => setSelectedStopType(key)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSel ? info.color : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="font-semibold text-zinc-200">{info.name}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{info.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. 交易质量与收益分离 (PRD Section 21) */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">
              3. 过程质量评定 (不要用结果替行为辩护)
            </span>
            <span className="text-[10px] text-zinc-500">好交易也会亏钱，坏交易也会赚钱</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-xs">
            {[
              { id: 'EXCELLENT', label: '优秀 (知行合一)' },
              { id: 'NORMAL', label: '正常 (基本遵守)' },
              { id: 'MINOR_VIOLATION', label: '轻微违规' },
              { id: 'SEVERE_VIOLATION', label: '严重违规 (冲动)' },
            ].map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setProcessQuality(q.id as any)}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                  processQuality === q.id
                    ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                    : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* 补充备注 */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            4. 平仓补充说明与反思 (可选)
          </label>
          <textarea
            rows={2}
            value={customExitNote}
            onChange={(e) => setCustomExitNote(e.target.value)}
            placeholder="写下退出时的真实心理状态或市场情况..."
            className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-lg shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? '保存中...' : '确认平仓并归档'}
          </button>
        </div>
      </div>
    </div>
  );
};
