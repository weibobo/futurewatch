<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

const handleMouseDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest('[data-tauri-drag-region="false"]')) {
    return;
  }

  appWindow.startDragging().catch(error => {
    console.error('拖拽失败:', error);
  });
};

const minimize = async () => {
  try {
    await appWindow.minimize();
  } catch (error) {
    console.error('最小化失败:', error);
  }
};

const close = async () => {
  try {
    await appWindow.hide();
  } catch (error) {
    console.error('关闭失败:', error);
  }
};
</script>

<template>
  <div
    class="h-8 bg-white border-b border-gray-200 flex justify-between items-center select-none shadow-sm"
    data-tauri-drag-region
    @mousedown="handleMouseDown"
  >
    <div class="px-3 text-xs font-bold text-gray-800 flex items-center gap-2">
      <img src="/icon.svg" alt="FutureWatch" class="w-4 h-4" />
      FutureWatch
    </div>
    <div class="flex h-full" data-tauri-drag-region="false">
      <button
        data-tauri-drag-region="false"
        @click.stop="minimize"
        class="h-full w-8 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
      <button
        data-tauri-drag-region="false"
        @click.stop="close"
        class="h-full w-8 hover:bg-red-500 hover:text-white flex items-center justify-center text-gray-500 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  </div>
</template>
