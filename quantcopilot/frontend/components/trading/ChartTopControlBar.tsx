"use client";

import React, { useState } from "react";
import { ChartType, IndicatorConfig } from "../../types/trading";
import { 
  CandlestickChart, 
  LineChart, 
  Activity, 
  BarChart3, 
  Maximize2, 
  Camera, 
  Sliders, 
  Check, 
  Layers, 
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Target,
  Cpu
} from "lucide-react";

interface ChartTopControlBarProps {
  symbol: string;
  timeframe: "1m" | "5m" | "15m" | "1h" | "1D";
  setTimeframe: (tf: "1m" | "5m" | "15m" | "1h" | "1D") => void;
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  indicators: IndicatorConfig;
  setIndicators: React.Dispatch<React.SetStateAction<IndicatorConfig>>;
  hoverCandle: { open: number; high: number; low: number; close: number; volume?: number; time?: string | number } | null;
  onOpenOrderModal: (side: "BUY" | "SELL") => void;
  onTakeSnapshot: () => void;
  onToggleFullscreen: () => void;
  onApplyPattern?: (patternType: "PATTERN_DOUBLE_BOTTOM" | "PATTERN_DOUBLE_TOP" | "PATTERN_HEAD_AND_SHOULDERS" | "PATTERN_BULL_FLAG" | "PATTERN_ASCENDING_TRIANGLE") => void;
  onScanPatterns?: () => void;
  isScanningPatterns?: boolean;
  detectedPatternsCount?: number;
}

