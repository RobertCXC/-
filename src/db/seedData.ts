// src/db/seedData.ts
import { db, DEFAULT_SETTINGS } from './database';
import { format, subDays } from 'date-fns';

export async function seedInitialData(force = false): Promise<void> {
  const count = await db.tradePlans.count();
  if (count > 0 && !force) {
    return;
  }

  if (force) {
    await db.tradePlans.clear();
    await db.tradeEvents.clear();
    await db.dailyReviews.clear();
    await db.settings.clear();
  }

  // 1. 设置
  await db.settings.add({ ...DEFAULT_SETTINGS });

  const today = new Date();
  const d = (daysAgo: number) => format(subDays(today, daysAgo), 'yyyy-MM-dd');
  const dt = (daysAgo: number, timeStr = '10:30:00') => `${d(daysAgo)} ${timeStr}`;

  // 2. 标的 1: 西部数据 (WDC) - A 产业预期 (正常持有中，18天)
  const p1Id = await db.tradePlans.add({
    symbol: 'WDC',
    name: '西部数据',
    tradeType: 'A',
    alpha: 'HDD 供需持续改善，AI 数据中心扩建带动 Nearline 大容量硬盘需求进入超级景气周期。',
    broken: 'Nearline HDD 价格出现环比下跌，或北美四大云厂商季度资本开支指引出现负增长。',
    continueCondition: '行业季度价格继续环比上涨 5% 以上，且公司财报毛利率超预期验证。',
    timeframePreset: '3_MONTHS',
    startDate: d(18),
    expectedEndDate: format(subDays(today, -72), 'yyyy-MM-dd'),
    expectedDays: 90,
    plannedEntryPrice: 65.5,
    plannedPosition: 15,
    maxLossPercent: 8,
    maxAccountRisk: 1.2,
    avgEntryPrice: 65.2,
    currentPrice: 71.8,
    currentPosition: 15,
    tags: ['存储', 'AI硬件', '产业预期'],
    status: 'ACTIVE',
    dailyStatus: 'NORMAL',
    lastDailyCheckDate: d(0),
    createdAt: dt(18, '09:30:00'),
    updatedAt: dt(0, '15:00:00'),
  });

  await db.tradeEvents.bulkAdd([
    {
      tradeId: p1Id,
      type: 'PLAN_CREATED',
      reason: '确立 3 个月 HDD 产业复苏周期逻辑，计划建仓 15%，最大亏损承受 8%',
      createdAt: dt(18, '09:30:00'),
    },
    {
      tradeId: p1Id,
      type: 'BUY',
      price: 65.2,
      positionDelta: 15,
      reason: '首次建立底仓 15%，逻辑契合北美云资本开支预期',
      createdAt: dt(18, '10:15:00'),
    },
    {
      tradeId: p1Id,
      type: 'INFO',
      reason: '每日检查：行业调研显示希捷与西数大容量产品排期已到下季度末，逻辑持续强化。',
      createdAt: dt(5, '15:30:00'),
    },
  ]);

  // 3. 标的 2: 中际旭创 (300308) - A 产业预期 (刚持有 4 天，短线价格 -3.5%，触发时间尺度错配提醒)
  const p2Id = await db.tradePlans.add({
    symbol: '300308',
    name: '中际旭创',
    tradeType: 'A',
    alpha: '北美云巨头 1.6T 光模块提前规模化部署，作为全球第一梯队核心供应商深度受益。',
    broken: '硅光方案良率断崖式下滑，或者英伟达 Blackwell 架构出货延期导致光模块砍单。',
    continueCondition: '加单确认或三季报出货量环比激增 30% 以上。',
    timeframePreset: '3_MONTHS',
    startDate: d(4),
    expectedEndDate: format(subDays(today, -86), 'yyyy-MM-dd'),
    expectedDays: 90,
    plannedEntryPrice: 158.0,
    plannedPosition: 12,
    maxLossPercent: 10,
    maxAccountRisk: 1.2,
    avgEntryPrice: 157.5,
    currentPrice: 152.0, // 短线价格下跌 3.5%
    currentPosition: 12,
    tags: ['算力', 'CPO', '光模块'],
    status: 'ACTIVE',
    dailyStatus: 'NORMAL',
    lastDailyCheckDate: d(0),
    createdAt: dt(4, '09:40:00'),
    updatedAt: dt(0, '15:00:00'),
  });

  await db.tradeEvents.bulkAdd([
    {
      tradeId: p2Id,
      type: 'PLAN_CREATED',
      reason: '建立 90 天产业验证交易计划，计划仓位 12%',
      createdAt: dt(4, '09:40:00'),
    },
    {
      tradeId: p2Id,
      type: 'BUY',
      price: 157.5,
      positionDelta: 12,
      reason: '买入 12% 仓位',
      createdAt: dt(4, '10:00:00'),
    },
  ]);

  // 4. 标的 3: 拓维信息 (002261) - C 趋势情绪 (超期警告！原计划 3 天，现已第 5 天，短线变长线危险)
  const p3Id = await db.tradePlans.add({
    symbol: '002261',
    name: '拓维信息',
    tradeType: 'C',
    alpha: '华为昇腾生态板块首板放量启动，资金大幅净流入，博弈 1-3 天情绪惯性冲高。',
    broken: '开盘不及预期竞价弱于板块均值，或跌破前一日涨停实体阳线底部。',
    continueCondition: '板块早盘继续分歧转一致放量冲板。',
    timeframePreset: '3_DAYS',
    startDate: d(5),
    expectedEndDate: d(2), // 2 天前就该结束了！
    expectedDays: 3,
    plannedEntryPrice: 16.8,
    plannedPosition: 10,
    maxLossPercent: 5,
    maxAccountRisk: 0.5,
    avgEntryPrice: 16.9,
    currentPrice: 15.6, // 亏损 7.7%
    currentPosition: 10,
    tags: ['情绪博弈', '华为算力', '短线'],
    status: 'ACTIVE',
    dailyStatus: 'OBSERVING',
    lastDailyCheckDate: d(0),
    createdAt: dt(5, '09:35:00'),
    updatedAt: dt(0, '15:00:00'),
  });

  await db.tradeEvents.bulkAdd([
    {
      tradeId: p3Id,
      type: 'PLAN_CREATED',
      reason: '3 日短线情绪打板博弈，计划仓位 10%',
      createdAt: dt(5, '09:35:00'),
    },
    {
      tradeId: p3Id,
      type: 'BUY',
      price: 16.9,
      positionDelta: 10,
      reason: '按情绪启动点打入 10% 仓位',
      createdAt: dt(5, '09:45:00'),
    },
  ]);

  // 5. 标的 4: 许继电气 (000400) - 已平仓 [好交易 + 亏钱]
  // 严格执行 Thesis Stop (逻辑止损)，虽亏损 4.2%，但过程质量优秀！
  const p4Id = await db.tradePlans.add({
    symbol: '000400',
    name: '许继电气',
    tradeType: 'A',
    alpha: '国网特高压设备新一轮集中招标放量，主网设备单瓦价值量提升。',
    broken: '国网第二批集招中特高压断路器招标份额大幅下调。',
    continueCondition: '中标金额与份额超预期公示。',
    timeframePreset: '1_MONTH',
    startDate: d(25),
    expectedEndDate: d(5),
    expectedDays: 30,
    plannedEntryPrice: 28.5,
    plannedPosition: 10,
    maxLossPercent: 6,
    maxAccountRisk: 0.6,
    avgEntryPrice: 28.4,
    currentPrice: 27.2,
    currentPosition: 0,
    tags: ['特高压', '电网', '产业逻辑'],
    status: 'CLOSED',
    closeDate: d(6),
    exitPrice: 27.2,
    financialResultPercent: -4.2,
    financialAmount: -420,
    processResult: 'EXCELLENT', // 好交易！
    stopType: 'THESIS_STOP',    // 逻辑止损
    exitReason: '国网第二批集招公示，特高压招标数量未见增长，原始产业驱动力被证伪，坚决平仓。',
    createdAt: dt(25, '09:30:00'),
    updatedAt: dt(6, '14:30:00'),
  });

  await db.tradeEvents.bulkAdd([
    {
      tradeId: p4Id,
      type: 'PLAN_CREATED',
      reason: '建立特高压集招预期计划',
      createdAt: dt(25, '09:30:00'),
    },
    {
      tradeId: p4Id,
      type: 'BUY',
      price: 28.4,
      positionDelta: 10,
      reason: '底仓建立 10%',
      createdAt: dt(25, '10:00:00'),
    },
    {
      tradeId: p4Id,
      type: 'SELL',
      price: 27.2,
      positionDelta: -10,
      reason: '【逻辑止损 Thesis Stop】国网中标结果不及预期，事实证伪买入假设，理性斩仓离场。好交易+亏损。',
      stopType: 'THESIS_STOP',
      processResult: 'EXCELLENT',
      createdAt: dt(6, '14:30:00'),
    },
  ]);

  // 6. 标的 5: 某某重工 (600xxx) - 已平仓 [坏交易 + 赚钱]
  // FOMO追涨，无严密计划，次日运气好大涨抛掉，盈利 11.5%，但过程质量严重违规！
  const p5Id = await db.tradePlans.add({
    symbol: '600031',
    name: '三一重工',
    tradeType: 'C',
    alpha: '午后看到工程机械板块突发异动拉升大阳线，害怕踏空直接挂单市价追入。',
    broken: '跌破均线。',
    continueCondition: '无。',
    timeframePreset: '3_DAYS',
    startDate: d(12),
    expectedEndDate: d(9),
    expectedDays: 3,
    plannedEntryPrice: 17.2,
    plannedPosition: 15,
    maxLossPercent: 4,
    maxAccountRisk: 0.6,
    avgEntryPrice: 17.4,
    currentPrice: 19.4,
    currentPosition: 0,
    isUnplanned: true,
    isFomo: true,
    tags: ['FOMO追涨', '冲动交易'],
    status: 'CLOSED',
    closeDate: d(10),
    exitPrice: 19.4,
    financialResultPercent: 11.5,
    financialAmount: 1725,
    processResult: 'SEVERE_VIOLATION', // 坏交易！
    stopType: 'PROFIT_TAKE',
    exitReason: '次日运气好冲高 6 个点，由于心里发虚且本来就是冲动买入，尾盘全清。',
    exitViolations: ['FOMO追涨', '计划外临时交易', '无明确证伪逻辑'],
    createdAt: dt(12, '14:15:00'),
    updatedAt: dt(10, '14:50:00'),
  });

  await db.tradeEvents.bulkAdd([
    {
      tradeId: p5Id,
      type: 'BUY',
      price: 17.4,
      positionDelta: 15,
      reason: '【FOMO】看盘面急拉害怕错过，临时起意追涨 15% 仓位',
      createdAt: dt(12, '14:15:00'),
    },
    {
      tradeId: p5Id,
      type: 'SELL',
      price: 19.4,
      positionDelta: -15,
      reason: '【侥幸获利】运气好次日冲高止盈。不要用结果替行为辩护，本质属于严重纪律违规！',
      processResult: 'SEVERE_VIOLATION',
      createdAt: dt(10, '14:50:00'),
    },
  ]);

  // 7. 历史每日复盘记录
  await db.dailyReviews.bulkAdd([
    {
      date: d(1),
      unplannedTrade: false,
      timeframeMismatch: false,
      shortToLong: true, // 拓维信息短线变长线
      emotionalAdd: false,
      fomo: false,
      worstTradeId: p3Id,
      worstTradeSymbol: '002261',
      worstTradeName: '拓维信息',
      problemType: 'TIMEFRAME_ERROR',
      notes: '拓维信息原本是 3 天情绪博弈，跌破预期后没有果断离场，反而拖延到了第 5 天。必须时刻警惕短线被套改长线的坏习惯！',
      createdAt: dt(1, '16:00:00'),
    },
    {
      date: d(6),
      unplannedTrade: false,
      timeframeMismatch: false,
      shortToLong: false,
      emotionalAdd: false,
      fomo: false,
      worstTradeId: p4Id,
      worstTradeSymbol: '000400',
      worstTradeName: '许济电气',
      problemType: 'NORMAL_LOSS',
      notes: '虽然许继电气亏了 4.2%，但是国网集招证伪了逻辑之后果断走人，这是教科书级的好交易！守住了纪律，控制了亏损。',
      createdAt: dt(6, '16:10:00'),
    },
  ]);
}
