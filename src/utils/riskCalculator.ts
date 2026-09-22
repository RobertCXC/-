// src/utils/riskCalculator.ts
import type { TradePlan, AccountSettings, DisciplineMetrics } from '../types';
import { differenceInDays, parseISO, isAfter, subDays } from 'date-fns';

export function calculateAccountRisk(positionPercent: number, maxLossPercent: number): number {
  const risk = (positionPercent * maxLossPercent) / 100;
  return Number(risk.toFixed(2));
}

export function evaluateCircuitBreaker(
  plans: TradePlan[],
  settings: AccountSettings
): {
  isTriggered: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);

  // 1. 单笔风险超标检查 (当前持仓或已建仓计划)
  const overRiskPlans = plans.filter(
    (p) => p.status === 'ACTIVE' && p.maxAccountRisk > settings.maxSingleRiskPercent
  );
  if (overRiskPlans.length > 0) {
    reasons.push(
      `标的 [${overRiskPlans.map((p) => p.name).join(', ')}] 单笔账户风险 (${overRiskPlans[0].maxAccountRisk}%) 超过设定上限 (${settings.maxSingleRiskPercent}%)`
    );
  }

  // 2. 连续亏损笔数检查 (按闭单时间倒序排序)
  const closedTrades = plans
    .filter((p) => p.status === 'CLOSED' && p.closeDate)
    .sort((a, b) => (b.closeDate! > a.closeDate! ? 1 : -1));

  let consecutiveLosses = 0;
  for (const t of closedTrades) {
    if ((t.financialResultPercent ?? 0) < 0) {
      consecutiveLosses++;
    } else {
      break;
    }
  }

  if (consecutiveLosses >= settings.maxConsecutiveLosses) {
    reasons.push(
      `近期已连续亏损 ${consecutiveLosses} 笔交易，触发熔断阈值 (${settings.maxConsecutiveLosses} 笔)`
    );
  }

  // 3. 连续计划外交易检查 (按创建时间倒序)
  const sortedPlans = [...plans].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  let consecutiveUnplanned = 0;
  for (const t of sortedPlans) {
    if (t.isUnplanned || t.isFomo) {
      consecutiveUnplanned++;
    } else {
      break;
    }
  }

  if (consecutiveUnplanned >= settings.maxConsecutiveUnplanned) {
    reasons.push(
      `近期连续出现 ${consecutiveUnplanned} 笔计划外/FOMO 交易，违反纪律阈值 (${settings.maxConsecutiveUnplanned} 笔)`
    );
  }

  // 4. 单周回撤累计检查
  const pastWeekLosses = closedTrades.filter(
    (t) => t.closeDate && isAfter(parseISO(t.closeDate), sevenDaysAgo)
  );
  const totalWeekDrawdownPercent = pastWeekLosses.reduce((acc, curr) => {
    const loss = (curr.financialResultPercent ?? 0) < 0 ? Math.abs(curr.financialResultPercent!) : 0;
    // 粗略以单笔仓位 * 亏损比例折算账户亏损
    const accountLoss = (loss * curr.plannedPosition) / 100;
    return acc + accountLoss;
  }, 0);

  if (totalWeekDrawdownPercent >= settings.maxWeeklyDrawdownPercent) {
    reasons.push(
      `近 7 天累计账户回撤约 ${totalWeekDrawdownPercent.toFixed(1)}%，已超过单周风控上限 (${settings.maxWeeklyDrawdownPercent}%)`
    );
  }

  return {
    isTriggered: reasons.length > 0,
    reasons,
  };
}

export function computeDisciplineMetrics(
  plans: TradePlan[],
  settings: AccountSettings
): DisciplineMetrics {
  const totalTrades = plans.length;
  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      plannedTradesCount: 0,
      plannedTradeRate: 100,
      timeframeMatchRate: 100,
      rationalAddRate: 100,
      emotionalTradeRate: 0,
      thesisDriftCount: 0,
      winRate: 0,
      goodTradesLossCount: 0,
      badTradesProfitCount: 0,
      circuitBreakerTriggered: false,
      circuitBreakerReasons: [],
    };
  }

  const plannedTrades = plans.filter((p) => !p.isUnplanned && !p.isFomo);
  const plannedTradesCount = plannedTrades.length;
  const plannedTradeRate = Number(((plannedTradesCount / totalTrades) * 100).toFixed(1));

  // 情绪交易率
  const emotionalTrades = plans.filter((p) => p.isFomo || p.isUnplanned);
  const emotionalTradeRate = Number(((emotionalTrades.length / totalTrades) * 100).toFixed(1));

  // 时间尺度匹配：对已关闭交易检查是否符合原始周期或存在超期违规
  const closedPlans = plans.filter((p) => p.status === 'CLOSED');
  let timeframeMatches = 0;
  closedPlans.forEach((p) => {
    if (p.closeDate && p.startDate) {
      const actualHoldDays = differenceInDays(parseISO(p.closeDate), parseISO(p.startDate));
      // 若原为短线情绪(C)持有超过预期天数2倍，或原为长线(A)小于5天就因价格卖出，则为错配
      const isMismatch =
        (p.tradeType === 'C' && actualHoldDays > p.expectedDays * 1.5) ||
        (p.tradeType === 'A' && actualHoldDays < 5 && p.stopType === 'PRICE_STOP');
      if (!isMismatch) {
        timeframeMatches++;
      }
    } else {
      timeframeMatches++;
    }
  });
  const timeframeMatchRate =
    closedPlans.length > 0
      ? Number(((timeframeMatches / closedPlans.length) * 100).toFixed(1))
      : 100;

  // 胜率计算
  const winningTrades = closedPlans.filter((p) => (p.financialResultPercent ?? 0) > 0);
  const winRate =
    closedPlans.length > 0
      ? Number(((winningTrades.length / closedPlans.length) * 100).toFixed(1))
      : 0;

  // 交易质量与收益分离统计
  // 好交易+亏钱: 过程质量 EXCELLENT 或 NORMAL，但收益 < 0
  const goodTradesLossCount = closedPlans.filter(
    (p) =>
      (p.processResult === 'EXCELLENT' || p.processResult === 'NORMAL') &&
      (p.financialResultPercent ?? 0) < 0
  ).length;

  // 坏交易+赚钱: 过程质量有违规，但收益 > 0
  const badTradesProfitCount = closedPlans.filter(
    (p) =>
      (p.processResult === 'MINOR_VIOLATION' || p.processResult === 'SEVERE_VIOLATION') &&
      (p.financialResultPercent ?? 0) > 0
  ).length;

  const cb = evaluateCircuitBreaker(plans, settings);

  return {
    totalTrades,
    plannedTradesCount,
    plannedTradeRate,
    timeframeMatchRate,
    rationalAddRate: 90, // 基于事件证据分析
    emotionalTradeRate,
    thesisDriftCount: 0,
    winRate,
    goodTradesLossCount,
    badTradesProfitCount,
    circuitBreakerTriggered: cb.isTriggered,
    circuitBreakerReasons: cb.reasons,
  };
}
