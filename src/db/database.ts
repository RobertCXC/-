// src/db/database.ts
import Dexie, { type Table } from 'dexie';
import type { TradePlan, TradeEvent, DailyReview, AccountSettings } from '../types';

export class TradeGuardDatabase extends Dexie {
  tradePlans!: Table<TradePlan, number>;
  tradeEvents!: Table<TradeEvent, number>;
  dailyReviews!: Table<DailyReview, number>;
  settings!: Table<AccountSettings, number>;

  constructor() {
    super('TradeGuardDB');
    this.version(1).stores({
      tradePlans: '++id, symbol, name, tradeType, status, startDate, expectedEndDate, createdAt, dailyStatus',
      tradeEvents: '++id, tradeId, type, createdAt',
      dailyReviews: '++id, date, createdAt',
      settings: '++id',
    });
  }
}

export const db = new TradeGuardDatabase();

export const DEFAULT_SETTINGS: AccountSettings = {
  totalCapital: 100000,
  maxSingleRiskPercent: 2.0,      // 单笔最大风险 2%
  maxDailyLossPercent: 3.0,       // 单日最大亏损 3%
  maxWeeklyDrawdownPercent: 6.0,  // 单周最大回撤 6%
  maxConsecutiveLosses: 3,        // 连续 3 笔亏损熔断
  maxConsecutiveUnplanned: 2,     // 连续 2 笔计划外交易熔断
  fomoCooldownSeconds: 30,        // FOMO 冷静 30 秒
  theme: 'dark',
  updatedAt: new Date().toISOString(),
};

// 初始化或获取当前设置
export async function getSettings(): Promise<AccountSettings> {
  const existing = await db.settings.toCollection().first();
  if (existing) {
    return existing;
  }
  const id = await db.settings.add({ ...DEFAULT_SETTINGS });
  return { ...DEFAULT_SETTINGS, id };
}

export async function updateSettings(newSettings: Partial<AccountSettings>): Promise<void> {
  const current = await getSettings();
  if (current.id) {
    await db.settings.update(current.id, {
      ...newSettings,
      updatedAt: new Date().toISOString(),
    });
  }
}
