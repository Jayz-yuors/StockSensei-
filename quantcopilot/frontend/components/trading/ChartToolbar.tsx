"use client";

import React, { useState } from "react";
import { DrawingToolType } from "../../types/trading";
import { 
  MousePointer, 
  Paintbrush, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Split, 
  Square, 
  Ruler, 
  Target, 
  Undo2, 
  Trash2, 
  Sparkles, 
  ChevronRight,
  Info,
  SlidersHorizontal,
  Palette
} from "lucide-react";

interface ChartToolbarProps {
  activeTool: DrawingToolType;
  setActiveTool: (tool: DrawingToolType) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onOpenGoalMatcher: () => void;
  onOpenOverview: () => void;
  onOpenOrderModal: () => void;
}

const COLORS = [
  { name: "Emerald", value: "#10b981" },
  { name: "Neon Green", value: "#00ff66" },
  { name: "Lime", value: "#84cc16" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Amber", value: "#f59e0b" },
  { name: "White", value: "#f0fdf4" }
];

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  activeTool,
  setActiveTool,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  onUndo,
  onClear,
  onOpenGoalMatcher,
  onOpenOverview,
  onOpenOrderModal
}) => {
  const [showPatternsMenu, setShowPatternsMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const patternTools: { type: DrawingToolType; name: string; icon: string; desc: string }[] = [
    { type: "PATTERN_DOUBLE_BOTTOM", name: "Double Bottom (W)", icon: "W", desc: "Bullish reversal target" },
    { type: "PATTERN_DOUBLE_TOP", name: "Double Top (M)", icon: "M", desc: "Bearish reversal breakdown" },
    { type: "PATTERN_HEAD_AND_SHOULDERS", name: "Head & Shoulders", icon: "H&S", desc: "Classic reversal with neckline" },
    { type: "PATTERN_BULL_FLAG", name: "Bull Flag Channel", icon: "FLAG", desc: "Continuation breakout" },
    { type: "PATTERN_ASCENDING_TRIANGLE", name: "Ascending Triangle", icon: "TRI", desc: "Horizontal resistance breakout" }
  ];


  return (
    <div className="absolute left-3 top-14 z-30 flex flex-col items-center bg-[#040805]/95 backdrop-blur-md border border-emerald-950 rounded-xl p-1.5 shadow-2xl space-y-1 select-none text-emerald-100">
      {/* Cursor / Select */}
      <button
        onClick={() => { setActiveTool("CURSOR"); setShowPatternsMenu(false); }}
        title="Cursor / Select (V)"
        className={`p-2 rounded-lg transition-all ${
          activeTool === "CURSOR"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
            : "hover:bg-emerald-950/80 hover:text-emerald-200 text-emerald-600"
        }`}
      >
        <MousePointer className="h-4 w-4" />
      </button>

      {/* Freehand Brush */}
      <button
        onClick={() => { setActiveTool("BRUSH"); setShowPatternsMenu(false); }}
        title="Freehand Brush Tool (B) - Draw on Chart"
        className={`p-2 rounded-lg transition-all relative ${
          activeTool === "BRUSH"
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
            : "hover:bg-emerald-950/80 hover:text-emerald-200 text-emerald-600"
        }`}
      >
        <Paintbrush className="h-4 w-4" />
        <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: strokeColor }} />
      </button>

      <div className="w-6 h-px bg-emerald-950 my-0.5" />

      {/* Short Position Risk-Reward Tool */}
      <button
        onClick={() => { setActiveTool("SHORT_POSITION"); setShowPatternsMenu(false); }}
        title="Short Position Risk/Reward Calculator (S)"
        className={`p-2 rounded-lg transition-all ${
          activeTool === "SHORT_POSITION"
            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
            : "hover:bg-emerald-950/80 hover:text-slate-100 text-rose-400/80"
        }`}
      >
        <TrendingDown className="h-4 w-4" />
      </button>

      {/* Long Position Risk-Reward Tool */}
      <button
        onClick={() => { setActiveTool("LONG_POSITION"); setShowPatternsMenu(false); }}
        title="Long Position Risk/Reward Calculator (L)"
        className={`p-2 rounded-lg transition-all ${
          activeTool === "LONG_POSITION"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
            : "hover:bg-emerald-950/80 hover:text-emerald-100 text-emerald-400/80"
        }`}
      >
        <TrendingUp className="h-4 w-4" />
      </button>

      {/* Trendline */}
      <button
        onClick={() => { setActiveTool("TRENDLINE"); setShowPatternsMenu(false); }}
        title="Trendline (T)"
        className={`p-2 rounded-lg transition-all ${
          activeTool === "TRENDLINE"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
            : "hover:bg-emerald-950/80 hover:text-emerald-200 text-emerald-600"
        }`}
      >
        <Minus className="h-4 w-4 transform -rotate-45" />
      </button>

      {/* Horizontal Ray / Support Line */}
      <button
        onClick={() => { setActiveTool("HORIZONTAL_RAY"); setShowPatternsMenu(false); }}
        title="Horizontal Support/Resistance Ray (H)"
        className={`p-2 rounded-lg transition-all ${
          activeTool === "HORIZONTAL_RAY"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
            : "hover:bg-emerald-950/80 hover:text-emerald-200 text-emerald-600"
        }`}
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* Fibonacci Retracement */}
      <button
        onClick={() => { setActiveTool("FIBONACCI"); setShowPatternsMenu(false); }}
        title="Fibonacci Retracement (F)"
        className={`p-2 rounded-lg transition-all ${
          activeTool === "FIBONACCI"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
            : "hover:bg-emerald-950/80 hover:text-emerald-200 text-emerald-600"
        }`}
      >
        <Split className="h-4 w-4" />
      </button>

      {/* Supply / Demand Zone Rectangle */}
      <button
        onClick={() => { setActiveTool("RECTANGLE"); setShowPatternsMenu(false); }}
        title="Demand / Supply Zone Box (R)"
        className={`p-2 rounded-lg transition-all ${
          activeTool === "RECTANGLE"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
            : "hover:bg-emerald-950/80 hover:text-emerald-200 text-emerald-600"
        }`}
      >
        <Square className="h-4 w-4" />
      </button>

      {/* Measurement Ruler */}
      <button
        onClick={() => { setActiveTool("RULER"); setShowPatternsMenu(false); }}
        title="Price & Date Measurement Ruler (M)"
        className={`p-2 rounded-lg transition-all ${
          activeTool === "RULER"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
            : "hover:bg-emerald-950/80 hover:text-emerald-200 text-emerald-600"
        }`}
      >
        <Ruler className="h-4 w-4" />
      </button>

      {/* Chart Patterns Flyout */}
      <div className="relative">
        <button
          onClick={() => setShowPatternsMenu(!showPatternsMenu)}
          title="Classical Chart Patterns (Double Bottom, H&S, Flag...)"
          className={`p-2 rounded-lg transition-all flex items-center justify-center ${
            activeTool.startsWith("PATTERN_")
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
              : "hover:bg-emerald-950/80 hover:text-emerald-200 text-emerald-600"
          }`}
        >
          <span className="text-xs font-black font-mono">P</span>
        </button>

        {showPatternsMenu && (
          <div className="absolute left-full top-0 ml-2 w-64 bg-[#040805] border border-emerald-950 rounded-xl p-2 shadow-2xl z-40 space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono text-emerald-500/70 uppercase tracking-wider font-bold border-b border-emerald-950 pb-1">
              Chart Pattern Templates
            </div>
            {patternTools.map((p) => (
              <button
                key={p.type}
                onClick={() => {
                  setActiveTool(p.type);
                  setShowPatternsMenu(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-mono text-left transition-all ${
                  activeTool === p.type ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "hover:bg-emerald-950/60 text-emerald-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded bg-emerald-950/80 text-[10px] font-bold flex items-center justify-center text-emerald-400">
                    {p.icon}
                  </span>
                  <div>
                    <div className="font-bold text-emerald-100">{p.name}</div>
                    <div className="text-[9px] text-emerald-600">{p.desc}</div>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-emerald-700" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-6 h-px bg-emerald-950 my-0.5" />

      {/* Goal Matcher AI & Life Graphs */}
      <button
        onClick={onOpenGoalMatcher}
        title="AI Goal Matcher & Life-Graph Prediction Simulator"
        className="p-2 rounded-lg bg-emerald-950/60 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 hover:border-emerald-400 shadow-sm transition-all"
      >
        <Sparkles className="h-4 w-4" />
      </button>

      {/* Groww Overview & Fundamentals */}
      <button
        onClick={onOpenOverview}
        title="Groww-Style Stock Overview, 52W Range & Fundamentals"
        className="p-2 rounded-lg hover:bg-emerald-950/80 hover:text-emerald-200 text-emerald-600 transition-all"
      >
        <Info className="h-4 w-4 text-emerald-400" />
      </button>

      {/* Style & Palette Controls */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Color & Stroke Width"
          className="p-2 rounded-lg hover:bg-emerald-950/80 hover:text-emerald-200 text-emerald-600 transition-all"
        >
          <Palette className="h-4 w-4" />
        </button>

        {showColorPicker && (
          <div className="absolute left-full top-0 ml-2 w-44 bg-[#040805] border border-emerald-950 rounded-xl p-3 shadow-2xl z-40 space-y-3">
            <div>
              <div className="text-[10px] font-mono text-emerald-500/70 uppercase font-bold mb-1.5">Color</div>
              <div className="grid grid-cols-3 gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => { setStrokeColor(c.value); setShowColorPicker(false); }}
                    className={`h-6 rounded-md border flex items-center justify-center ${
                      strokeColor === c.value ? "border-emerald-400 ring-2 ring-emerald-500/50" : "border-emerald-950"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono text-emerald-500/70 uppercase font-bold mb-1.5">Width ({strokeWidth}px)</div>
              <div className="flex items-center space-x-1 bg-black p-1 rounded-lg border border-emerald-950">
                {[1, 2, 3, 5].map((w) => (
                  <button
                    key={w}
                    onClick={() => setStrokeWidth(w)}
                    className={`flex-1 py-1 rounded text-xs font-mono font-bold ${
                      strokeWidth === w ? "bg-emerald-500 text-black" : "text-emerald-600 hover:text-emerald-200"
                    }`}
                  >
                    {w}p
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-6 h-px bg-emerald-950 my-0.5" />

      {/* Undo */}
      <button
        onClick={onUndo}
        title="Undo Last Drawing (Ctrl+Z)"
        className="p-2 rounded-lg hover:bg-emerald-950/80 hover:text-emerald-200 text-emerald-600 transition-all"
      >
        <Undo2 className="h-4 w-4" />
      </button>

      {/* Clear All */}
      <button
        onClick={onClear}
        title="Clear All Drawings & Overlays"
        className="p-2 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 text-rose-500/60 transition-all"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};
