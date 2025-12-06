export interface FutureOption {
  symbol: string;
  name: string;
  category: 'crypto' | 'commodity' | 'forex' | 'stock';
}

export const FUTURES_OPTIONS: FutureOption[] = [
  // 加密货币
  { symbol: 'BTCUSDT', name: '比特币', category: 'crypto' },
  { symbol: 'ETHUSDT', name: '以太坊', category: 'crypto' },
  { symbol: 'SOLUSDT', name: 'Solana', category: 'crypto' },
  { symbol: 'BNBUSDT', name: '币安币', category: 'crypto' },
  { symbol: 'ADAUSDT', name: '艾达币', category: 'crypto' },
  { symbol: 'XRPUSDT', name: '瑞波币', category: 'crypto' },
  { symbol: 'DOGEUSDT', name: '狗狗币', category: 'crypto' },
  { symbol: 'AVAXUSDT', name: '雪崩', category: 'crypto' },
  { symbol: 'MATICUSDT', name: 'Polygon', category: 'crypto' },
  { symbol: 'DOTUSDT', name: 'Polkadot', category: 'crypto' },
  { symbol: 'LINKUSDT', name: 'Chainlink', category: 'crypto' },
  { symbol: 'UNIUSDT', name: 'Uniswap', category: 'crypto' },
  { symbol: 'LTCUSDT', name: '莱特币', category: 'crypto' },
  { symbol: 'BCHUSDT', name: '比特币现金', category: 'crypto' },
  { symbol: 'ETCUSDT', name: '以太经典', category: 'crypto' },
  
  // 大宗商品期货
  { symbol: 'CLUSDT', name: '原油', category: 'commodity' },
  { symbol: 'GCUSDT', name: '黄金', category: 'commodity' },
  { symbol: 'SIUSDT', name: '白银', category: 'commodity' },
  { symbol: 'NGUSDT', name: '天然气', category: 'commodity' },
  { symbol: 'CUUSDT', name: '铜', category: 'commodity' },
  
  // 外汇期货
  { symbol: 'EURUSDT', name: '欧元/美元', category: 'forex' },
  { symbol: 'GBPUSDT', name: '英镑/美元', category: 'forex' },
  { symbol: 'USDJPYUSDT', name: '美元/日元', category: 'forex' },
  { symbol: 'AUDUSDT', name: '澳元/美元', category: 'forex' },
  { symbol: 'USDCADUSDT', name: '美元/加元', category: 'forex' },
  
  // 股指期货
  { symbol: 'SPXUSDT', name: '标普500指数', category: 'stock' },
  { symbol: 'NDXUSDT', name: '纳斯达克100指数', category: 'stock' },
  { symbol: 'DJIUSDT', name: '道琼斯指数', category: 'stock' },
];

export const CATEGORIES = [
  { value: 'all', label: '全部' },
  { value: 'crypto', label: '加密货币' },
  { value: 'commodity', label: '大宗商品' },
  { value: 'forex', label: '外汇' },
  { value: 'stock', label: '股指' },
];

// 搜索功能
export const searchFutures = (query: string, category: string = 'all'): FutureOption[] => {
  const filtered = category === 'all' 
    ? FUTURES_OPTIONS 
    : FUTURES_OPTIONS.filter(item => item.category === category);
  
  if (!query.trim()) return filtered;
  
  const lowerQuery = query.toLowerCase();
  return filtered.filter(item => 
    item.symbol.toLowerCase().includes(lowerQuery) ||
    item.name.toLowerCase().includes(lowerQuery)
  );
};