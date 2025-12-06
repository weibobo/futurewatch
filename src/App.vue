<script setup lang="ts">
import TitleBar from './components/TitleBar.vue';
import FuturesList from './components/FuturesList.vue';
import AddFutureModal from './components/AddFutureModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import Icon from './components/Icon.vue';
import { ref, onMounted } from 'vue';
import { useFuturesStore } from './stores/futures';

const showAddModal = ref(false);
const showSettingsModal = ref(false);
const futuresStore = useFuturesStore();

// 初始化store
onMounted(async () => {
  await futuresStore.init();
});

// 刷新价格数据
const refreshPrices = async () => {
  await futuresStore.refreshPrices();
};
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 shadow-2xl relative">
    <TitleBar />
    <div class="flex-1 overflow-hidden flex flex-col">
       <!-- Header / Summary could go here -->
       <div class="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">市场监控</span>
          <div class="flex gap-2">
            <button @click="refreshPrices" class="text-xs bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-medium transition-colors shadow-sm flex items-center justify-center" title="刷新">
              <Icon type="refresh" :size="14" />
            </button>
            <button @click="showAddModal = true" class="text-xs bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md font-medium transition-colors shadow-sm flex items-center justify-center" title="添加">
              <Icon type="add" :size="14" />
            </button>
            <button @click="showSettingsModal = true" class="text-xs bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md font-medium transition-colors shadow-sm flex items-center justify-center" title="设置">
              <Icon type="settings" :size="14" />
            </button>
          </div>
       </div>
       <FuturesList />
    </div>
    
    <AddFutureModal v-if="showAddModal" @close="showAddModal = false" />
    <SettingsModal v-if="showSettingsModal" @close="showSettingsModal = false" />
  </div>
</template>