// src/components/NewTrade/NewTradeView.tsx
import React, { useState } from 'react';
import type { TradeType, TradePlan, AccountSettings } from '../../types';
import { TRADE_TYPES, TIMEFRAME_PRESETS } from '../../utils/disciplineRules';
import { calculateAccountRisk } from '../../utils/riskCalculator';
import { db } from '../../db/database';
import { format, addDays } from 'date-fns';
import { FomoCoolDownModal } from './FomoCoolDownModal';
import { FinalConfirmationModal } from './FinalConfirmationModal';
import {
  PlusCircle,
  Flame,
  ShieldAlert,
  ArrowRight,
  Clock,
  Check,
} from 'lucide-react';

interface NewTradeViewProps {
  settings: AccountSettings;
  onTradeCreated: (newPlanId: number) => void;
}

export const NewTradeView: React.FC<NewTradeViewProps> = ({
  settings,
  onTradeCreated,
}) => {
  // Step 1: 类型
  const [tradeType, setTradeType] = useState<TradeType>('A');

  // Step 2: 标的与 ABCT
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [alpha, setAlpha] = useState('');
  const [broken, setBroken] = useState('');
  const [continueCondition, setContinueCondition] = useState('');
  const [timeframePreset, setTimeframePreset] = useState('3_MONTHS');
  const [customDays, setCustomDays] = useState(30);

  // Step 3: 仓位与风控
  const [plannedEntryPrice, setPlannedEntryPrice] = useState<number>(20.0);
  const [plannedPosition, setPlannedPosition] = useState<number>(10);
  const [maxLossPercent, setMaxLossPercent] = useState<number>(8);
  const [tagsInput, setTagsInput] = useState('');
  const [isFomoTriggered, setIsFomoTriggered] = useState(false);

  // 模态框状态
  const [showFomoModal, setShowFomoModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [fomoAnswers, setFomoAnswers] = useState<TradePlan['fomoAnswers']>();
  const [submitting, setSubmitting] = useState(false);

  // 计算预期验证天数与截止日
  const presetObj = TIMEFRAME_PRESETS.find((p) => p.id === timeframePreset);
  const effectiveDays = timeframePreset === 'CUSTOM' ? customDays : (presetObj?.days || 30);
  const startDateStr = format(new Date(), 'yyyy-MM-dd');
  const expectedEndDateStr = format(addDays(new Date(), effectiveDays), 'yyyy-MM-dd');

  // 计算单笔账户最大风险
  const currentAccountRisk = calculateAccountRisk(plannedPosition, maxLossPercent);
  const isOverRisk = currentAccountRisk > settings.maxSingleRiskPercent;

  const currentTypeInfo = TRADE_TYPES[tradeType];

  // 快捷切换交易类型时提供智能默认验证周期
  const handleTypeSelect = (type: TradeType) => {
    setTradeType(type);
    if (type === 'A') {
      setTimeframePreset('3_MONTHS');
    } else if (type === 'B') {
      setTimeframePreset('2_WEEKS');
    } else if (type === 'C') {
      setTimeframePreset('3_DAYS');
    }
  };

  const handleStartReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !symbol.trim()) {
      alert('请填写标的名称与股票代码');
      return;
    }
    if (!alpha.trim() || !broken.trim() || !continueCondition.trim()) {
      alert('ABCT 模型中的 Alpha(理由)、Broken(证伪) 与 Continue(加仓条件) 必须全部完整填写！');
      return;
    }

    // 检查是否包含追涨关键词或勾选了 FOMO
    const textCorpus = `${alpha} ${broken}`.toLowerCase();
    const isImpulseKeywords = ['追涨', '大涨', '涨停', '热点', '盘面急拉', '连板', 'fomo'].some(
      (kw) => textCorpus.includes(kw)
    );

    if (isFomoTriggered || isImpulseKeywords) {
      setShowFomoModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleFomoPassed = (answers: NonNullable<TradePlan['fomoAnswers']>) => {
    setFomoAnswers(answers);
    setShowFomoModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const tags = tagsInput
        .split(/[,，\s]+/)
        .filter(Boolean)
        .concat([currentTypeInfo.name]);

      const planToInsert: Omit<TradePlan, 'id'> = {
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        tradeType,
        alpha: alpha.trim(),
        broken: broken.trim(),
        continueCondition: continueCondition.trim(),
        timeframePreset,
        startDate: startDateStr,
        expectedEndDate: expectedEndDateStr,
        expectedDays: effectiveDays,
        plannedEntryPrice,
        plannedPosition,
        maxLossPercent,
        maxAccountRisk: currentAccountRisk,
        avgEntryPrice: plannedEntryPrice,
        currentPrice: plannedEntryPrice,
        currentPosition: plannedPosition,
        isUnplanned: isFomoTriggered,
        isFomo: isFomoTriggered,
        fomoAnswers,
        tags: Array.from(new Set(tags)),
        status: 'ACTIVE',
        dailyStatus: 'NORMAL',
        lastDailyCheckDate: startDateStr,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const newId = await db.tradePlans.add(planToInsert as TradePlan);

      // 添加建仓与首次买入事件
      await db.tradeEvents.bulkAdd([
        {
          tradeId: newId,
          type: 'PLAN_CREATED',
          reason: `确立【${currentTypeInfo.name}】交易计划，预期验证周期 ${effectiveDays} 天，最大承受风险 ${currentAccountRisk}%`,
          createdAt: nowIso,
        },
        {
          tradeId: newId,
          type: 'BUY',
          price: plannedEntryPrice,
          positionDelta: plannedPosition,
          reason: `按计划首次建仓 ${plannedPosition}% 仓位，买入价格 ¥${plannedEntryPrice}`,
          createdAt: nowIso,
        },
      ]);

      setShowConfirmModal(false);
      onTradeCreated(newId);
    } catch (err) {
      console.error(err);
      alert('创建交易计划失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* 顶部标题 */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
          <PlusCircle className="w-4 h-4" />
          <span>结构化建仓</span>
          <span className="text-zinc-600">·</span>
          <span>ABCT 纪律框架</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          新建交易计划 · 建立属于你的阿尔法假设
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          在按下买入键前，把逻辑、证伪事实、加仓条件与时间尺度全部白纸黑字写下来。
        </p>
      </div>

      <form onSubmit={handleStartReview} className="space-y-6">
        {/* Step 1: 交易类型 (PRD Section 7) */}
        <div className="tg-card rounded-2xl p-5 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">
              Step 1 · 选择交易类型
            </span>
            <span className="text-[11px] text-zinc-500">
              不同交易类型对应完全不同的时间尺度与考核逻辑
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['A', 'B', 'C'] as TradeType[]).map((type) => {
              const info = TRADE_TYPES[type];
              const isSelected = tradeType === type;
              return (
                <div
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-white/10 text-zinc-300'
                      }`}>
                        {type}
                      </span>
                      {info.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className="text-xs text-zinc-300 font-medium mb-1">
                    {info.subTitle}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    典型周期：{info.typicalTimeframe}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 选中类型的默认规则提示 */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-400 space-y-1">
            <div className="text-zinc-300 font-medium flex items-center gap-1.5">
              <span>【{currentTypeInfo.name}】核心检查规则：</span>
            </div>
            <ul className="list-disc list-inside text-zinc-400 space-y-0.5 text-[11px]">
              {currentTypeInfo.defaultChecks.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Step 2: ABCT 交易计划 (PRD Section 8) */}
        <div className="tg-card rounded-2xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">
              Step 2 · 录入 ABCT 计划假说
            </span>
            <span className="text-[11px] text-zinc-500">
              每一笔交易必须具备完整严密的逻辑闭环
            </span>
          </div>

          {/* 标的信息 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                标的名称 *
              </label>
              <input
                type="text"
                required
                placeholder="例如：西部数据、中际旭创"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                标的代码 *
              </label>
              <input
                type="text"
                required
                placeholder="例如：WDC, 300308, 600519"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* A: Alpha */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-indigo-300 flex items-center justify-between">
              <span>A — Alpha: 我赚的是什么钱？我买入这只股票，因为：*</span>
              <span className="text-[10px] text-zinc-500 font-normal">尽量一句话讲清底层因果</span>
            </label>
            <textarea
              required
              rows={2}
              value={alpha}
              onChange={(e) => setAlpha(e.target.value)}
              placeholder="例如：北美 AI 数据中心扩建导致大容量 Nearline HDD 供需缺口扩大，季度产品价格进入上涨大周期..."
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* B: Broken */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-rose-300 flex items-center justify-between">
              <span>B — Broken: 什么事实发生，证明我的判断错了？*</span>
              <span className="text-[10px] text-rose-400/90 font-normal">
                ❌ “股票跌了 5%”不是产业逻辑证伪
              </span>
            </label>
            <textarea
              required
              rows={2}
              value={broken}
              onChange={(e) => setBroken(e.target.value)}
              placeholder="例如：HDD 现货价格环比停止上涨开始下跌；或云厂商资本开支指引调降；或竞对大幅扩产打破供需平衡..."
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 leading-relaxed"
            />
          </div>

          {/* C: Continue */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-emerald-300 flex items-center justify-between">
              <span>C — Continue: 什么新增证据出现，我才允许加仓？*</span>
              <span className="text-[10px] text-zinc-500 font-normal">绝非因亏损浮亏补仓</span>
            </label>
            <textarea
              required
              rows={2}
              value={continueCondition}
              onChange={(e) => setContinueCondition(e.target.value)}
              placeholder="例如：季度财报公布毛利率环比提升 300bps；或行业出货量数据超预期；或大客户签订长期供货协议..."
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* T: Time */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-sky-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                T — Time: 预计这个逻辑多久应该被市场验证？*
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                从 {startDateStr} 至 {expectedEndDateStr} (共 {effectiveDays} 天)
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIMEFRAME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setTimeframePreset(preset.id)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                    timeframePreset === preset.id
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {timeframePreset === 'CUSTOM' && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-zinc-400">自定义验证天数：</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                  className="w-24 rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-zinc-500">天</span>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: 仓位与风控 (PRD Section 9) */}
        <div className="tg-card rounded-2xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">
              Step 3 · 仓位与风控计算
            </span>
            <span className="text-[11px] text-zinc-500">
              仓位是风险的结果，不是信心的表达
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                计划买入价格 (¥)
              </label>
              <input
                type="number"
                step="0.01"
                value={plannedEntryPrice}
                onChange={(e) => setPlannedEntryPrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                计划仓位占账户比 (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={plannedPosition}
                onChange={(e) => setPlannedPosition(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                最大允许单只损失 (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxLossPercent}
                onChange={(e) => setMaxLossPercent(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 账户风险公式展示 */}
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-zinc-400">
                账户风险测算公式：仓位 ({plannedPosition}%) × 价格最大亏损 ({maxLossPercent}%)
              </span>
              <div className="text-[11px] text-zinc-500">
                设定单笔风控上限：{settings.maxSingleRiskPercent}%
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-zinc-400">本次交易对账户最大冲击：</span>
              <span
                className={`text-xl font-bold font-mono ${
                  isOverRisk ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {currentAccountRisk}%
              </span>
            </div>
          </div>

          {isOverRisk && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>
                警告：当前设定的单笔账户风险 ({currentAccountRisk}%) 已超过全局风控阈值 ({settings.maxSingleRiskPercent}%)。建议调小仓位比例。
              </span>
            </div>
          )}

          {/* 标签 & FOMO 勾选 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                分类标签（逗号或空格分隔）
              </label>
              <input
                type="text"
                placeholder="例如：AI算力, 行业反转, 龙头"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <label
                onClick={() => setIsFomoTriggered(!isFomoTriggered)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isFomoTriggered
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]'
                }`}
              >
                <Flame className={`w-4 h-4 ${isFomoTriggered ? 'text-amber-400' : 'text-zinc-600'}`} />
                <div className="text-xs">
                  <div className="font-semibold text-zinc-200">
                    标的盘面正在大涨 / 我有追涨情绪
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    勾选将自动激活 30 秒冷静器与灵魂拷问
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-xl shadow-indigo-600/25 transition-all active:scale-95"
          >
            <span>进入买入前自省核验</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* FOMO 冷却弹窗 */}
      {showFomoModal && (
        <FomoCoolDownModal
          onPass={handleFomoPassed}
          onCancel={() => setShowFomoModal(false)}
        />
      )}

      {/* 最终 4 问确认弹窗 */}
      {showConfirmModal && (
        <FinalConfirmationModal
          planData={{
            name,
            symbol,
            tradeType,
            plannedPosition,
            expectedDays: effectiveDays,
            expectedEndDate: expectedEndDateStr,
            maxAccountRisk: currentAccountRisk,
          }}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirmModal(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
};