export const ChartTopControlBar: React.FC<ChartTopControlBarProps> = ({
  symbol,
  timeframe,
  setTimeframe,
  chartType,
  setChartType,
  indicators,
  setIndicators,
  hoverCandle,
  onOpenOrderModal,
  onTakeSnapshot,
  onToggleFullscreen,
  onApplyPattern,
  onScanPatterns,
  isScanningPatterns = false,
  detectedPatternsCount = 0
}) => {
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
  const [showChartTypeMenu, setShowChartTypeMenu] = useState(false);
  const [showPatternMenu, setShowPatternMenu] = useState(false);

  const toggleIndicator = (key: keyof IndicatorConfig) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isPos = hoverCandle ? hoverCandle.close >= hoverCandle.open : true;
  const changePct = hoverCandle && hoverCandle.open 
    ? (((hoverCandle.close - hoverCandle.open) / hoverCandle.open) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-black border-b border-emerald-950 text-xs font-mono select-none shrink-0 gap-2">
      {/* Left: Symbol & Chart Type & Timeframe */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 font-bold text-emerald-100 bg-[#060c07] border border-emerald-900 px-2.5 py-1 rounded-md">
          <span className="text-emerald-400 font-extrabold">{symbol}</span>
          <span className="text-[10px] text-emerald-600 font-sans">NSE</span>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center bg-black border border-emerald-950 rounded-md p-0.5">
          {(["1m", "5m", "15m", "1h", "1D"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                timeframe === tf
                  ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                  : "text-emerald-500/70 hover:text-emerald-200"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Style Selector */}
        <div className="relative">
          <button
            onClick={() => setShowChartTypeMenu(!showChartTypeMenu)}
            className="flex items-center space-x-1 bg-[#060c07] border border-emerald-900 hover:border-emerald-700 px-2 py-1 rounded-md text-emerald-300 hover:text-white"
          >
            {chartType === "CANDLE" && <CandlestickChart className="h-3.5 w-3.5 text-emerald-400" />}
            {chartType === "HEIKIN_ASHI" && <Activity className="h-3.5 w-3.5 text-emerald-300" />}
            {chartType === "LINE" && <LineChart className="h-3.5 w-3.5 text-emerald-400" />}
            {chartType === "AREA" && <BarChart3 className="h-3.5 w-3.5 text-green-400" />}
            <span className="text-[11px] capitalize">{chartType.toLowerCase().replace("_", " ")}</span>
            <ChevronDown className="h-3 w-3 text-emerald-600" />
          </button>

          {showChartTypeMenu && (
            <div className="absolute left-0 top-full mt-1 w-36 bg-black border border-emerald-900 rounded-lg p-1 shadow-2xl z-40 space-y-0.5">
              {[
                { id: "CANDLE", label: "Candlestick" },
                { id: "HEIKIN_ASHI", label: "Heikin Ashi" },
                { id: "LINE", label: "Line Chart" },
                { id: "AREA", label: "Mountain/Area" }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setChartType(c.id as ChartType); setShowChartTypeMenu(false); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between ${
                    chartType === c.id ? "bg-emerald-500/20 text-emerald-400 font-bold" : "text-emerald-200 hover:bg-emerald-950/60"
                  }`}
                >
                  <span>{c.label}</span>
                  {chartType === c.id && <Check className="h-3 w-3 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Indicators Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
            className="flex items-center space-x-1.5 bg-[#060c07] border border-emerald-900 hover:border-emerald-700 px-2.5 py-1 rounded-md text-emerald-300 hover:text-white"
          >
            <Sliders className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px] font-bold">Indicators</span>
            <ChevronDown className="h-3 w-3 text-emerald-600" />
          </button>

          {showIndicatorMenu && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-black border border-emerald-900 rounded-xl p-2 shadow-2xl z-40 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono text-emerald-500/70 uppercase font-bold border-b border-emerald-950">
                Technical Overlays &amp; Oscillators
              </div>
              {[
                { key: "ema9" as const, label: "EMA 9 (Fast Trend)", color: "#10b981" },
                { key: "ema20" as const, label: "EMA 20 (Momentum)", color: "#22c55e" },
                { key: "ema50" as const, label: "EMA 50 (Major)", color: "#34d399" },
                { key: "ema200" as const, label: "SMA 200 (Long term)", color: "#f43f5e" },
                { key: "bollingerBands" as const, label: "Bollinger Bands (20, 2σ)", color: "#4ade80" },
                { key: "supertrend" as const, label: "SuperTrend (Buy/Sell)", color: "#10b981" },
                { key: "vwap" as const, label: "VWAP (Volume Weighted)", color: "#00ff66" },
                { key: "rsi" as const, label: "RSI (14) Oscillator Sub-Panel", color: "#ec4899" },
                { key: "macd" as const, label: "MACD (12, 26, 9) Sub-Panel", color: "#10b981" }
              ].map((ind) => (
                <button
                  key={ind.key}
                  onClick={() => toggleIndicator(ind.key)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-emerald-950/60 text-slate-300 text-xs transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ind.color }} />
                    <span className={indicators[ind.key] ? "font-bold text-white" : "text-emerald-400/80"}>{ind.label}</span>
                  </div>
                  {indicators[ind.key] && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Scan Patterns Button */}
        <button
          onClick={onScanPatterns}
          disabled={isScanningPatterns}
          title="Scan live candlestick wicks with AI morphological pattern detector"
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all shadow-sm ${
            isScanningPatterns
              ? "bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 animate-pulse cursor-wait"
              : "bg-gradient-to-r from-emerald-900/40 to-green-900/40 hover:from-emerald-800/50 hover:to-green-800/50 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white active:scale-95"
          }`}
        >
          <Cpu className={`h-3.5 w-3.5 ${isScanningPatterns ? "animate-spin text-emerald-300" : "text-emerald-400"}`} />
          <span>{isScanningPatterns ? "AI Scanning..." : "AI Scan Patterns"}</span>
          {detectedPatternsCount !== undefined && detectedPatternsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500 text-black font-extrabold">
              {detectedPatternsCount}
            </span>
          )}
        </button>

        {/* Classical Chart Patterns Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPatternMenu(!showPatternMenu);
              setShowIndicatorMenu(false);
              setShowChartTypeMenu(false);
            }}
            className="flex items-center space-x-1.5 bg-[#060c07] border border-emerald-900 hover:border-emerald-700 px-2.5 py-1 rounded-md text-emerald-300 hover:text-white transition-all shadow-sm"
          >
            <Target className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px] font-bold">Patterns &amp; Target</span>
            <ChevronDown className="h-3 w-3 text-emerald-600" />
          </button>

          {showPatternMenu && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-black border border-emerald-900 rounded-xl p-2 shadow-2xl z-40 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono text-emerald-500/70 uppercase font-bold border-b border-emerald-950 flex justify-between items-center">
                <span>Classical Chart Patterns</span>
                <span className="text-emerald-400 font-normal">Auto-Target</span>
              </div>
              {[
                { type: "PATTERN_DOUBLE_BOTTOM" as const, name: "Double Bottom (W)", desc: "Bullish Reversal & Neckline Target", icon: "W", color: "#10b981" },
                { type: "PATTERN_DOUBLE_TOP" as const, name: "Double Top (M)", desc: "Bearish Breakdown & Target", icon: "M", color: "#f43f5e" },
                { type: "PATTERN_HEAD_AND_SHOULDERS" as const, name: "Head & Shoulders", desc: "Classic Reversal with Neckline", icon: "H&S", color: "#f43f5e" },
                { type: "PATTERN_BULL_FLAG" as const, name: "Bull Flag Channel", desc: "Pole Height Continuation Target", icon: "FLAG", color: "#10b981" },
                { type: "PATTERN_ASCENDING_TRIANGLE" as const, name: "Ascending Triangle", desc: "Horizontal Resistance Breakout", icon: "TRI", color: "#00ff66" }
              ].map((p) => (
                <button
                  key={p.type}
                  onClick={() => {
                    if (onApplyPattern) onApplyPattern(p.type);
                    setShowPatternMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-emerald-950/60 text-left transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-5 rounded bg-black border border-emerald-900 text-[9px] font-bold flex items-center justify-center" style={{ color: p.color }}>
                      {p.icon}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-emerald-200 group-hover:text-white">{p.name}</div>
                      <div className="text-[9px] text-emerald-600">{p.desc}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black text-emerald-400 border border-emerald-900 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                    Apply
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Live OHLCV Crosshair values */}
      {hoverCandle ? (
        <div className="flex items-center space-x-3 text-[11px] text-emerald-400/80">
          <span>O: <strong className="text-emerald-100">₹{hoverCandle.open.toFixed(2)}</strong></span>
          <span>H: <strong className="text-emerald-100">₹{hoverCandle.high.toFixed(2)}</strong></span>
          <span>L: <strong className="text-emerald-100">₹{hoverCandle.low.toFixed(2)}</strong></span>
          <span>C: <strong className={isPos ? "text-emerald-400" : "text-rose-400"}>₹{hoverCandle.close.toFixed(2)}</strong></span>
          <span className={isPos ? "text-emerald-400" : "text-rose-400"}>({isPos ? "+" : ""}{changePct}%)</span>
          {hoverCandle.volume && (
            <span className="hidden md:inline text-emerald-600">Vol: {hoverCandle.volume.toLocaleString()}</span>
          )}
        </div>
      ) : (
        <div className="text-[11px] text-emerald-600/70 italic">Hover on candles to inspect OHLCV</div>
      )}

      {/* Right: Quick Buy/Sell Buttons & Snapshot/Fullscreen */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onOpenOrderModal("BUY")}
          className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold px-3 py-1 rounded-md text-xs transition-all shadow-sm active:scale-95"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>BUY</span>
        </button>
        <button
          onClick={() => onOpenOrderModal("SELL")}
          className="flex items-center space-x-1 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded-md text-xs transition-all shadow-sm active:scale-95"
        >
          <TrendingDown className="h-3.5 w-3.5" />
          <span>SELL</span>
        </button>

        <div className="h-4 w-px bg-emerald-950" />

        <button
          onClick={onTakeSnapshot}
          title="Save Chart Snapshot"
          className="p-1.5 text-emerald-500/70 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-md transition-colors"
        >
          <Camera className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleFullscreen}
          title="Toggle Fullscreen"
          className="p-1.5 text-emerald-500/70 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-md transition-colors"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
