// src/utils/stockSearch.ts

export interface StockSearchResult {
  code: string;       // 纯代码，例如 "600519", "NVDA", "00700"
  name: string;       // 标的名称，例如 "贵州茅台", "腾讯控股"
  pinyin?: string;    // 拼音缩写，例如 "gzmt"
  market: string;     // 友好的市场类型，例如 "沪A", "科创板", "深A", "创业板", "港股", "美股"
  marketCode: string; // 市场前缀代码，例如 "sh", "sz", "hk", "us"
}

// 离线/内置核心标的兜底，防止完全断网时不可用
const FALLBACK_STOCKS: StockSearchResult[] = [
  { code: '600519', name: '贵州茅台', pinyin: 'gzmt', market: '沪A', marketCode: 'sh' },
  { code: '300750', name: '宁德时代', pinyin: 'ndsd', market: '创业板', marketCode: 'sz' },
  { code: '300308', name: '中际旭创', pinyin: 'zjxc', market: '创业板', marketCode: 'sz' },
  { code: '002594', name: '比亚迪', pinyin: 'byd', market: '深A', marketCode: 'sz' },
  { code: '601318', name: '中国平安', pinyin: 'zgpa', market: '沪A', marketCode: 'sh' },
  { code: '600036', name: '招商银行', pinyin: 'zsyh', market: '沪A', marketCode: 'sh' },
  { code: '688981', name: '中芯国际', pinyin: 'zxgj', market: '科创板', marketCode: 'sh' },
  { code: '00700', name: '腾讯控股', pinyin: 'txkg', market: '港股', marketCode: 'hk' },
  { code: '09988', name: '阿里巴巴-W', pinyin: 'albb', market: '港股', marketCode: 'hk' },
  { code: 'NVDA', name: '英伟达', pinyin: 'ywd', market: '美股', marketCode: 'us' },
  { code: 'AAPL', name: '苹果', pinyin: 'pg', market: '美股', marketCode: 'us' },
  { code: 'TSLA', name: '特斯拉', pinyin: 'tsl', market: '美股', marketCode: 'us' },
  { code: 'WDC', name: '西部数据', pinyin: 'xbsj', market: '美股', marketCode: 'us' },
  { code: 'MSFT', name: '微软', pinyin: 'wr', market: '美股', marketCode: 'us' },
  { code: 'GOOGL', name: '谷歌', pinyin: 'gg', market: '美股', marketCode: 'us' },
];

/**
 * 格式化市场类型名称
 */
function getMarketLabel(marketCode: string, rawCode: string): string {
  const code = rawCode.toUpperCase();
  const m = marketCode.toLowerCase();

  if (m === 'sh') {
    if (code.startsWith('688') || code.startsWith('689')) return '科创板';
    if (code.startsWith('51') || code.startsWith('58')) return '沪ETF';
    return '沪A';
  }
  if (m === 'sz') {
    if (code.startsWith('300') || code.startsWith('301')) return '创业板';
    if (code.startsWith('159')) return '深ETF';
    return '深A';
  }
  if (m === 'bj' || code.startsWith('8') || code.startsWith('4')) {
    return '北交所';
  }
  if (m === 'hk') {
    return '港股';
  }
  if (m === 'us') {
    return '美股';
  }
  return m.toUpperCase();
}

/**
 * 清洗股票代码（比如美股在腾讯接口里是 nvda.oq 或 aapl.oq，清洗成 NVDA / AAPL）
 */
function cleanStockCode(marketCode: string, rawCode: string): string {
  if (marketCode.toLowerCase() === 'us') {
    return rawCode.split('.')[0].toUpperCase();
  }
  return rawCode.toUpperCase();
}

// 记录上一次创建的 script 标签，用于及时清理
let currentScript: HTMLScriptElement | null = null;
let scriptCounter = 0;

/**
 * 基于腾讯财经 Smartbox 接口的联想搜索（通过 JSONP，完全支持浏览器跨域）
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  return new Promise((resolve) => {
    // 设置超时机制，如果 2 秒没有响应则降级使用本地兜底
    const timer = setTimeout(() => {
      resolve(searchLocalStocks(q));
    }, 2000);

    const scriptId = `stock_suggest_script_${++scriptCounter}`;
    if (currentScript && currentScript.parentNode) {
      currentScript.parentNode.removeChild(currentScript);
      currentScript = null;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://smartbox.gtimg.cn/s3/?q=${encodeURIComponent(q)}&t=all&_=${Date.now()}`;
    currentScript = script;

    script.onload = () => {
      clearTimeout(timer);
      try {
        const vHint = (window as unknown as { v_hint?: string }).v_hint;
        if (!vHint || vHint === 'N') {
          resolve(searchLocalStocks(q));
          return;
        }

        // 解析格式: sh~600519~贵州茅台~gzmt~GP-A^...
        const items = vHint.split('^').filter(Boolean);
        const results: StockSearchResult[] = [];

        for (const item of items) {
          const parts = item.split('~');
          if (parts.length >= 3) {
            const marketCode = parts[0];
            const rawCode = parts[1];
            const name = parts[2];
            const pinyin = parts[3] || '';
            const code = cleanStockCode(marketCode, rawCode);
            const market = getMarketLabel(marketCode, code);

            // 避免重复结果
            if (!results.some((r) => r.code === code && r.market === market)) {
              results.push({
                code,
                name,
                pinyin,
                market,
                marketCode,
              });
            }
          }
        }

        resolve(results.length > 0 ? results : searchLocalStocks(q));
      } catch (err) {
        console.warn('解析股票联想数据失败，使用本地兜底', err);
        resolve(searchLocalStocks(q));
      } finally {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      }
    };

    script.onerror = () => {
      clearTimeout(timer);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      resolve(searchLocalStocks(q));
    };

    document.body.appendChild(script);
  });
}

/**
 * 离线/降级搜索
 */
export function searchLocalStocks(query: string): StockSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return FALLBACK_STOCKS.filter(
    (s) =>
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.pinyin && s.pinyin.toLowerCase().includes(q))
  );
}

/**
 * 快速通过代码匹配单个股票名称（输入 6 位代码或美股代码直接联动）
 */
export async function lookupStockByCode(code: string): Promise<StockSearchResult | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const results = await searchStocks(trimmed);
  const matched = results.find((r) => r.code.toUpperCase() === trimmed.toUpperCase());
  return matched || results[0] || null;
}
