<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useSettingsStore } from '../stores/settings';
import type { ShortcutSetting } from '../stores/settings';

const emit = defineEmits(['close']);
const settingsStore = useSettingsStore();

// 刷新间隔设置
const priceInterval = ref(settingsStore.settings.priceRefreshInterval);
const klineInterval = ref(settingsStore.settings.klineRefreshInterval);

// 快捷键编辑相关
const isEditingShortcut = ref(false);
const tempShortcut = ref<ShortcutSetting | null>(null);

const cloneShortcut = (shortcut: ShortcutSetting): ShortcutSetting => ({
  code: shortcut.code,
  label: shortcut.label,
  modifiers: { ...shortcut.modifiers },
});

const createShortcutFromEvent = (event: KeyboardEvent): ShortcutSetting | null => {
  if (!event.code || ['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
    return null;
  }

  const modifiers = {
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
    meta: event.metaKey,
  };

  const label = settingsStore.buildShortcutLabel(event.code, modifiers);

  return {
    code: event.code,
    label,
    modifiers,
  };
};

const shortcutLabel = computed(() => {
  if (isEditingShortcut.value) {
    return tempShortcut.value?.label || '请按键...';
  }
  return settingsStore.settings.toggleShortcut.label;
});

const shortcutStatusMessage = computed(() => {
  if (settingsStore.shortcutStatus === 'failed') {
    return '⚠️ 快捷键注册失败，组合可能被其他程序占用，请尝试更换。';
  }
  if (settingsStore.shortcutStatus === 'unsupported') {
    return '⚠️ 当前运行在浏览器模式，无法注册系统快捷键。';
  }
  return '';
});

const startEdit = () => {
  isEditingShortcut.value = true;
  tempShortcut.value = cloneShortcut(settingsStore.settings.toggleShortcut);
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (!isEditingShortcut.value) return;

  event.preventDefault();
  event.stopPropagation();

  const nextShortcut = createShortcutFromEvent(event);
  if (nextShortcut) {
    tempShortcut.value = nextShortcut;
  }
};

const saveShortcut = async () => {
  if (tempShortcut.value) {
    await settingsStore.applyShortcut(tempShortcut.value);
  }
  isEditingShortcut.value = false;
  tempShortcut.value = null;
};

const cancelEdit = () => {
  isEditingShortcut.value = false;
  tempShortcut.value = null;
};

// 刷新间隔处理
const saveRefreshIntervals = () => {
    settingsStore.updateSettings({
        priceRefreshInterval: priceInterval.value,
        klineRefreshInterval: klineInterval.value,
    });
    emit('close');
};

const validateInterval = (value: number, min: number = 1, max: number = 60) => {
    if (value < min) return min;
    if (value > max) return max;
    return value;
};

// 当输入值改变时验证
const handlePriceIntervalChange = (value: string) => {
    const num = parseInt(value) || 1;
    priceInterval.value = validateInterval(num, 1, 60);
};

const handleKlineIntervalChange = (value: string) => {
    const num = parseInt(value) || 1;
    klineInterval.value = validateInterval(num, 1, 60);
};

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    // 加载设置
    settingsStore.loadSettings();
    priceInterval.value = settingsStore.settings.priceRefreshInterval;
    klineInterval.value = settingsStore.settings.klineRefreshInterval;
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown, true);
});
</script>

<template>
  <div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" @click.self="$emit('close')">
     <div @click.stop class="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden">
        <div class="p-3 border-b border-gray-100 font-bold flex justify-between text-gray-900">
            <span>系统设置</span>
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <div class="p-4 space-y-3">
            <!-- 刷新间隔设置 -->
            <div>
                <h3 class="text-sm font-bold text-gray-900 mb-2">刷新间隔设置</h3>
                <div class="space-y-2">
                    <!-- 价格刷新间隔 -->
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-900">价格刷新间隔</span>
                        <div class="flex items-center gap-2">
                            <input 
                                type="number" 
                                v-model.number="priceInterval"
                                @input="handlePriceIntervalChange(($event.target as HTMLInputElement).value)"
                                min="1" 
                                max="60" 
                                class="w-16 px-2 py-1 text-sm text-gray-900 bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
                            />
                            <span class="text-sm font-semibold text-blue-600">秒</span>
                        </div>
                    </div>
                    
                    <!-- K线刷新间隔 -->
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-900">K线刷新间隔</span>
                        <div class="flex items-center gap-2">
                            <input 
                                type="number" 
                                v-model.number="klineInterval"
                                @input="handleKlineIntervalChange(($event.target as HTMLInputElement).value)"
                                min="1" 
                                max="60" 
                                class="w-16 px-2 py-1 text-sm text-gray-900 bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
                            />
                            <span class="text-sm font-semibold text-blue-600">秒</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 快捷键设置 -->
            <div>
                <h3 class="text-sm font-bold text-gray-700 mb-2">快捷键设置</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between py-1.5 border-b border-gray-50">
                        <span class="text-sm text-gray-700 whitespace-nowrap">显示/隐藏</span>
                        <div class="flex items-center gap-2">
                            <button 
                                v-if="isEditingShortcut"
                                @click="saveShortcut"
                                class="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                保存
                            </button>
                            <button 
                                v-else
                                @click="startEdit"
                                class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                                编辑
                            </button>
                            
                            <div class="w-28 px-2 py-1 text-center">
                                <div :class="[
                                    'text-xs font-mono rounded px-2 py-1 transition-colors',
                                    isEditingShortcut ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-50'
                                ]">
                                    {{ shortcutLabel }}
                                </div>
                            </div>
                            
                            <button 
                                v-if="isEditingShortcut"
                                @click="cancelEdit"
                                class="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                    <p 
                        v-if="shortcutStatusMessage"
                        class="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1"
                    >
                        {{ shortcutStatusMessage }}
                    </p>
                </div>
            </div>
            
            <!-- 保存按钮 -->
            <div class="flex justify-end pt-2">
                <button 
                    @click="saveRefreshIntervals"
                    class="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    保存设置
                </button>
            </div>
        </div>
     </div>
  </div>
</template>
