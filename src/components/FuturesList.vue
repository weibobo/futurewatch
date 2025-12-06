<script setup lang="ts">
import { useFuturesStore } from '../stores/futures';
import { onMounted, ref } from 'vue';
import KLineChartSimple from './KLineChartSimple.vue';
import EditFutureModal from './EditFutureModal.vue';
import Icon from './Icon.vue';

const store = useFuturesStore();
const expandedId = ref<string | null>(null);
const editingFuture = ref<any>(null);

const toggleExpand = (id: string) => {
    expandedId.value = expandedId.value === id ? null : id;
};

const startEdit = (future: any) => {
    editingFuture.value = future;
};

const deletingId = ref<string | null>(null);

const startDelete = (id: string) => {
    deletingId.value = id;
};

const confirmDelete = () => {
    if (deletingId.value) {
        store.deleteFuture(deletingId.value);
        deletingId.value = null;
    }
};

const cancelDelete = () => {
    deletingId.value = null;
};

onMounted(() => {
  store.init();
});

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
};

const formatPercent = (percent: number) => {
  return (percent * 100).toFixed(2) + '%';
};

const hasSpaceForSymbol = (item: any) => {
  // 根据名字长度判断是否有空间显示symbol
  // 简单规则：名字长度 <= 6 时显示symbol，超过则隐藏
  return (item.name || '').length <= 6;
};

const formatSignedValue = (value: number, decimals = 2, suffix = '') => {
  if (typeof value !== 'number' || isNaN(value)) {
    return `+${(0).toFixed(decimals)}${suffix}`;
  }
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}${suffix}`;
};

const formatPnLAmount = (item: any) => {
  const { amount } = store.getPnL(item);
  return formatSignedValue(amount);
};

const formatPnLPercent = (item: any) => {
  const { percent } = store.getPnL(item);
  return formatSignedValue(percent * 100) + '%';
};

</script>

<template>
  <div class="flex-1 overflow-auto bg-white p-2 space-y-2">
    <div v-for="item in store.futures" :key="item.id" 
         class="bg-white rounded-lg p-3 hover:bg-gray-50 transition-all group border border-gray-100 hover:border-gray-300 hover:shadow-sm">
      <div @click="toggleExpand(item.id)" class="cursor-pointer">
        <div class="flex justify-between items-center mb-1">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <h3 class="font-bold text-gray-900 text-sm truncate flex-shrink-0">{{ item.name }}</h3>
            <span v-if="hasSpaceForSymbol(item)" class="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">({{ item.symbol }})</span>
            <!-- Action Buttons - 显示在名称后面 -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0">
              <button @click.stop="startEdit(item)" class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded font-medium transition-colors flex items-center">
                <Icon type="edit" :size="14" />
              </button>
              <button @click.stop="startDelete(item.id)" class="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-1.5 py-0.5 rounded font-medium transition-colors flex items-center">
                <Icon type="delete" :size="14" />
              </button>
            </div>
          </div>
          <div class="text-right">
            <div class="flex items-center gap-2 justify-end">
              <div class="font-mono text-base font-medium text-gray-900">{{ formatPrice(item.lastPrice) }}</div>
              <div class="text-sm font-medium bg-opacity-10 px-1.5 py-0.5 rounded" :class="{
                'text-red-600 bg-red-600': item.changePercent >= 0,
                'text-green-600 bg-green-600': item.changePercent < 0
              }">
                {{ item.changePercent >= 0 ? '+' : '' }}{{ formatPercent(item.changePercent) }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Position and P&L Section -->
        <div v-if="item.price && item.quantity && item.quantity > 0" class="flex justify-between items-center">
          <span class="text-xs text-gray-500">
            {{ (item.tradeType === 'long' ? '多' : '空') + ' ' + item.quantity + ' @ ' + item.price.toFixed(2) }}
          </span>
          
          <!-- P&L -->
          <div class="text-xs font-medium flex items-center gap-1">
            <span :class="{'text-red-600': (store.getPnL(item).amount) >= 0, 'text-green-600': (store.getPnL(item).amount) < 0}">{{ formatPnLAmount(item) }}</span>
            <span class="text-gray-500">{{ formatPnLPercent(item) }}</span>
          </div>
        </div>
      </div>

      
      <!-- Chart Expansion -->
      <div v-if="expandedId === item.id" class="mt-3 border-t border-gray-50 pt-2" @click.stop>
         <KLineChartSimple :symbol="item.symbol" :height="220" />
      </div>
    </div>
    
    <!-- Edit Modal -->
    <EditFutureModal 
      v-if="editingFuture" 
      :future="editingFuture" 
      @close="editingFuture = null" 
    />
    
    <!-- Delete Confirmation Modal -->
    <div v-if="deletingId" class="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div @click.stop class="bg-white rounded-xl shadow-2xl w-full max-w-xs border border-gray-200 overflow-hidden">
        <div class="p-4 text-center">
          <div class="text-gray-900 font-medium mb-2">确认删除</div>
          <div class="text-gray-600 text-sm mb-4">确定要删除这个期货吗？此操作无法撤销。</div>
          <div class="flex gap-2">
            <button 
              @click="confirmDelete" 
              class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded text-sm transition-colors shadow-sm"
            >
              确认删除
            </button>
            <button 
              @click="cancelDelete" 
              class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 rounded text-sm transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
