import { FutureItem } from "../types";

const INITIAL_FUTURES: FutureItem[] = [
    { id: '1', symbol: 'BTCUSDT', name: '比特币', lastPrice: 95000, changePercent: 0.023, changeAmount: 2150 },
    { id: '2', symbol: 'ETHUSDT', name: '以太坊', lastPrice: 3500, changePercent: -0.012, changeAmount: -42 },
    { id: '3', symbol: 'SOLUSDT', name: 'Solana', lastPrice: 156.5, changePercent: 0.05, changeAmount: 7.5 },
];

export class MockDataService {
    private futures: FutureItem[] = [...INITIAL_FUTURES];
    private callbacks: ((data: FutureItem[]) => void)[] = [];
    private intervalId: number | null = null;
    private refreshInterval: number = 1000; // 默认1秒

    startSimulation(interval: number = 1000) {
        if (this.intervalId) {
            this.stopSimulation();
        }
        
        this.refreshInterval = interval;

        this.intervalId = setInterval(() => {
            this.futures = this.futures.map(f => {
                const move = (Math.random() - 0.5) * 0.002; // 0.2% movement
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
    }

    stopSimulation() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    updateInterval(newInterval: number) {
        if (this.intervalId) {
            this.stopSimulation();
            this.startSimulation(newInterval);
        }
    }

    subscribe(callback: (data: FutureItem[]) => void) {
        this.callbacks.push(callback);
        callback(this.futures);
        return () => {
            this.callbacks = this.callbacks.filter(c => c !== callback);
        };
    }

    private notify() {
        this.callbacks.forEach(cb => cb(this.futures));
    }

    getInitialData() {
        return this.futures;
    }
}

export const mockDataService = new MockDataService();
