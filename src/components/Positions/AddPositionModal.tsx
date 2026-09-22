// src/components/Positions/AddPositionModal.tsx
import React, { useState } from 'react';
import type { TradePlan } from '../../types';
import { db } from '../../db/database';
import { ADD_POSITION_EVIDENCE_OPTIONS } from '../../utils/disciplineRules';
import { X, ShieldAlert, Check, Plus } from 'lucide-react';

interface AddPositionModalProps {
  plan: TradePlan;
  onClose: () => void;
  onSaved: () => void;
}

export const AddPositionModal: React.FC<AddPositionModalProps> = ({
  plan,
  onClose,
  onSaved,
}) => {
  const [selectedEvidences, setSelectedEvidences] = useState<string[]>([]);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [wouldBuyWithoutPosition, setWouldBuyWithoutPosition] = useState<boolean | null>(null);
  const [addPrice, setAddPrice] = useState<number>(plan.currentPrice || plan.avgEntryPrice || 0);
  const [addPositionPercent, setAddPositionPercent] = useState<number>(5);
  const [saving, setSaving] = useState(false);

  const toggleEvidence = (id: string) => {
    if (selectedEvidences.includes(id)) {
      setSelectedEvidences(selectedEvidences.filter((item) => item !== id));
    } else {
      setSelectedEvidences([...selectedEvidences, id]);
    }
  };

  const handleSave = async () => {
    if (!plan.id) return;
    if (selectedEvidences.length === 0 && !evidenceNote.trim()) {
      alert('加仓必须勾选或提供至少一项客观新增证据！');
      return;
    }
    if (wouldBuyWithoutPosition === null) {
      alert('请先回答灵魂拷问：“如果现在完全没有这只股票，还会在当前价格买入吗？”');
      return;
    }

    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const oldPos = plan.currentPosition || plan.plannedPosition;
      const newPos = oldPos + addPositionPercent;

      // 重新计算加权持仓均价
      const totalCost = (plan.avgEntryPrice * oldPos) + (addPrice * addPositionPercent);
      const newAvgPrice = Number((totalCost / newPos).toFixed(2));

      await db.tradePlans.update(plan.id, {
        currentPosition: newPos,
        avgEntryPrice: newAvgPrice,
        currentPrice: addPrice,
        updatedAt: nowIso,
      });

      // 记录事件
      await db.tradeEvents.add({
        tradeId: plan.id,
        type: 'ADD',
        price: addPrice,
        positionDelta: addPositionPercent,
        addEvidenceTypes: selectedEvidences,
        addAnchorCheckPass: wouldBuyWithoutPosition,
        reason: `【理性加仓】加仓 ${addPositionPercent}% (总仓位 ${newPos}%)，均价更新为 ¥${newAvgPrice}。新增证据：${evidenceNote || selectedEvidences.join(', ')}。${
          !wouldBuyWithoutPosition ? '⚠️ 存在成本锚定倾向（用户知晓后坚持操作）' : '通过无持仓买入自检'
        }`,
        createdAt: nowIso,
      });

      onSaved();
    } catch (e) {
      console.error(e);
      alert('加仓保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="tg-card w-full max-w-xl rounded-2xl p-6 border border-white/10 shadow-2xl relative space-y-5 my-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <Plus className="w-3.5 h-3.5" />
            <span>理性加仓核验门禁</span>
            <span className="text-zinc-600">·</span>
            <span>{plan.symbol} {plan.name}</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            加仓是胜率向好的确认，绝非摊低成本的妥协
          </h3>
        </div>

        {/* 原始预设加仓条件回显 */}
        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-1">
          <div className="text-indigo-300 font-semibold">
            你最初设定的加仓条件 (Continue)：
          </div>
          <div className="text-zinc-200 leading-relaxed font-mono">
            {plan.continueCondition || '（建仓时未录入明确加仓条件）'}
          </div>
        </div>

        {/* 证据勾选 */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            1. 本次加仓是否出现客观新增证据？(必须至少满足一项)
          </label>
          <div className="grid grid-cols-1 gap-2">
            {ADD_POSITION_EVIDENCE_OPTIONS.map((opt) => {
              const isChecked = selectedEvidences.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => toggleEvidence(opt.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                      : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-400 text-black font-bold'
                        : 'border-zinc-600'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3" />}
                  </div>
                  <span>{opt.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 证据描述 */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            2. 本次新增证据具体事实描述 (请务必写出具体数据或事实)：
          </label>
          <textarea
            value={evidenceNote}
            onChange={(e) => setEvidenceNote(e.target.value)}
            placeholder="例如：公司公告第三季度净利润同比增长 45%，北美大客户采购量增加 20 万颗..."
            rows={2}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* 灵魂拷问：破除成本锚定 */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-white/10 space-y-3">
          <div className="text-sm font-bold text-white leading-snug">
            3. 灵魂拷问：如果我现在完全没有这只股票，我还会在当前价格买入吗？
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setWouldBuyWithoutPosition(true)}
              className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                wouldBuyWithoutPosition === true
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'border-white/10 text-zinc-400 hover:bg-white/5'
              }`}
            >
              会（当前逻辑依然具备极高确定性与赔率）
            </button>
            <button
              onClick={() => setWouldBuyWithoutPosition(false)}
              className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                wouldBuyWithoutPosition === false
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'border-white/10 text-zinc-400 hover:bg-white/5'
              }`}
            >
              不会（只是想通过补仓把成本降下来）
            </button>
          </div>

          {/* 成本锚定警告 */}
          {wouldBuyWithoutPosition === false && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs space-y-1.5 animate-fade-in">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>🚨 成本锚定风险警告</span>
              </div>
              <p className="text-rose-200/90 leading-relaxed">
                如果没有持仓你绝对不会买，那么：<strong className="text-white">“因为已经亏损，所以想降低成本”</strong> 本身绝对不是有效的加仓理由！
                这往往是深套巨亏的开端。
              </p>
              <div className="text-[11px] text-zinc-400">
                （TradeGuard 仅作提示，不剥夺您的最终决定权。若仍要加仓，请严格控制本次仓位）
              </div>
            </div>
          )}
        </div>

        {/* 价格与仓位输入 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              加仓买入价格 (¥)
            </label>
            <input
              type="number"
              step="0.01"
              value={addPrice}
              onChange={(e) => setAddPrice(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              加仓比例 (% 账户)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={addPositionPercent}
              onChange={(e) => setAddPositionPercent(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
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
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? '保存中...' : '确认加仓'}
          </button>
        </div>
      </div>
    </div>
  );
};
