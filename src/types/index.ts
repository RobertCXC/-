// src/types/index.ts

export type TradeType = 'A' | 'B' | 'C';

export interface TradeTypeInfo {
  type: TradeType;
  name: string;
  subTitle: string;
  examples: string[];
  typicalTimeframe: string;
  defaultChecks: string[];
  description: string;
}

export type TradeStatus = 'ACTIVE' | 'CLOSED' | 'CANCELLED';

export interface TradePlan {
  id?: number;
  symbol: string;           // 股票代码, e.g. "600519" or "WDC"
  name: string;             // 股票名称, e.g. "西部数据"
  tradeType: TradeType;     // A: 产业预期, B: 事件催化, C: 趋势/情绪
  
  // ABCT 模型
  alpha: string;            // A: 我赚的是什么钱？买入理由
  broken: string;           // B: 什么事实发生，证明我的判断错了？
  continueCondition: string;// C: 什么新增证据出现，我才允许加仓？
  
  timeframePreset: string;  // e.g. "3_DAYS" | "1_WEEK" | "2_WEEKS" | "1_MONTH" | "3_MONTHS" | "6_MONTHS" | "CUSTOM"
  startDate: string;        // YYYY-MM-DD
  expectedEndDate: string;  // YYYY-MM-DD
  expectedDays: number;     // 预期的验证天数

  // 仓位与风控
  plannedEntryPrice: number; // 计划买入价格
  plannedPosition: number;   // 计划仓位 % (0-100)
  maxLossPercent: number;    // 最大允许单只亏损 % (0-100)
  maxAccountRisk: number;    // 对账户最大影响 % (plannedPosition * maxLossPercent / 100)

  // 实际执行数据
  currentShares?: number;    // 当前股数 (可选)
  avgEntryPrice: number;     // 实际持仓均价
  currentPrice?: number;     // 当前市价
  currentPosition: number;   // 当前实际仓位 %

  // 标记与属性
  isUnplanned?: boolean;     // 是否为临时/计划外交易
  isFomo?: boolean;          // 是否触发了 FOMO
  fomoAnswers?: {
    q1NoRiseStillBuy: boolean; // 如果没涨还想买吗
    q2ExpectationOrCandle: 'FUTURE' | 'CANDLE' | 'UNSURE'; // 买的是预期还是阳线
    q3MissImpact: string;     // 如果错过有什么实际影响
  };
  tags: string[];            // 标签，如 ["AI", "算力", "存储"]
  status: TradeStatus;

  // 每日持仓假设状态: 🟢 'NORMAL' | 🟡 'OBSERVING' (有新信息但不确定) | 🔴 'RE_EVALUATING' (逻辑可能被证伪)
  dailyStatus?: 'NORMAL' | 'OBSERVING' | 'RE_EVALUATING';
  lastDailyCheckDate?: string;

  // 闭单/卖出数据
  closeDate?: string;
  exitPrice?: number;
  financialResultPercent?: number; // 实际财务收益率 % (+8.2%, -4.0%)
  financialAmount?: number;        // 实际盈亏金额 (可选)
  processResult?: 'EXCELLENT' | 'NORMAL' | 'MINOR_VIOLATION' | 'SEVERE_VIOLATION'; // 交易过程质量
  stopType?: 'PRICE_STOP' | 'THESIS_STOP' | 'TIME_STOP' | 'PROFIT_TAKE'; // 止损/离场分类
  exitReason?: string;             // 离场原因描述
  exitViolations?: string[];       // 离场时违背的纪律标记

  createdAt: string;         // ISO 时间字符串
  updatedAt: string;
}

export type EventType = 
  | 'PLAN_CREATED'   // 建立交易计划
  | 'BUY'            // 首次买入
  | 'ADD'            // 理性加仓
  | 'REDUCE'         // 减仓
  | 'SELL'           // 全部卖出
  | 'INFO'           // 新增信息 / 每日检查
  | 'REVIEW';        // 复盘批注

export interface TradeEvent {
  id?: number;
  tradeId: number;           // 关联的 TradePlan id
  type: EventType;
  price?: number;            // 发生价格
  positionDelta?: number;    // 仓位变化 %
  shares?: number;           // 股数变化
  reason: string;            // 原因 / 说明
  
  // 加仓特有字段
  addEvidenceTypes?: string[];// 勾选的新增证据类型
  addAnchorCheckPass?: boolean; // "如果现在完全没持有还会买吗" -> true: 会, false: 成本锚定警告
  
  // 卖出特有字段
  sellReasonCategory?: string;
  isEmotionalSell?: boolean; // 情绪化卖出标记
  stopType?: 'PRICE_STOP' | 'THESIS_STOP' | 'TIME_STOP' | 'PROFIT_TAKE';
  processResult?: 'EXCELLENT' | 'NORMAL' | 'MINOR_VIOLATION' | 'SEVERE_VIOLATION';

  createdAt: string;         // YYYY-MM-DD HH:mm:ss 或 ISO
}

export interface DailyReview {
  id?: number;
  date: string;              // YYYY-MM-DD
  
  // 6 个核心问题
  unplannedTrade: boolean;    // 1. 今天有没有计划外交易？
  timeframeMismatch: boolean; // 2. 产业逻辑买入，却因为短期价格波动卖出？
  shortToLong: boolean;       // 3. 短线交易被套以后改成长线？
  emotionalAdd: boolean;      // 4. 因为亏损而加仓，而不是因为新增证据？
  fomo: boolean;              // 5. 有没有 FOMO？
  
  worstTradeId?: number;     // 6. 今天最差的一笔交易 (关联 TradePlan id)
  worstTradeSymbol?: string;
  worstTradeName?: string;
  problemType: 'PREDICTION_ERROR' | 'EXECUTION_ERROR' | 'POSITION_ERROR' | 'TIMEFRAME_ERROR' | 'EMOTION_ERROR' | 'NORMAL_LOSS';
  
  notes?: string;            // 今日反思心得
  createdAt: string;
}

export interface AccountSettings {
  id?: number;
  totalCapital: number;          // 账户总资产 (默认 100,000 元)
  maxSingleRiskPercent: number;  // 单笔最大风险 % (默认 2%)
  maxDailyLossPercent: number;   // 单日最大亏损 % (默认 3%)
  maxWeeklyDrawdownPercent: number; // 单周最大回撤 % (默认 6%)
  maxConsecutiveLosses: number;  // 连续亏损交易笔数熔断阈值 (默认 3 笔)
  maxConsecutiveUnplanned: number; // 连续计划外交易笔数熔断阈值 (默认 2 笔)
  fomoCooldownSeconds: number;   // FOMO 冷静时长秒数 (默认 30 秒)
  theme: 'dark' | 'light';
  updatedAt: string;
}

export interface DisciplineMetrics {
  totalTrades: number;
  plannedTradesCount: number;
  plannedTradeRate: number;      // 计划交易率 = 计划交易 / 总交易
  timeframeMatchRate: number;    // 时间尺度匹配率 = 符合原始周期操作 / 总操作
  rationalAddRate: number;       // 理性加仓率 = 存在新增证据加仓 / 总加仓
  emotionalTradeRate: number;    // 情绪交易率 = (FOMO + 恐慌) / 总交易
  thesisDriftCount: number;      // 交易理由漂移次数
  winRate: number;               // 胜率
  goodTradesLossCount: number;   // 好交易+亏钱 (纪律优良但止损)
  badTradesProfitCount: number;  // 坏交易+赚钱 (违规侥幸获利)
  circuitBreakerTriggered: boolean; // 当前是否处于熔断预警
  circuitBreakerReasons: string[];
}
