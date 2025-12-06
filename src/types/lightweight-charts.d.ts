// Lightweight Charts类型定义
declare module 'lightweight-charts' {
  export enum ColorType {
    Solid = 0,
    VerticalGradient = 1,
    HorizontalGradient = 2,
  }

  export enum LineStyle {
    Solid = 0,
    Dotted = 1,
    Dashed = 2,
    LargeDashed = 3,
    SparseDotted = 4,
  }

  export enum CrosshairMode {
    Normal = 0,
    Magnet = 1,
  }

  export enum priceFormatType {
    custom = 'custom',
  }

  export interface Time {
    businessDay?: number;
    year: number;
    month: number;
    day: number;
  }

  export interface ChartOptions {
    layout?: {
      background?: { type: ColorType; color: string };
      textColor?: string;
    };
    grid?: {
      vertLines?: { color: string };
      horzLines?: { color: string };
    };
    width?: number;
    height?: number;
    timeScale?: {
      timeVisible?: boolean;
      secondsVisible?: boolean;
    };
    rightPriceScale?: {
      visible?: boolean;
      borderColor?: string;
    };
    crosshair?: {
      mode?: CrosshairMode;
      vertLine?: {
        width?: number;
        color?: string;
        style?: LineStyle;
      };
      horzLine?: {
        width?: number;
        color?: string;
        style?: LineStyle;
      };
    };
  }

  export interface CandlestickSeriesOptions {
    upColor?: string;
    downColor?: string;
    borderVisible?: boolean;
    wickUpColor?: string;
    wickDownColor?: string;
    priceFormat?: {
      type?: priceFormatType;
      formatter?: (price: number) => string;
      minMove?: number;
    };
  }

  export interface CandlestickData {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
  }

  export interface IChartApi {
    addCandlestickSeries(options?: CandlestickSeriesOptions): CandlestickSeries;
    timeScale(): {
      fitContent(): void;
    };
    applyOptions(options: Partial<ChartOptions>): void;
    remove(): void;
    subscribeCrosshairMove(callback: (param: any) => void): void;
  }

  export interface CandlestickSeries {
    setData(data: CandlestickData[]): void;
  }

  export function createChart(container: HTMLElement, options?: ChartOptions): IChartApi;
}