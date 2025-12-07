import { IDataService } from './interfaces';
import { MockDataService } from './mockData';
import { FutureItem } from '../types';

/**
 * 简化的服务管理器
 */
export class ServiceManager {
    private static instance: ServiceManager;
    private dataService: IDataService | null = null;

    private constructor() {}

    static getInstance(): ServiceManager {
        if (!ServiceManager.instance) {
            ServiceManager.instance = new ServiceManager();
        }
        return ServiceManager.instance;
    }

    /**
     * 创建数据服务实例
     */
    async createDataService(type: 'mock' | 'test' = 'mock'): Promise<IDataService> {
        switch (type) {
            case 'mock':
            case 'test':
                this.dataService = new MockDataService();
                break;
            default:
                throw new Error(`Unknown service type: ${type}`);
        }
        return this.dataService;
    }

    /**
     * 获取当前数据服务实例
     */
    getDataService(): IDataService | null {
        return this.dataService;
    }

    /**
     * 获取数据服务监控的期货列表
     */
    getWatchedFutures(): FutureItem[] {
        return this.dataService ? this.dataService.getWatchedFutures() : [];
    }

    /**
     * 清理资源
     */
    async cleanup(): Promise<void> {
        if (this.dataService && this.dataService.isActive()) {
            await this.dataService.stop();
        }
        this.dataService = null;
    }
}

export const serviceManager = ServiceManager.getInstance();