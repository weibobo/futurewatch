import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export interface Settings {
  priceRefreshInterval: number; // 价格刷新间隔（秒）
  klineRefreshInterval: number; // K线刷新间隔（秒）
}

const DEFAULT_SETTINGS: Settings = {
  priceRefreshInterval: 10, // 默认10秒
  klineRefreshInterval: 30, // 默认30秒
};

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({ ...DEFAULT_SETTINGS });

  // 从本地存储加载设置
  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('futures_settings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        settings.value = { ...DEFAULT_SETTINGS, ...parsedSettings };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      settings.value = { ...DEFAULT_SETTINGS };
    }
  };

  // 保存设置到本地存储
  const saveSettings = () => {
    try {
      localStorage.setItem('futures_settings', JSON.stringify(settings.value));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // 更新设置
  const updateSettings = (newSettings: Partial<Settings>) => {
    settings.value = { ...settings.value, ...newSettings };
  };

  // 重置为默认设置
  const resetSettings = () => {
    settings.value = { ...DEFAULT_SETTINGS };
  };

  // 监听设置变化并自动保存
  watch(settings, saveSettings, { deep: true });

  return {
    settings,
    loadSettings,
    updateSettings,
    resetSettings,
  };
});