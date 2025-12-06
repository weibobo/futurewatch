<script setup lang="ts">
import { ref, watch } from 'vue';
import { useFuturesStore } from '../stores/futures';
import { FutureItem, TradeType, AlertType, type PriceAlert } from '../types';

const props = defineProps<{
  future: FutureItem;
}>();

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

// 初始化表单数据
watch(() => props.future, (newFuture) => {
  if (newFuture) {
    symbol.value = newFuture.symbol;
    name.value = newFuture.name;
    tradeType.value = newFuture.tradeType || TradeType.EMPTY;
    price.value = newFuture.price;
    quantity.value = newFuture.quantity;
    
    // 初始化告警，确保有2个告警项
    alerts.value = [
      newFuture.alerts?.[0] || { type: AlertType.RISE, price: 0 },
      newFuture.alerts?.[1] || { type: AlertType.FALL, price: 0 }
    ];
  }
}, { immediate: true });

const update = () => {
    if(!symbol.value || symbol.value.trim() === '') {
        return;
    }
    
    store.updateFuture(props.future.id, {
        symbol: symbol.value.toUpperCase(),
        name: name.value || symbol.value.toUpperCase(),
        tradeType: tradeType.value,
        price: price.value,
        quantity: quantity.value,
        alerts: alerts.value.filter(alert => alert.price > 0) // 只保存设置了价格的告警
    });
    
    emit('close');
};
</script>

<template>
  <div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" @click.self="$emit('close')">
     <div @click.stop class="bg-white rounded-xl shadow-2xl w-full max-w-xs border border-gray-200 overflow-hidden">
        <div class="p-3 border-b border-gray-100 font-bold flex justify-between text-gray-900">
            <span>编辑期货</span>
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <div class="p-4 space-y-3">
            <div>
                <label class="block text-xs text-gray-500 font-medium mb-1">交易代码</label>
                <div class="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-600">
                    {{ symbol }}
                </div>
            </div>
            <div>
                <label class="block text-xs text-gray-500 font-medium mb-1">名称</label>
                <div class="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-600">
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
            <div class="flex gap-2">
                <button @click="update" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm transition-colors shadow-sm">
                    保存修改
                </button>
                <button @click="$emit('close')" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 rounded text-sm transition-colors">
                    取消
                </button>
            </div>
        </div>
     </div>
  </div>
</template>