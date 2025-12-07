import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { FutureItem, AlertType, type TriggeredAlert } from '../types';
import { serviceManager } from '../services/ServiceManager';
import { notificationService } from '../services/notification';
import type { IDataService } from '../services/interfaces';

export const useFuturesStore = defineStore('futures', () => {
    const futures = ref<FutureItem[]>([]);
    const triggeredAlerts = ref<TriggeredAlert[]>([]);
    const isInitialized = ref(false);
    const dataService = ref<IDataService | null>(null);

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

    // 检查并触发告警
    const checkAndTriggerAlerts = async (item: FutureItem) => {
        if (!item.alerts || item.alerts.length === 0) return;

        for (const alert of item.alerts) {
            if (alert.price <= 0) continue; // 跳过未设置的告警

            const shouldTrigger = 
                (alert.type === AlertType.RISE && item.lastPrice >= alert.price) ||
                (alert.type === AlertType.FALL && item.lastPrice <= alert.price);

            if (shouldTrigger) {
                const triggeredAlert: TriggeredAlert = {
                    futureId: item.id,
                    symbol: item.symbol,
                    name: item.name,
                    type: alert.type,
                    triggerPrice: item.lastPrice,
                    triggeredAt: Date.now()
                };

                // 发送通知
                await notificationService.sendAlert(triggeredAlert);
                
                // 记录已触发告警
                triggeredAlerts.value.push(triggeredAlert);

                // 清除已触发的告警设置
                const updatedAlerts = item.alerts.filter(a => 
                    !(a.type === alert.type && a.price === alert.price)
                );
                
                // 更新期货项的告警设置
                updateFuture(item.id, { alerts: updatedAlerts });
            }
        }
    };

    const init = async () => {
        if (isInitialized.value) {
            return;
        }

        isInitialized.value = true;

        try {
            // 初始化数据服务
            dataService.value = await serviceManager.createDataService('mock');

            // Load from storage
            const stored = localStorage.getItem('futures_watchlist');
            if (stored) {
                futures.value = JSON.parse(stored);
            }

            // 延迟导入settings store避免循环依赖
            const { useSettingsStore } = await import('./settings');
            const settingsStore = useSettingsStore();
            
            // 加载设置
            settingsStore.loadSettings();
            await settingsStore.applyShortcut();
            
            // 使用数据服务启动数据流
            const priceIntervalMs = settingsStore.settings.priceRefreshInterval * 1000;
            await dataService.value.start(priceIntervalMs);
            
            // 订阅数据更新
            dataService.value.subscribe(async (data) => {
                // Merge data updates with stored items
                if (futures.value.length === 0) {
                    futures.value = data;
                    return;
                }

                const updatedItems = futures.value.map(f => {
                    const update = data.find(d => d.symbol === f.symbol);
                    if (update) {
                        return {
                            ...f,
                            lastPrice: update.lastPrice,
                            changePercent: update.changePercent,
                            changeAmount: update.changeAmount
                        };
                    }
                    return f;
                });

                futures.value = updatedItems;

                const alertTasks = updatedItems
                    .filter(item => item.alerts && item.alerts.length > 0)
                    .map(item => checkAndTriggerAlerts(item));

                await Promise.all(alertTasks);
            });

            // 通知数据服务当前监控的期货列表
            if (futures.value.length > 0) {
                await dataService.value.setWatchedFutures(futures.value);
            }

            // 监听价格刷新间隔变化
            watch(() => settingsStore.settings.priceRefreshInterval, async (newInterval) => {
                const intervalMs = newInterval * 1000;
                if (dataService.value) {
                    await dataService.value.updateInterval(intervalMs);
                }
            });
        } catch (error) {
            console.error('Failed to initialize futures store:', error);
            isInitialized.value = false;
        }
    };

    const addFuture = async (future: FutureItem) => {
        futures.value.push(future);
        save();
        
        // 通知数据服务添加监控
        if (dataService.value) {
            try {
                await dataService.value.addWatchedFuture(future);
            } catch (error) {
                console.error('Failed to add future to data service:', error);
            }
        }
    };

    const updateFuture = async (id: string, updates: Partial<FutureItem>) => {
        const index = futures.value.findIndex(f => f.id === id);
        if (index !== -1) {
            futures.value[index] = { ...futures.value[index], ...updates };
            save();
            
            // 如果更新了symbol等关键信息，通知数据服务更新监控列表
            if (dataService.value && (updates.symbol || updates.name)) {
                try {
                    await dataService.value.setWatchedFutures(futures.value);
                } catch (error) {
                    console.error('Failed to update watched futures:', error);
                }
            }
        }
    };

    const deleteFuture = async (id: string) => {
        const future = futures.value.find(f => f.id === id);
        futures.value = futures.value.filter(f => f.id !== id);
        save();
        
        // 通知数据服务移除监控
        if (dataService.value && future) {
            try {
                await dataService.value.removeWatchedFuture(id);
            } catch (error) {
                console.error('Failed to remove future from data service:', error);
            }
        }
    };

    const save = () => {
        localStorage.setItem('futures_watchlist', JSON.stringify(futures.value));
    };

    // 手动刷新价格数据
    const refreshPrices = async () => {
        if (!dataService.value) {
            console.error('Data service not initialized');
            return;
        }

        try {
            await dataService.value.refresh();
        } catch (error) {
            console.error('Failed to refresh prices:', error);
        }
    };

    // 获取期货选项
    const getFuturesOptions = async (category?: string) => {
        if (!dataService.value) {
            console.error('Data service not initialized');
            return [];
        }

        try {
            const options = await dataService.value.getAllOptions();
            return category && category !== 'all' 
                ? options.filter(item => item.category === category)
                : options;
        } catch (error) {
            console.error('Failed to get futures options:', error);
            return [];
        }
    };

    // 搜索期货选项
    const searchFuturesOptions = async (query: string, category?: string) => {
        if (!dataService.value) {
            console.error('Data service not initialized');
            return [];
        }

        try {
            return await dataService.value.searchOptions(query, category);
        } catch (error) {
            console.error('Failed to search futures options:', error);
            return [];
        }
    };

    // 获取分类列表
    const getCategories = async () => {
        if (!dataService.value) {
            console.error('Data service not initialized');
            return [];
        }

        try {
            return await dataService.value.getCategories();
        } catch (error) {
            console.error('Failed to get categories:', error);
            return [];
        }
    };

    // 切换数据服务
    const switchDataService = async (type: 'mock' | 'test') => {
        try {
            if (dataService.value && dataService.value.isActive()) {
                await dataService.value.stop();
            }

            dataService.value = await serviceManager.createDataService(type);
            
            // 重新启动数据流
            const { useSettingsStore } = await import('./settings');
            const settingsStore = useSettingsStore();
            const priceIntervalMs = settingsStore.settings.priceRefreshInterval * 1000;
            await dataService.value.start(priceIntervalMs);

            // 通知新的数据服务当前监控的期货
            if (futures.value.length > 0) {
                await dataService.value.setWatchedFutures(futures.value);
            }

            console.log(`Switched to ${type} data service`);
        } catch (error) {
            console.error('Failed to switch data service:', error);
        }
    };

    // 获取数据服务监控的期货列表
    const getDataServiceWatchedFutures = (): FutureItem[] => {
        return dataService.value ? dataService.value.getWatchedFutures() : [];
    };

    // 同步监控状态到数据服务
    const syncWatchedFuturesToDataService = async () => {
        if (dataService.value) {
            try {
                await dataService.value.setWatchedFutures(futures.value);
                console.log('Synced watched futures to data service');
            } catch (error) {
                console.error('Failed to sync watched futures:', error);
            }
        }
    };

    // Watch for changes to save (optional, or just save on add/remove)
    // watch(futures, save, { deep: true });

    return {
        futures,
        totalPnL,
        triggeredAlerts,
        getPnL,
        init,
        addFuture,
        updateFuture,
        deleteFuture,
        refreshPrices,
        getFuturesOptions,
        searchFuturesOptions,
        getCategories,
        switchDataService,
        getDataServiceWatchedFutures,
        syncWatchedFuturesToDataService
    };
});
