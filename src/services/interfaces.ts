import { FutureItem } from '../types';

export interface FutureOption {
    symbol: string;
    name: string;
    category: string;
}

export interface Category {
    value: string;
    label: string;
}

/**
 * 简化的数据服务接口
 * 合并了期货数据服务、期货查询服务等功能
 */
export interface IDataService {
    /**
     * 启动数据服务
     * @param interval 数据刷新间隔（毫秒）
     */
    start(interval?: number): Promise<void>;

    /**
     * 停止数据服务
     */
    stop(): Promise<void>;

    /**
     * 订阅数据更新
     * @param callback 数据更新回调函数
     * @returns 取消订阅的函数
     */
    subscribe(callback: (data: FutureItem[]) => void): () => void;

    /**
     * 手动刷新数据
     */
    refresh(): Promise<void>;

    /**
     * 检查服务状态
     */
    isActive(): boolean;

    /**
     * 设置监控的期货列表
     */
    setWatchedFutures(futures: FutureItem[]): Promise<void>;

    /**
     * 获取当前监控的期货列表
     */
    getWatchedFutures(): FutureItem[];

    // 期货查询功能
    /**
     * 获取所有可用的期货选项
     */
    getAllOptions(): Promise<FutureOption[]>;

    /**
     * 搜索期货选项
     */
    searchOptions(query: string, category?: string): Promise<FutureOption[]>;

    /**
     * 获取所有分类
     */
    getCategories(): Promise<Category[]>;
}