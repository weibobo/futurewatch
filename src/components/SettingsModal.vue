<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '../stores/settings';

const emit = defineEmits(['close']);
const settingsStore = useSettingsStore();

// 刷新间隔设置
const priceInterval = ref(settingsStore.settings.priceRefreshInterval);
const klineInterval = ref(settingsStore.settings.klineRefreshInterval);

// 快捷键设置
const shortcuts = ref([
    { id: 'toggle_window', name: '显示/隐藏窗口', key: 'Ctrl+Shift+F', current: 'Ctrl+Shift+F' },
]);

// 快捷键编辑相关
const editingShortcut = ref<string | null>(null);
const tempKey = ref('');

const startEdit = (shortcutId: string) => {
    editingShortcut.value = shortcutId;
    tempKey.value = '';
};

const handleKeyDown = (event: KeyboardEvent) => {
    if (!editingShortcut.value) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    let keyCombo = '';
    
    if (event.ctrlKey) keyCombo += 'Ctrl+';
    if (event.shiftKey) keyCombo += 'Shift+';
    if (event.altKey) keyCombo += 'Alt+';
    if (event.metaKey) keyCombo += 'Meta+';
    
    const mainKey = event.key;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(mainKey)) return;
    
    keyCombo += mainKey;
    tempKey.value = keyCombo;
};

const saveShortcut = (shortcutId: string) => {
    const shortcut = shortcuts.value.find(s => s.id === shortcutId);
    if (shortcut && tempKey.value) {
        shortcut.current = tempKey.value;
        // TODO: 保存到Tauri配置
    }
    editingShortcut.value = null;
    tempKey.value = '';
};

const cancelEdit = () => {
    editingShortcut.value = null;
    tempKey.value = '';
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
                                @input="handlePriceIntervalChange($event.target.value)"
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
                                @input="handleKlineIntervalChange($event.target.value)"
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
                    <div v-for="shortcut in shortcuts" :key="shortcut.id" class="flex items-center justify-between py-1.5 border-b border-gray-50">
                        <span class="text-sm text-gray-700">{{ shortcut.name }}</span>
                        <div class="flex items-center gap-2">
                            <button 
                                v-if="editingShortcut === shortcut.id"
                                @click="saveShortcut(shortcut.id)"
                                class="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                保存
                            </button>
                            <button 
                                v-else
                                @click="startEdit(shortcut.id)"
                                class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                                编辑
                            </button>
                            
                            <div class="w-24 px-2 py-1 text-center">
                                <div v-if="editingShortcut === shortcut.id" class="text-xs text-blue-600 font-mono bg-blue-50 rounded">
                                    {{ tempKey || '请按键...' }}
                                </div>
                                <div v-else class="text-xs text-gray-600 font-mono bg-gray-50 rounded">
                                    {{ shortcut.current }}
                                </div>
                            </div>
                            
                            <button 
                                v-if="editingShortcut === shortcut.id"
                                @click="cancelEdit"
                                class="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                            >
                                取消
                            </button>
                        </div>
                    </div>
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
