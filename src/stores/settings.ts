import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export interface ShortcutSetting {
  code: string;
  label: string;
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  };
}

export interface Settings {
  priceRefreshInterval: number;
  klineRefreshInterval: number;
  toggleShortcut: ShortcutSetting;
}

type ShortcutStatus = 'unknown' | 'active' | 'failed' | 'unsupported';

const isTauriEnvironment = () =>
  typeof window !== 'undefined' &&
  ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);

const createDefaultShortcut = (): ShortcutSetting => ({
  code: 'Digit1',
  label: 'Ctrl+Alt+1',
  modifiers: {
    ctrl: true,
    shift: false,
    alt: true,
    meta: false,
  },
});

const createDefaultSettings = (): Settings => ({
  priceRefreshInterval: 10,
  klineRefreshInterval: 30,
  toggleShortcut: createDefaultShortcut(),
});

const buildShortcutLabel = (
  code: string,
  modifiers: ShortcutSetting['modifiers']
): string => {
  const parts: string[] = [];
  if (modifiers.ctrl) parts.push('Ctrl');
  if (modifiers.shift) parts.push('Shift');
  if (modifiers.alt) parts.push('Alt');
  if (modifiers.meta) parts.push('Meta');
  parts.push(readableKeyFromCode(code));
  return parts.join('+');
};

const readableKeyFromCode = (code: string): string => {
  if (code.startsWith('Key')) {
    return code.replace('Key', '').toUpperCase();
  }

  if (code.startsWith('Digit')) {
    return code.replace('Digit', '');
  }

  return code;
};

const normalizeShortcut = (value?: unknown): ShortcutSetting => {
  if (!value || typeof value !== 'object') {
    return createDefaultShortcut();
  }

  const record = value as Record<string, unknown>;
  const rawModifiers = record.modifiers as Record<string, unknown> | undefined;
  const modifiers = {
    ctrl: Boolean(rawModifiers?.ctrl),
    shift: Boolean(rawModifiers?.shift),
    alt: Boolean(rawModifiers?.alt),
    meta: Boolean(rawModifiers?.meta),
  };

  const code = typeof record.code === 'string' ? record.code : 'KeyF';
  const label =
    typeof record.label === 'string'
      ? record.label
      : buildShortcutLabel(code, modifiers);

  return {
    code,
    label,
    modifiers,
  };
};

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(createDefaultSettings());
  const shortcutStatus = ref<ShortcutStatus>('unknown');

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('futures_settings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        settings.value = {
          ...createDefaultSettings(),
          ...parsedSettings,
          toggleShortcut: normalizeShortcut(parsedSettings?.toggleShortcut),
        };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      settings.value = createDefaultSettings();
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('futures_settings', JSON.stringify(settings.value));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    settings.value = { ...settings.value, ...newSettings };
  };

  const resetSettings = () => {
    settings.value = createDefaultSettings();
    shortcutStatus.value = 'unknown';
  };

  const applyShortcut = async (
    shortcut?: ShortcutSetting
  ): Promise<boolean> => {
    const normalizedShortcut = normalizeShortcut(
      shortcut ?? settings.value.toggleShortcut
    );

    if (shortcut) {
      settings.value = { ...settings.value, toggleShortcut: normalizedShortcut };
    }

    if (!isTauriEnvironment()) {
      shortcutStatus.value = 'unsupported';
      return false;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('register_toggle_shortcut', {
        shortcut: {
          code: normalizedShortcut.code,
          modifiers: normalizedShortcut.modifiers,
        },
      });
      shortcutStatus.value = 'active';
      return true;
    } catch (error) {
      console.error('Failed to register shortcut:', error);
      shortcutStatus.value = 'failed';
      return false;
    }
  };

  watch(settings, saveSettings, { deep: true });

  return {
    settings,
    shortcutStatus,
    loadSettings,
    updateSettings,
    resetSettings,
    applyShortcut,
    buildShortcutLabel,
  };
});
