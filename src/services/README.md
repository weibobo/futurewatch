# 简化的数据服务架构

## 概述

采用单一接口设计，合并了期货数据服务和查询服务功能，简化架构。

## 核心接口

### IDataService

```typescript
interface IDataService {
    // 基础服务控制
    start(interval?: number): Promise<void>;
    stop(): Promise<void>;
    refresh(): Promise<void>;
    isActive(): boolean;
    
    // 数据订阅
    subscribe(callback: (data: FutureItem[]) => void): () => void;
    
    // 监控管理
    setWatchedFutures(futures: FutureItem[]): Promise<void>;
    getWatchedFutures(): FutureItem[];
    
    // 期货查询
    getAllOptions(): Promise<FutureOption[]>;
    searchOptions(query: string, category?: string): Promise<FutureOption[]>;
    getCategories(): Promise<Category[]>;
}
```

## 使用方式

```typescript
import { serviceManager } from './services/ServiceManager';

// 创建服务
const dataService = await serviceManager.createDataService('mock');

// 启动服务
await dataService.start(5000);

// 订阅数据
dataService.subscribe((data) => {
    console.log('数据更新:', data);
});

// 搜索期货
const options = await dataService.searchOptions('BTC', 'crypto');

// 设置监控
await dataService.setWatchedFutures(watchedFutures);
```

## 服务类型

- `mock`: 模拟数据服务（默认）
- `test`: 测试数据服务

## 实现

- `MockDataService`: 模拟服务实现，包含完整的数据和查询功能
- `ServiceManager`: 服务管理器单例

## 特点

1. **单一接口**: 一个接口处理所有数据服务需求
2. **自动同步**: 监控期货自动同步到数据服务
3. **类型安全**: 完整的 TypeScript 支持
4. **可扩展**: 便于添加新的数据源