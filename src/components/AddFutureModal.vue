<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useFuturesStore } from '../stores/futures';
import { FUTURES_OPTIONS, CATEGORIES, searchFutures, type FutureOption } from '../data/futuresList';
import { TradeType, AlertType, type PriceAlert } from '../types';

const emit = defineEmits(['close']);
const store = useFuturesStore();

const symbol = ref('');
const name = ref('');
const tradeType = ref<TradeType>(TradeType.LONG);
const price = ref<number | undefined>(undefined);
const quantity = ref<number | undefined>(undefined);
const alerts = ref<PriceAlert[]>([
    { type: AlertType.RISE, price: 0 },
    { type: AlertType.FALL, price: 0 }
]);

// 下拉选择相关
const showDropdown = ref(false);
const searchTerm = ref('');
const selectedCategory = ref('all');
const selectedIndex = ref(-1);
const searchInputRef = ref<HTMLInputElement | null>(null);

// 过滤后的选项
const filteredOptions = computed(() => {
  return searchFutures(searchTerm.value, selectedCategory.value);
});

// 切换下拉框
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
  if (showDropdown.value) {
    // 不要重置搜索框，保持用户之前输入的内容
    // searchTerm.value = symbol.value || '';
    selectedIndex.value = -1;
    nextTick(() => {
      const container = document.querySelector('.dropdown-trigger') as HTMLElement;
      if (container) {
        calculateDropdownPosition(container);
      }
      // 聚焦到搜索框
      if (searchInputRef.value) {
        searchInputRef.value.focus();
        searchInputRef.value.select();
      }
    });
  }
};

// 选择期货
const selectFuture = (future: FutureOption) => {
  symbol.value = future.symbol; // 只有选择时才更新主symbol
  name.value = future.name;
  searchTerm.value = future.symbol; // 搜索框也更新
  showDropdown.value = false;
  selectedIndex.value = -1;
};

// 键盘导航
const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value) return;
  
  const options = filteredOptions.value;
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, options.length - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
      break;
    case 'Enter':
      event.preventDefault();
      if (selectedIndex.value >= 0 && options[selectedIndex.value]) {
        selectFuture(options[selectedIndex.value]);
      } else {
        // 没有选择项时关闭下拉框
        showDropdown.value = false;
      }
      break;
    case 'Escape':
      showDropdown.value = false;
      selectedIndex.value = -1;
      break;
  }
};

// 输入变化时更新搜索
const onSearchInput = () => {
  // 搜索时只更新过滤，不自动更新主symbol，等用户选择
  name.value = ''; // 清空名称，让用户重新选择
  selectedIndex.value = -1;
};

// 计算下拉框位置
const dropdownPosition = ref({ top: 0, left: 0, right: 0, width: 0 });

// 计算下拉框位置
const calculateDropdownPosition = (container: HTMLElement) => {
  const rect = container.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const modalTop = 0; // 模态框居中，从顶部开始计算
  
  dropdownPosition.value = {
    top: rect.bottom + 2,
    left: rect.left,
    right: rect.right,
    width: rect.width
  };
  
  // 如果下拉框超出屏幕底部，向上显示
  if (dropdownPosition.value.top + 320 > viewportHeight) {
    dropdownPosition.value.top = rect.top - 320;
  }
};

// 点击外部关闭下拉框
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative') && !target.closest('.fixed')) {
    showDropdown.value = false;
    selectedIndex.value = -1;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const add = () => {
    if(!symbol.value || symbol.value.trim() === '') {
        return;
    }
    
    try {
        store.addFuture({
            id: Date.now().toString(),
            symbol: symbol.value.toUpperCase(),
            name: name.value || symbol.value.toUpperCase(),
            lastPrice: price.value || 0, // Mock init price
            changePercent: 0,
            changeAmount: 0,
            tradeType: tradeType.value,
            price: price.value,
            quantity: quantity.value,
            alerts: alerts.value.filter(alert => alert.price > 0) // 只保存设置了价格的告警
        });
        
        emit('close');
    } catch (error) {
        console.error('Error adding future:', error);
    }
};
</script>

