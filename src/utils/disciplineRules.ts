// src/utils/disciplineRules.ts
import type { TradeType, TradeTypeInfo, TradePlan } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

export const TRADE_TYPES: Record<TradeType, TradeTypeInfo> = {
  A: {
    type: 'A',
    name: '产业预期',
    subTitle: '供需、行业周期、技术迭代、政策红利',
    typicalTimeframe: '数周 ～ 数月 (30天 ~ 180天)',
    examples: ['AI 算力', '电力与电网', '存储芯片', 'PCB', '行业涨价', '供需反转', '新技术渗透'],
    defaultChecks: [
      '行业供需关系是否依然向好？',
      '产业链上下游价格是否按预期波动？',
      '竞争格局是否恶化或被替代？',
      '不要拿 3 天短线波动去否定 3 个月的产业逻辑。',
    ],
    description: '通过产业中长期供需变化获取超额阿尔法，重在基本面逻辑验证，需要给予充分时间发酵。',
  },
  B: {
    type: 'B',
    name: '事件催化',
    subTitle: '重大会议、财报业绩、政策落地、大单发布',
    typicalTimeframe: '数日 ～ 数周 (5天 ~ 30天)',
    examples: ['行业政策出台', '业绩预告超预期', '重磅产品发布会', '大额中标订单', '突发提价通知'],
    defaultChecks: [
      '催化事件是否如期发生？',
      '事件发生后市场反应是否符合或透支预期？',
      '利好兑现时是否存在主力出货迹象？',
      '若事件落空，必须坚决执行逻辑止损。',
    ],
    description: '围绕特定可预期的催化事件建仓，事件落地或证伪即完成交易周期。',
  },
  C: {
    type: 'C',
    name: '趋势 / 情绪',
    subTitle: '板块启动、龙头首板、突破放量、接力博弈',
    typicalTimeframe: '1 ～ 10 个交易日 (短线快进快出)',
    examples: ['板块放量突破', '龙头接力', '大单异动', '市场情绪共振', '短期资金聚集'],
    defaultChecks: [
      '次日开盘竞价强弱是否符合预期？',
      '前一日关键防守均线/实体底部是否跌破？',
      '板块成交量能是否持续，是否出现退潮信号？',
      '🚨 严禁短线被套后自我安慰“改做中长线投资”！',
    ],
    description: '赚市场短期情绪溢价与流动性溢价，严格执行时效与价格防守，到期必了结。',
  },
};

export const TIMEFRAME_PRESETS = [
  { id: '3_DAYS', label: '1 ～ 3 个交易日', days: 3 },
  { id: '1_WEEK', label: '1 周 (5 个交易日)', days: 7 },
  { id: '2_WEEKS', label: '2 周 (10 个交易日)', days: 14 },
  { id: '1_MONTH', label: '1 个月', days: 30 },
  { id: '3_MONTHS', label: '3 个月', days: 90 },
  { id: '6_MONTHS', label: '6 个月', days: 180 },
  { id: 'CUSTOM', label: '自定义天数', days: 30 },
];

export const DISCIPLINE_QUOTES = [
  {
    quote: '你现在做的事情，和当初买它的理由匹配吗？',
    sub: 'TradeGuard 核心问讯',
  },
  {
    quote: '交易之前有理由，交易之后守理由。',
    sub: '原则一：知行合一',
  },
  {
    quote: '不要拿中线逻辑买入，却要求短线价格证明自己正确。',
    sub: '原则二：时间尺度对齐',
  },
  {
    quote: '买入理由没变，不要因为两根阴线 K 线否定自己。',
    sub: '原则三：坚守假设',
  },
  {
    quote: '买入理由已经消失，不要因为亏损不甘心而篡改理由。',
    sub: '原则四：承认证伪',
  },
  {
    quote: '仓位是风险的结果，不是信心的表达。',
    sub: '原则五：仓位纪律',
  },
  {
    quote: '不要用结果替行为辩护。好交易也会亏钱，坏交易也会赚钱。',
    sub: '原则六：过程优先',
  },
  {
    quote: '如果我现在完全没有这只股票，我还会在当前价格买入吗？',
    sub: '加仓金句：破除成本锚定',
  },
];

export interface TimeframeAlert {
  type: 'WARNING' | 'DANGER' | 'INFO';
  title: string;
  message: string;
}

