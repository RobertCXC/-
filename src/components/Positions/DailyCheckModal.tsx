// src/components/Positions/DailyCheckModal.tsx
import React, { useState } from 'react';
import type { TradePlan } from '../../types';
import { db } from '../../db/database';
import { format } from 'date-fns';
import { CheckCircle2, AlertCircle, HelpCircle, X } from 'lucide-react';

interface DailyCheckModalProps {
  plan: TradePlan;
  onClose: () => void;
  onSaved: () => void;
}

export const DailyCheckModal: React.FC<DailyCheckModalProps> = ({
  plan,
  onClose,
  onSaved,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'NORMAL' | 'OBSERVING' | 'RE_EVALUATING'>('NORMAL');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!plan.id) return;
    setSaving(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const nowIso = new Date().toISOString();

      // 1. 更新持仓状态
      await db.tradePlans.update(plan.id, {
        dailyStatus: selectedStatus,
        lastDailyCheckDate: todayStr,
        updatedAt: nowIso,
      });

      // 2. 插入事件流水
      let reasonSummary = '';
      if (selectedStatus === 'NORMAL') {
        reasonSummary = `【每日检查】无改变原始假设的新信息，坚守交易计划。${notes ? ' 附注: ' + notes : ''}`;
      } else if (selectedStatus === 'OBSERVING') {
        reasonSummary = `【每日检查 🟡 观察状态】出现新信息但尚未明确证伪：${notes || '待进一步验证数据'}`;
      } else {
        reasonSummary = `【每日检查 🔴 警报状态】原始逻辑可能遭遇客观证伪！警惕并启动重新评估：${notes || '需核验 Broken 条件'}`;
      }

      await db.tradeEvents.add({
        tradeId: plan.id,
        type: 'INFO',
        reason: reasonSummary,
        createdAt: nowIso,
      });

      onSaved();
    } catch (e) {
      console.error(e);
      alert('保存检查记录失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="tg-card w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <span>标的每日假设核验</span>
            <span className="text-zinc-600">·</span>
            <span>{plan.symbol} {plan.name}</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            从昨天到今天，有没有出现改变原始交易假设的新信息？
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            守门员法则：不要问“今天为什么不涨”，只核实当初买入的核心假设是否依然成立。
          </p>
        </div>

        {/* 原始买入与证伪回顾 */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs">
          <div>
            <span className="text-zinc-400 font-medium">原始买入理由 (Alpha)：</span>
            <div className="text-zinc-200 mt-0.5">{plan.alpha}</div>
          </div>
          <div>
            <span className="text-rose-400 font-medium">预设证伪条件 (Broken)：</span>
            <div className="text-zinc-300 mt-0.5">{plan.broken}</div>
          </div>
        </div>

        {/* 3 种选择 */}
        <div className="space-y-2.5">
          <label
            onClick={() => setSelectedStatus('NORMAL')}
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedStatus === 'NORMAL'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200'
                : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${selectedStatus === 'NORMAL' ? 'text-emerald-400' : 'text-zinc-600'}`} />
            <div>
              <div className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                🟢 没有新变化
                <span className="text-xs font-normal text-emerald-400/80">（保持计划，不为短线波动扰乱）</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">产业与催化假设一切如常，坚守持有。</div>
            </div>
          </label>

          <label
            onClick={() => setSelectedStatus('OBSERVING')}
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedStatus === 'OBSERVING'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]'
            }`}
          >
            <HelpCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${selectedStatus === 'OBSERVING' ? 'text-amber-400' : 'text-zinc-600'}`} />
            <div>
              <div className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                🟡 有新信息，但不确定
                <span className="text-xs font-normal text-amber-400/80">（记录并进入观察状态）</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">如行业传闻、部分下游小幅调整等，需密切跟踪。</div>
            </div>
          </label>

          <label
            onClick={() => setSelectedStatus('RE_EVALUATING')}
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedStatus === 'RE_EVALUATING'
                ? 'bg-rose-500/10 border-rose-500/50 text-rose-200'
                : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]'
            }`}
          >
            <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${selectedStatus === 'RE_EVALUATING' ? 'text-rose-400' : 'text-zinc-600'}`} />
            <div>
              <div className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                🔴 原始逻辑可能被证伪
                <span className="text-xs font-normal text-rose-400/80">（触发重估，坚决止损）</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">客观事实发生改变，准备严格执行 Thesis Stop。</div>
            </div>
          </label>
        </div>

        {/* 记录新信息 */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            记录具体事实或跟踪笔记：
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="填写今天注意到的产业链数据、公告、调研反馈（无信息可留空）..."
            rows={3}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* 提交按钮 */}
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
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? '保存中...' : '提交今日核验'}
          </button>
        </div>
      </div>
    </div>
  );
};
