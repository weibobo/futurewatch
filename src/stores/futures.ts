import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { FutureItem } from '../types';
import { mockDataService } from '../services/mockData';

export const useFuturesStore = defineStore('futures', () => {
    const futures = ref<FutureItem[]>([]);

    // Calculate P&L for a single item
    const getPnL = (item: FutureItem) => {
        if (!item.price || !item.quantity) return { amount: 0, percent: 0 };
        const marketValue = item.lastPrice * item.quantity;
        const costBasis = item.price * item.quantity;
        let amount = marketValue - costBasis;
        
        // 做空时收益相反
        if (item.tradeType === 'short') {
            amount = -amount;
        }
        
        const percent = (amount / costBasis);
        return { amount, percent };
    };

    const totalPnL = computed(() => {
        return futures.value.reduce((acc, item) => {
            const pnl = getPnL(item);
            return acc + pnl.amount;
        }, 0);
    });

    const init = async () => {
        // Load from storage
        const stored = localStorage.getItem('futures_watchlist');
        if (stored) {
            futures.value = JSON.parse(stored);
        }

        // 延迟导入settings store避免循环依赖
        try {
            const { useSettingsStore } = await import('./settings');
            const settingsStore = useSettingsStore();
            
            // 加载设置
            settingsStore.loadSettings();
            
            // 使用设置的刷新间隔启动模拟
            const priceIntervalMs = settingsStore.settings.priceRefreshInterval * 1000;
            mockDataService.startSimulation(priceIntervalMs);
            
            mockDataService.subscribe((data) => {
                // Merge mock price updates with stored items
                // In a real app, we'd only update prices for validation items
                // For this mock, we'll just take the mock data if our list is empty, 
                // or update our list items with new prices if they exist in mock
                if (futures.value.length === 0) {
                    futures.value = data;
                } else {
                    // Update prices for existing items
                    futures.value = futures.value.map(f => {
                        const update = data.find(d => d.symbol === f.symbol);
                        if (update) {
                            return { ...f, lastPrice: update.lastPrice, changePercent: update.changePercent, changeAmount: update.changeAmount };
                        }
                        return f;
                    });
                }
            });

            // 监听价格刷新间隔变化
            watch(() => settingsStore.settings.priceRefreshInterval, (newInterval) => {
                const intervalMs = newInterval * 1000;
                mockDataService.updateInterval(intervalMs);
            });
        } catch (error) {
            console.error('Failed to initialize futures store:', error);
        }
    };

    const addFuture = (future: FutureItem) => {
        futures.value.push(future);
        save();
        // In real app, would also subscribe to new symbol
    };

    const updateFuture = (id: string, updates: Partial<FutureItem>) => {
        const index = futures.value.findIndex(f => f.id === id);
        if (index !== -1) {
            futures.value[index] = { ...futures.value[index], ...updates };
            save();
        }
    };

    const deleteFuture = (id: string) => {
        futures.value = futures.value.filter(f => f.id !== id);
        save();
    };

    const save = () => {
        localStorage.setItem('futures_watchlist', JSON.stringify(futures.value));
    };

    // 手动刷新价格数据
    const refreshPrices = async () => {
        // 对于mock数据，我们可以强制触发一次更新
        try {
            const { useSettingsStore } = await import('./settings');
            const settingsStore = useSettingsStore();
            const priceIntervalMs = settingsStore.settings.priceRefreshInterval * 1000;
            
            mockDataService.stopSimulation();
            mockDataService.startSimulation(priceIntervalMs);
        } catch (error) {
            console.error('Failed to refresh prices:', error);
        }
    };

    // Watch for changes to save (optional, or just save on add/remove)
    // watch(futures, save, { deep: true });

    return {
        futures,
        totalPnL,
        getPnL,
        init,
        addFuture,
        updateFuture,
        deleteFuture,
        refreshPrices
    };
});
