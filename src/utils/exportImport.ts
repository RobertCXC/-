// src/utils/exportImport.ts
import { db } from '../db/database';
import type { TradePlan, TradeEvent, DailyReview, AccountSettings } from '../types';

export interface BackupData {
  version: string;
  exportedAt: string;
  tradePlans: TradePlan[];
  tradeEvents: TradeEvent[];
  dailyReviews: DailyReview[];
  settings?: AccountSettings;
}

export async function exportAllDataToJSON(): Promise<void> {
  const tradePlans = await db.tradePlans.toArray();
  const tradeEvents = await db.tradeEvents.toArray();
  const dailyReviews = await db.dailyReviews.toArray();
  const settings = await db.settings.toCollection().first();

  const backup: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    tradePlans,
    tradeEvents,
    dailyReviews,
    settings,
  };

  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(backup, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `TradeGuard_Backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export async function importDataFromJSON(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as BackupData;

        if (!data.tradePlans || !Array.isArray(data.tradePlans)) {
          resolve({ success: false, message: '无效的备份文件：缺少交易计划数据。' });
          return;
        }

        // 覆盖导入
        await db.transaction('rw', [db.tradePlans, db.tradeEvents, db.dailyReviews, db.settings], async () => {
          await db.tradePlans.clear();
          await db.tradeEvents.clear();
          await db.dailyReviews.clear();

          if (data.tradePlans.length > 0) {
            await db.tradePlans.bulkAdd(data.tradePlans);
          }
          if (data.tradeEvents && data.tradeEvents.length > 0) {
            await db.tradeEvents.bulkAdd(data.tradeEvents);
          }
          if (data.dailyReviews && data.dailyReviews.length > 0) {
            await db.dailyReviews.bulkAdd(data.dailyReviews);
          }
          if (data.settings) {
            await db.settings.clear();
            await db.settings.add(data.settings);
          }
        });

        resolve({ success: true, message: `成功导入 ${data.tradePlans.length} 笔交易数据！` });
      } catch (err: unknown) {
        resolve({
          success: false,
          message: `导入失败：${err instanceof Error ? err.message : '未知解析错误'}`,
        });
      }
    };
    reader.readAsText(file);
  });
}

export async function exportTradesToCSV(): Promise<void> {
  const plans = await db.tradePlans.toArray();
  const headers = [
    '交易ID',
    '标的代码',
    '标的名称',
    '交易类型',
    '状态',
    '买入理由(Alpha)',
    '证伪条件(Broken)',
    '加仓条件(Continue)',
    '预期天数',
    '建仓日期',
    '平仓日期',
    '计划价格',
    '平均均价',
    '离场价格',
    '持仓比例(%)',
    '最大允许亏损(%)',
    '账户最大风险(%)',
    '实际财务盈亏(%)',
    '过程质量评级',
    '止损/离场分类',
  ];

  const rows = plans.map((p) => [
    p.id ?? '',
    p.symbol,
    p.name,
    p.tradeType,
    p.status,
    `"${(p.alpha || '').replace(/"/g, '""')}"`,
    `"${(p.broken || '').replace(/"/g, '""')}"`,
    `"${(p.continueCondition || '').replace(/"/g, '""')}"`,
    p.expectedDays,
    p.startDate,
    p.closeDate ?? '',
    p.plannedEntryPrice,
    p.avgEntryPrice,
    p.exitPrice ?? '',
    p.plannedPosition,
    p.maxLossPercent,
    p.maxAccountRisk,
    p.financialResultPercent ?? '',
    p.processResult ?? '',
    p.stopType ?? '',
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `TradeGuard_Trades_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
