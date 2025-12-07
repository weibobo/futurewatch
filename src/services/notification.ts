import { AlertType, type TriggeredAlert } from '../types';

export class NotificationService {
  // 检查是否在 Tauri 环境中
  private isTauri() {
    if (typeof window === 'undefined') return false;
    return '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
  }

  async sendAlert(alert: TriggeredAlert) {
    const title = this.getAlertTitle(alert);
    const body = '';

    console.log(`[ALERT] 准备发送通知: ${title}`);
    console.log(`[ALERT] 当前环境: ${this.isTauri() ? 'Tauri' : 'Browser'}`);

    if (this.isTauri()) {
      try {
        console.log('[ALERT] 调用 Tauri 通知命令...');
        // 使用 Tauri 原生通知 API
        const { invoke } = await import('@tauri-apps/api/core');
        const result = await invoke('send_notification', {
          payload: {
            title,
            body,
            icon: 'info' // 可选：系统图标
          }
        });
        console.log('[ALERT] Tauri 通知调用完成，结果:', result);
      } catch (error) {
        console.error('[ALERT] Tauri 通知调用失败:', error);
        console.log('[ALERT] 尝试降级到浏览器通知...');
        // 降级到浏览器通知
        this.sendBrowserNotification(title, body);
      }
    } else {
      console.log('[ALERT] 浏览器环境，使用浏览器通知');
      // 浏览器环境降级处理
      this.sendBrowserNotification(title, body);
    }
  }

  private getAlertTitle(alert: TriggeredAlert): string {
    const isRise = alert.type === AlertType.RISE;
    const trendEmoji = isRise ? '🟥↑' : '🟩↓';
    const verb = isRise ? '已涨到' : '已跌到';
    const name = alert.name || alert.symbol;
    const price = alert.triggerPrice.toFixed(2);
    return `${trendEmoji} ${name} ${verb} ${price}`;
  }

  private sendBrowserNotification(title: string, body: string) {
    console.log(`[ALERT] 浏览器通知权限状态: ${Notification.permission}`);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      console.log('[ALERT] 创建浏览器通知');
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico', // 应用图标
        badge: '/favicon.ico'
      });
      
      // 3秒后自动关闭
      setTimeout(() => {
        notification.close();
      }, 3000);
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      console.log('[ALERT] 请求浏览器通知权限');
      // 请求权限
      Notification.requestPermission().then(permission => {
        console.log(`[ALERT] 权限请求结果: ${permission}`);
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    } else {
      console.log('[ALERT] 浏览器通知权限被拒绝');
    }
  }

  // 请求通知权限（主要用于浏览器环境）
  async requestPermission(): Promise<boolean> {
    if (this.isTauri()) {
      // Tauri 通常已默认有权限
      return true;
    }

    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }
}

export const notificationService = new NotificationService();