export enum TradeType {
    LONG = 'long',
    SHORT = 'short'
}

export enum AlertType {
    RISE = 'rise',
    FALL = 'fall'
}

export interface PriceAlert {
    type: AlertType;
    price: number;
}

export interface FutureItem {
    id: string;
    symbol: string;
    name: string;
    lastPrice: number;
    changePercent: number; // 0.05 for 5%
    changeAmount: number;
    tradeType?: TradeType;
    price?: number; // 买入价格改为通用价格
    quantity?: number;
    alerts?: PriceAlert[]; // 告警数组，最多2个
}

export interface MarketData {
    symbol: string;
    price: number;
    time: number;
}
