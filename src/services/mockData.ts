import { FutureItem } from "../types";
import { IDataService, FutureOption, Category } from "./interfaces";

const INITIAL_FUTURES: FutureItem[] = [
    { id: '1', symbol: 'BTCUSDT', name: '比特币', lastPrice: 95000, changePercent: 0.023, changeAmount: 2150 },
    { id: '2', symbol: 'ETHUSDT', name: '以太坊', lastPrice: 3500, changePercent: -0.012, changeAmount: -42 },
    { id: '3', symbol: 'SOLUSDT', name: 'Solana', lastPrice: 156.5, changePercent: 0.05, changeAmount: 7.5 },
];

/**
 * 模拟数据服务实现
 * 实现 IDataService 接口，提供期货数据的模拟实时更新
 */
export class MockDataService implements IDataService {
    private futures: FutureItem[] = [...INITIAL_FUTURES];
    private callbacks: ((data: FutureItem[]) => void)[] = [];
    private intervalId: number | null = null;
    private refreshInterval: number = 1000; // 默认1秒
    private active: boolean = false;

    /**
     * 启动数据服务
     */
    async start(interval: number = 1000): Promise<void> {
        if (this.active) {
            await this.stop();
        }
        
        this.refreshInterval = interval;
        this.active = true;

        this.intervalId = setInterval(() => {
            this.futures = this.futures.map(f => {
                const move = (Math.random() - 0.5) * 0.02; // 改为2%波动，更容易触发
                const newPrice = f.lastPrice * (1 + move);
                return {
                    ...f,
                    lastPrice: parseFloat(newPrice.toFixed(2)),
                    changePercent: f.changePercent + move,
                    changeAmount: newPrice - (f.lastPrice / (1 + f.changePercent)), // Approx
                };
            });
            this.notify();
        }, this.refreshInterval) as unknown as number;

        console.log(`Mock data service started with interval: ${this.refreshInterval}ms`);
    }

    /**
     * 停止数据服务
     */
    async stop(): Promise<void> {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.active = false;
        console.log('Mock data service stopped');
    }

    /**
     * 订阅数据更新
     */
    subscribe(callback: (data: FutureItem[]) => void): () => void {
        this.callbacks.push(callback);
        callback(this.futures);
        return () => {
            this.callbacks = this.callbacks.filter(c => c !== callback);
        };
    }

    /**
     * 手动刷新数据
     */
    async refresh(): Promise<void> {
        if (!this.active) {
            throw new Error('Service is not active. Call start() first.');
        }

        // 触发一次数据更新
        this.futures = this.futures.map(f => {
            const move = (Math.random() - 0.5) * 0.01; // 手动刷新用较小的波动
            const newPrice = f.lastPrice * (1 + move);
            return {
                ...f,
                lastPrice: parseFloat(newPrice.toFixed(2)),
                changePercent: f.changePercent + move,
                changeAmount: newPrice - (f.lastPrice / (1 + f.changePercent)),
            };
        });
        this.notify();
        console.log('Mock data refreshed manually');
    }

    /**
     * 检查服务状态
     */
    isActive(): boolean {
        return this.active;
    }

    /**
     * 获取服务名称
     */
    getServiceName(): string {
        return 'mock';
    }

    /**
     * 设置监控的期货列表
     */
    async setWatchedFutures(futures: FutureItem[]): Promise<void> {
        // 更新期货数据，保留价格信息
        const existingMap = new Map(this.futures.map(f => [f.symbol, f]));
        
        this.futures = futures.map(f => {
            const existing = existingMap.get(f.symbol);
            return {
                ...f,
                lastPrice: existing?.lastPrice || f.lastPrice || 0,
                changePercent: existing?.changePercent || 0,
                changeAmount: existing?.changeAmount || 0
            };
        });
        
        console.log(`Watched futures updated: ${this.futures.length} items`);
    }

    /**
     * 添加监控的期货
     */
    async addWatchedFuture(future: FutureItem): Promise<void> {
        const existing = this.futures.find(f => f.symbol === future.symbol);
        
        if (!existing) {
            this.futures.push({
                ...future,
                lastPrice: future.lastPrice || 0,
                changePercent: 0,
                changeAmount: 0
            });
            console.log(`Added watched future: ${future.symbol}`);
        } else {
            console.log(`Future already being watched: ${future.symbol}`);
        }
    }

    /**
     * 移除监控的期货
     */
    async removeWatchedFuture(futureId: string): Promise<void> {
        const futureToRemove = this.futures.find(f => f.id === futureId);
        
        if (futureToRemove) {
            this.futures = this.futures.filter(f => f.id !== futureId);
            console.log(`Removed watched future: ${futureToRemove.symbol}`);
        } else {
            console.log(`Future not found for removal: ${futureId}`);
        }
    }

    /**
     * 获取当前监控的期货列表
     */
    getWatchedFutures(): FutureItem[] {
        return [...this.futures];
    }

    /**
     * 通知所有订阅者数据已更新
     */
    private notify() {
        this.callbacks.forEach(cb => {
            try {
                cb([...this.futures]);
            } catch (error) {
                console.error('Error in data callback:', error);
            }
        });
    }

    // 期货查询功能
    async getAllOptions(): Promise<FutureOption[]> {
        return [
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
            { symbol: 'CLUSDT', name: '原油', category: 'commodity' },
            { symbol: 'GCUSDT', name: '黄金', category: 'commodity' },
            { symbol: 'SIUSDT', name: '白银', category: 'commodity' },
            { symbol: 'NGUSDT', name: '天然气', category: 'commodity' },
            { symbol: 'CUUSDT', name: '铜', category: 'commodity' },
            { symbol: 'EURUSDT', name: '欧元/美元', category: 'forex' },
            { symbol: 'GBPUSDT', name: '英镑/美元', category: 'forex' },
            { symbol: 'USDJPYUSDT', name: '美元/日元', category: 'forex' },
            { symbol: 'AUDUSDT', name: '澳元/美元', category: 'forex' },
            { symbol: 'USDCADUSDT', name: '美元/加元', category: 'forex' },
            { symbol: 'SPXUSDT', name: '标普500指数', category: 'stock' },
            { symbol: 'NDXUSDT', name: '纳斯达克100指数', category: 'stock' },
            { symbol: 'DJIUSDT', name: '道琼斯指数', category: 'stock' },
        ];
    }

    async searchOptions(query: string, category?: string): Promise<FutureOption[]> {
        const allOptions = await this.getAllOptions();
        
        // 先按分类筛选
        let filtered = category && category !== 'all' 
            ? allOptions.filter(item => item.category === category)
            : allOptions;
        
        // 再按关键词搜索
        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            filtered = filtered.filter(item => 
                item.symbol.toLowerCase().includes(lowerQuery) ||
                item.name.toLowerCase().includes(lowerQuery)
            );
        }
        
        return filtered;
    }

    async getCategories(): Promise<Category[]> {
        return [
            { value: 'all', label: '全部' },
            { value: 'crypto', label: '加密货币' },
            { value: 'commodity', label: '大宗商品' },
            { value: 'forex', label: '外汇' },
            { value: 'stock', label: '股指' },
        ];
    }

    // 保留原有方法以向后兼容
    startSimulation(interval: number = 1000) {
        this.start(interval);
    }

    stopSimulation() {
        this.stop();
    }
}

export const mockDataService = new MockDataService();
