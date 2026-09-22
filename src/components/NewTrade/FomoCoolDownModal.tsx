// src/components/NewTrade/FomoCoolDownModal.tsx
import React, { useState, useEffect } from 'react';
import { Flame, CheckCircle2, Clock } from 'lucide-react';

interface FomoCoolDownModalProps {
  onPass: (fomoAnswers: {
    q1NoRiseStillBuy: boolean;
    q2ExpectationOrCandle: 'FUTURE' | 'CANDLE' | 'UNSURE';
    q3MissImpact: string;
  }) => void;
  onCancel: () => void;
}

export const FomoCoolDownModal: React.FC<FomoCoolDownModalProps> = ({
  onPass,
  onCancel,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [q1, setQ1] = useState<boolean | null>(null);
  const [q2, setQ2] = useState<'FUTURE' | 'CANDLE' | 'UNSURE'>('FUTURE');
  const [q3, setQ3] = useState('');

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const canProceed = secondsLeft === 0 && q1 !== null && q3.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="tg-card w-full max-w-xl rounded-2xl p-6 border border-amber-500/30 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-300">
                FOMO 情绪冷静器（30 秒自律冷却）
              </h3>
              <p className="text-xs text-zinc-400">
                检测到追涨或盘面脉冲信号，请强迫大脑从多巴胺兴奋回归前额叶理性。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
            <Clock className="w-4 h-4" />
            <span>{secondsLeft > 0 ? `${secondsLeft}s` : '冷却完毕'}</span>
          </div>
        </div>

        {/* 3 个灵魂拷问 */}
        <div className="space-y-4 text-xs">
          {/* Q1 */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <div className="font-semibold text-zinc-200">
              Q1. 如果今天它没有上涨甚至微跌，你还会想买它吗？
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQ1(true)}
                className={`py-2 rounded-lg font-medium border transition-all ${
                  q1 === true
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'border-white/10 text-zinc-400 hover:bg-white/5'
                }`}
              >
                YES，我买的是底层逻辑，无论今天涨跌
              </button>
              <button
                type="button"
                onClick={() => setQ1(false)}
                className={`py-2 rounded-lg font-medium border transition-all ${
                  q1 === false
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : 'border-white/10 text-zinc-400 hover:bg-white/5'
                }`}
              >
                NO，主要是被今天的分时冲高吸引了
              </button>
            </div>
          </div>

          {/* Q2 */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <div className="font-semibold text-zinc-200">
              Q2. 你现在买的到底是什么？
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'FUTURE', label: '未来客观确定预期' },
                { id: 'CANDLE', label: '今天这根大阳线刺激' },
                { id: 'UNSURE', label: '心里其实并不确定' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setQ2(opt.id as any)}
                  className={`py-2 px-1 rounded-lg font-medium border text-center transition-all ${
                    q2 === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'border-white/10 text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q3 */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
            <div className="font-semibold text-zinc-200">
              Q3. 如果今天完全错过它，对你的账户有什么致命影响？
            </div>
            <textarea
              value={q3}
              onChange={(e) => setQ3(e.target.value)}
              placeholder="写下一句话：比如'毫无实质影响，市场每天都有机会，保住本金比踏空更重要'..."
              rows={2}
              className="w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* 底部倒计时与操作 */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            我决定放弃本次冲动交易（守住防线）
          </button>

          <button
            type="button"
            disabled={!canProceed}
            onClick={() => {
              if (canProceed) {
                onPass({
                  q1NoRiseStillBuy: q1!,
                  q2ExpectationOrCandle: q2,
                  q3MissImpact: q3,
                });
              }
            }}
            className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              canProceed
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 active:scale-95'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {secondsLeft > 0 ? (
              <span>请强制冷静 ({secondsLeft}s)</span>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>冷静完毕，确认继续买入</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