export function detectTimeframeMismatch(plan: TradePlan): TimeframeAlert | null {
  if (plan.status !== 'ACTIVE' || !plan.startDate) return null;

  const now = new Date();
  const holdDays = differenceInDays(now, parseISO(plan.startDate));
  const expectedDays = plan.expectedDays || 30;

  // 1. 短线变长线检测 (针对 C 趋势/情绪，或者预期天数短的)
  if (plan.tradeType === 'C' || expectedDays <= 10) {
    if (holdDays > expectedDays) {
      return {
        type: 'DANGER',
        title: '⚠️ 短线变长线危险警报',
        message: `原计划交易窗口为 ${expectedDays} 天，当前已进入第 ${holdDays} 天。请检查：你是否正在因为被套亏损，而把一笔短线情绪交易擅自修改为长期投资？`,
      };
    }
  }

  // 2. 中长线产业逻辑被短线价格波动扰乱检测 (针对 A 产业预期)
  if (plan.tradeType === 'A' && expectedDays >= 30) {
    if (holdDays <= 7) {
      const priceDrop =
        plan.currentPrice && plan.avgEntryPrice
          ? ((plan.currentPrice - plan.avgEntryPrice) / plan.avgEntryPrice) * 100
          : 0;

      if (priceDrop < -2.0) {
        return {
          type: 'WARNING',
          title: '⚠️ 时间尺度提醒',
          message: `这是一笔 ${Math.round(expectedDays / 30)} 个月级别的产业预期交易，当前仅持有 ${holdDays} 天（当前浮亏 ${priceDrop.toFixed(1)}%）。买入时的产业假设并未改变，请不要使用短线次级价格波动去验证或推翻中期产业逻辑！`,
        };
      }
    }
  }

  // 3. 临近到期提醒
  if (holdDays >= expectedDays * 0.9 && holdDays <= expectedDays) {
    return {
      type: 'INFO',
      title: 'ℹ️ 验证窗口即将结束',
      message: `已持有 ${holdDays}/${expectedDays} 天。无论盈亏，请在窗口期前结合原始假设 Broken/Continue 条件进行综合验证。`,
    };
  }

  return null;
}

// 加仓新增证据可选库 (PRD Step 14)
export const ADD_POSITION_EVIDENCE_OPTIONS = [
  { id: 'industry_data', label: '行业公开数据超预期 (价格上涨/进出口放量/出货量激增)' },
  { id: 'company_order', label: '公司重大订单/合同落地验证' },
  { id: 'earnings_report', label: '财报或业绩预告毛利超预期' },
  { id: 'supply_demand', label: '行业供求关系进一步收紧，友商相继涨价' },
  { id: 'capital_flow', label: '机构资金或板块主力大举建仓放量' },
  { id: 'other_valid', label: '其他客观可验证的事实证据 (非主观想象)' },
];

// 卖出原因选项 (PRD Step 15)
export const SELL_REASON_OPTIONS = [
  { id: 'THESIS_BROKEN', label: '原始买入逻辑被事实客观证伪', isEmotional: false, stopType: 'THESIS_STOP' },
  { id: 'TARGET_MET', label: '产业或催化预期已充分兑现，达到目标空间', isEmotional: false, stopType: 'PROFIT_TAKE' },
  { id: 'TIME_EXPIRED', label: '预期时间窗口结束，该发生的事实未发生', isEmotional: false, stopType: 'TIME_STOP' },
  { id: 'RISK_CONTROL', label: '触及单笔/账户最大亏损控制线', isEmotional: false, stopType: 'PRICE_STOP' },
  { id: 'BETTER_OPPORTUNITY', label: '发现确定性更高、赔率更好的全新机会 (主动换仓)', isEmotional: false, stopType: 'PROFIT_TAKE' },
  { id: 'TECHNICAL_BROKEN', label: '关键技术位与中长期防守结构彻底破坏', isEmotional: false, stopType: 'PRICE_STOP' },
  // 情绪化卖出选项
  { id: 'EMOTIONAL_DROP', label: '因为今天盘面大跌，我很慌很焦虑很受挫', isEmotional: true, stopType: 'PRICE_STOP' },
  { id: 'EMOTIONAL_IMPATIENT', label: '因为买了几天一直不涨横盘，我等得极度不耐烦', isEmotional: true, stopType: 'TIME_STOP' },
];

export const STOP_TYPE_INFO = {
  PRICE_STOP: {
    name: 'Price Stop (价格止损)',
    desc: '控制账户财务风险，防止单只标的亏损失控。',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  THESIS_STOP: {
    name: 'Thesis Stop (逻辑止损)',
    desc: '原始交易假设已经被事实客观证伪，逻辑不在，坚决退出。',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  TIME_STOP: {
    name: 'Time Stop (时间止损)',
    desc: '原本预期时间窗口内应该发生的事情没有发生，资金效率止损。',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  PROFIT_TAKE: {
    name: 'Profit Take (预期兑现止盈)',
    desc: '预期的产业逻辑或事件已在市场充分发酵并兑现。',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
};
