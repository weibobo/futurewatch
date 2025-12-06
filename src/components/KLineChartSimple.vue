<script setup lang="ts">
import { createChart, CrosshairMode } from 'lightweight-charts';
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { useSettingsStore } from '../stores/settings';

const props = defineProps<{
  symbol: string;
  data?: any[]; 
  height?: number;
}>();

const settingsStore = useSettingsStore();

const chartContainer = ref<HTMLElement | null>(null);
const chart = ref<any>(null);
const candleSeries = ref<any>(null);
const isHovering = ref(false);
const currentTimeRange = ref('1H');
const chartData = ref<any[]>([]);
const klineUpdateInterval = ref<number | null>(null);

// 时间窗口选项
const timeRanges = [
  { label: '5分', value: '5M' },
  { label: '15分', value: '15M' },
  { label: '1小时', value: '1H' },
  { label: '4小时', value: '4H' },
  { label: '1天', value: '1D' },
];



// 生成图表数据
const generateChartData = () => {
  const data = [];
  let close = props.symbol.includes('BTC') ? 95000 : (props.symbol.includes('ETH') ? 3500 : 100);
  const now = Date.now() / 1000;
  
  const dataPoints: { [key: string]: number } = {
    '5M': 20,
    '15M': 16,
    '1H': 60,
    '4H': 48,
    '1D': 24,
  };
  
  const timeSpan: { [key: string]: number } = {
    '5M': 5 * 60,
    '15M': 15 * 60,
    '1H': 60 * 60,
    '4H': 4 * 60 * 60,
    '1D': 24 * 60 * 60,
  };
  
  const points = dataPoints[currentTimeRange.value] || 60;
  const startTime = now - (timeSpan[currentTimeRange.value] || 60 * 60);
  
  for (let i = 0; i < points; i++) {
    const timestamp = startTime + (timeSpan[currentTimeRange.value] / points) * i;
    const open = close;
    const change = (Math.random() - 0.5) * close * 0.01;
    const high = open + Math.abs(change) + Math.random() * Math.abs(change);
    const low = open - Math.abs(change) - Math.random() * Math.abs(change);
    close = open + change;
    
    data.push({
      time: timestamp,
      open,
      high,
      low,
      close
    });
  }
  
  chartData.value = data;
};

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return;

  const chartInstance = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: props.height || 200,
    layout: {
      background: { type: 0, color: 'transparent' },
      textColor: '#6b7280',
    },
    grid: {
      vertLines: { color: '#f3f4f6' },
      horzLines: { color: '#f3f4f6' },
    },
    crosshair: {
      mode: CrosshairMode.Normal, // 普通十字线模式
      vertLine: {
        width: 1,
        color: '#9ca3af',
        style: 2, // 虚线
      },
      horzLine: {
        width: 1,
        color: '#9ca3af',
        style: 2, // 虚线
      },
    },
  });

  chart.value = chartInstance;

  const candle = chartInstance.addCandlestickSeries({
    upColor: '#ef4444',
    downColor: '#22c55e',
    borderVisible: false,
    wickUpColor: '#ef4444',
    wickDownColor: '#22c55e',
  });

  candleSeries.value = candle;

  generateChartData();
  candle.setData(chartData.value);
  chartInstance.timeScale().fitContent();

  // 禁用鼠标悬停事件
  // chartInstance.subscribeCrosshairMove((param) => {
  //   isHovering.value = Boolean(param?.time);
  // });
};

// 监听时间窗口变化
const changeTimeRange = (range: string) => {
  currentTimeRange.value = range;
  generateChartData();
  
  if (candleSeries.value && chartData.value.length > 0) {
    candleSeries.value.setData(chartData.value);
    chart.value?.timeScale().fitContent();
  }
};

// 更新K线数据的函数
const updateKlineData = () => {
  if (chartData.value.length === 0) return;
  
  // 移除第一个数据点，添加新的数据点
  chartData.value.shift();
  
  const lastData = chartData.value[chartData.value.length - 1];
  const newTimestamp = lastData.time + (60 * 1000 / chartData.value.length); // 假设间隔
  const change = (Math.random() - 0.5) * lastData.close * 0.01;
  const newClose = lastData.close + change;
  
  chartData.value.push({
    time: newTimestamp,
    open: lastData.close,
    high: Math.max(lastData.close, newClose) + Math.random() * Math.abs(change),
    low: Math.min(lastData.close, newClose) - Math.random() * Math.abs(change),
    close: newClose
  });
  
  if (candleSeries.value) {
    candleSeries.value.setData(chartData.value);
  }
};

// 启动K线刷新
const startKlineUpdate = () => {
  const intervalMs = settingsStore.settings.klineRefreshInterval * 1000;
  klineUpdateInterval.value = setInterval(updateKlineData, intervalMs) as unknown as number;
};

// 停止K线刷新
const stopKlineUpdate = () => {
  if (klineUpdateInterval.value) {
    clearInterval(klineUpdateInterval.value);
    klineUpdateInterval.value = null;
  }
};

// 处理窗口大小变化
const handleResize = () => {
  if (chart.value && chartContainer.value) {
    chart.value.applyOptions({
      width: chartContainer.value.clientWidth,
    });
  }
};

// 监听K线刷新间隔变化
watch(() => settingsStore.settings.klineRefreshInterval, () => {
  if (klineUpdateInterval.value) {
    stopKlineUpdate();
    startKlineUpdate();
  }
});

onMounted(() => {
  settingsStore.loadSettings();
  initChart();
  startKlineUpdate();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  stopKlineUpdate();
  window.removeEventListener('resize', handleResize);
  if (chart.value) {
    chart.value.remove();
  }
});
</script>

<template>
  <div ref="chartContainer" class="w-full bg-white relative">
    <!-- 时间窗口选择器 -->
    <div class="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 p-1 flex gap-1">
      <button 
        v-for="range in timeRanges" 
        :key="range.value"
        @click="changeTimeRange(range.value)"
        :class="{
          'bg-blue-600 text-white': currentTimeRange === range.value,
          'text-gray-600 hover:bg-gray-100': currentTimeRange !== range.value
        }"
        class="text-xs px-2 py-1 rounded transition-colors"
      >
        {{ range.label }}
      </button>
    </div>
    
    <!-- 悬停信息已禁用 -->
  </div>
</template>