<template>
  <div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" @click.self="$emit('close')">
     <div @click.stop class="bg-white rounded-xl shadow-2xl w-full max-w-xs border border-gray-200 overflow-hidden">
        <div class="p-3 border-b border-gray-100 font-bold flex justify-between text-gray-900">
            <span>添加期货</span>
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <div class="p-4 space-y-3">
            <div>
                <label class="block text-xs text-gray-500 font-medium mb-1">交易代码</label>
                <div class="relative">
                    <div 
                        @click="toggleDropdown"
                        class="dropdown-trigger w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-gray-900 cursor-pointer flex items-center justify-between"
                    >
                        <span>{{ symbol || '选择或输入交易代码...' }}</span>
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                    
                    <!-- 下拉选项 -->
                    <div v-if="showDropdown" class="fixed bg-white border border-gray-200 rounded shadow-lg z-[10001]" 
                         :style="{
                           top: dropdownPosition.top + 'px',
                           left: dropdownPosition.left + 'px',
                           right: dropdownPosition.right + 'px',
                           width: dropdownPosition.width + 'px',
                           maxHeight: '320px'
                         }">
                        <!-- 搜索框 -->
                        <div class="p-2 border-b border-gray-100">
                            <input 
                                ref="searchInputRef"
                                v-model="searchTerm" 
                                @input="onSearchInput"
                                @keydown="handleKeydown"
                                class="search-input w-full px-2 py-1 text-sm text-gray-900 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                                placeholder="搜索..."
                            />
                        </div>
                        
                        <!-- 分类筛选 -->
                        <div class="p-2 border-b border-gray-100 flex gap-1 flex-wrap">
                            <button 
                                v-for="cat in CATEGORIES" 
                                :key="cat.value"
                                @click="selectedCategory = cat.value"
                                :class="{
                                    'bg-blue-600 text-white': selectedCategory === cat.value,
                                    'bg-gray-100 text-gray-600 hover:bg-gray-200': selectedCategory !== cat.value
                                }"
                                class="text-xs px-2 py-1 rounded transition-colors"
                            >
                                {{ cat.label }}
                            </button>
                        </div>
                        
                        <!-- 选项列表 -->
                        <div class="overflow-y-auto" style="max-height: 200px;">
                            <div 
                                v-for="(option, index) in filteredOptions" 
                                :key="option.symbol"
                                @click="selectFuture(option)"
                                :class="{
                                    'bg-blue-50 text-blue-600': index === selectedIndex,
                                    'hover:bg-gray-50': index !== selectedIndex
                                }"
                                class="px-3 py-2 cursor-pointer text-sm border-b border-gray-50 last:border-b-0"
                            >
                                <div class="flex items-center gap-2 min-w-0">
                                    <span class="text-xs font-medium text-gray-900 truncate">{{ option.name }}</span>
                                    <span class="font-mono text-[11px] text-gray-400 flex-shrink-0">({{ option.symbol }})</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 无结果 -->
                        <div v-if="filteredOptions.length === 0" class="p-3 text-center text-sm text-gray-500">
                            未找到匹配的期货
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 自动填充的名称显示 -->
            <div v-if="name">
                <label class="block text-xs text-gray-500 font-medium mb-1">名称</label>
                <div class="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-900">
                    {{ name }}
                </div>
            </div>
            <div class="flex gap-2">
                <div class="w-16">
                    <label class="block text-xs text-gray-500 font-medium mb-1">类型</label>
                    <select v-model="tradeType" class="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-gray-900">
                        <option :value="TradeType.LONG">多</option>
                        <option :value="TradeType.SHORT">空</option>
                    </select>
                </div>
                <div class="flex-1">
                    <label class="block text-xs text-gray-500 font-medium mb-1">价格</label>
                    <input v-model.number="price" type="number" class="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-gray-900" placeholder="0.00" />
                </div>
                <div class="w-20">
                    <label class="block text-xs text-gray-500 font-medium mb-1">数量</label>
                    <input v-model.number="quantity" type="number" class="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-gray-900" placeholder="0" />
                </div>
            </div>
            
            <!-- 价格告警 -->
            <div>
                <label class="block text-xs text-gray-500 font-medium mb-2">价格告警</label>
                <div class="space-y-2">
                    <div class="flex items-center gap-2">
                        <select v-model="alerts[0].type" class="flex-shrink-0 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900">
                            <option :value="AlertType.RISE">上涨</option>
                            <option :value="AlertType.FALL">下跌</option>
                        </select>
                        <span class="text-xs text-gray-500">超过</span>
                        <input v-model.number="alerts[0].price" type="number" class="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900" placeholder="0.00 (不设置)" />
                    </div>
                    <div class="flex items-center gap-2">
                        <select v-model="alerts[1].type" class="flex-shrink-0 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900">
                            <option :value="AlertType.RISE">上涨</option>
                            <option :value="AlertType.FALL">下跌</option>
                        </select>
                        <span class="text-xs text-gray-500">低于</span>
                        <input v-model.number="alerts[1].price" type="number" class="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900" placeholder="0.00 (不设置)" />
                    </div>
                </div>
            </div>
            <button @click="add()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm transition-colors mt-2 shadow-sm">
                添加到监控列表
            </button>
        </div>
     </div>
  </div>
</template>
