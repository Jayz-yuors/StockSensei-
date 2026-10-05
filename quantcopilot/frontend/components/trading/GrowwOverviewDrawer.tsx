"use client";

import React from "react";
import { GrowwCompanyOverview } from "../../types/trading";
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Building2, 
  BarChart2, 
  Zap, 
  Layers, 
  Scale, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface GrowwOverviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  onOpenOrderModal: (side: "BUY" | "SELL") => void;
}

export const GrowwOverviewDrawer: React.FC<GrowwOverviewDrawerProps> = ({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  onOpenOrderModal
}) => {
  if (!isOpen) return null;

  const price = currentPrice || 1000;
  const todayLow = Number((price * 0.982).toFixed(2));
  const todayHigh = Number((price * 1.018).toFixed(2));
  const fiftyTwoWeekLow = Number((price * 0.72).toFixed(2));
  const fiftyTwoWeekHigh = Number((price * 1.28).toFixed(2));
  const lowerCircuit = Number((price * 0.90).toFixed(2));
  const upperCircuit = Number((price * 1.10).toFixed(2));

  // Compute position percentage for range sliders
  const todayRangePct = Math.max(0, Math.min(100, ((price - todayLow) / (todayHigh - todayLow || 1)) * 100));
  const fiftyTwoRangePct = Math.max(0, Math.min(100, ((price - fiftyTwoWeekLow) / (fiftyTwoWeekHigh - fiftyTwoWeekLow || 1)) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="bg-[#040805] border-l border-emerald-950 w-full max-w-lg h-full shadow-2xl flex flex-col font-mono text-emerald-100 overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-emerald-950 flex items-center justify-between bg-black">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center font-black text-black text-sm shadow-md">
              {symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-emerald-100 uppercase">{symbol}</h2>
                <span className="text-[10px] bg-black text-emerald-400 px-2 py-0.5 rounded border border-emerald-900 font-bold">
                  NSE / BSE
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 font-sans">
                Full Company Fundamentals & Market Depth
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-100 hover:bg-emerald-950">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 flex-1">
          {/* Live Price Header */}
          <div className="flex items-baseline justify-between bg-black border border-emerald-950 rounded-xl p-4">
            <div>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Live Last Traded Price</span>
              <div className="text-2xl font-bold text-emerald-100 mt-0.5">₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-end">
                <ArrowUpRight className="h-4 w-4 mr-0.5" />
                +1.45% (+₹{(price * 0.0145).toFixed(2)})
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Volume: 12.4M shares</div>
            </div>
          </div>

          {/* Groww-style Performance Range Bars */}
          <div className="bg-black border border-emerald-950 rounded-xl p-4 space-y-5">
            <div className="text-xs font-bold text-emerald-200 uppercase tracking-wide flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-emerald-400" />
              PERFORMANCE RANGE
            </div>

            {/* Today's Low / High Range Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <div className="text-emerald-500/80">
                  <span className="text-[10px] text-emerald-600 block">Today's Low</span>
                  <strong className="text-emerald-200">₹{todayLow}</strong>
                </div>
                <div className="text-right text-emerald-500/80">
                  <span className="text-[10px] text-emerald-600 block">Today's High</span>
                  <strong className="text-emerald-200">₹{todayHigh}</strong>
                </div>
              </div>
              <div className="relative h-2 bg-emerald-950 rounded-full overflow-visible">
                <div 
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-rose-500 via-emerald-600 to-emerald-400 rounded-full" 
                  style={{ width: "100%" }}
                />
                {/* Pointer */}
                <div 
                  className="absolute -top-1 w-4 h-4 bg-white border-2 border-emerald-400 rounded-full shadow-lg transform -translate-x-1/2 transition-all duration-300"
                  style={{ left: `${todayRangePct}%` }}
                />
              </div>
            </div>

            {/* 52-Week Low / High Range Bar */}
            <div className="space-y-1.5 pt-2 border-t border-emerald-950">
              <div className="flex justify-between text-xs">
                <div className="text-emerald-500/80">
                  <span className="text-[10px] text-emerald-600 block">52-Week Low</span>
                  <strong className="text-emerald-200">₹{fiftyTwoWeekLow}</strong>
                </div>
                <div className="text-right text-emerald-500/80">
                  <span className="text-[10px] text-emerald-600 block">52-Week High</span>
                  <strong className="text-emerald-200">₹{fiftyTwoWeekHigh}</strong>
                </div>
              </div>
              <div className="relative h-2 bg-emerald-950 rounded-full overflow-visible">
                <div 
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-rose-500 via-emerald-600 to-emerald-400 rounded-full" 
                  style={{ width: "100%" }}
                />
                {/* Pointer */}
                <div 
                  className="absolute -top-1 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow-lg transform -translate-x-1/2 transition-all duration-300"
                  style={{ left: `${fiftyTwoRangePct}%` }}
                />
              </div>
            </div>

            {/* Circuit Limits */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-950 text-xs">
              <div className="bg-[#040805] p-2.5 rounded-lg border border-emerald-950">
                <span className="text-[10px] text-rose-400 font-bold block">Lower Circuit (10%)</span>
                <strong className="text-emerald-200">₹{lowerCircuit}</strong>
              </div>
              <div className="bg-[#040805] p-2.5 rounded-lg border border-emerald-950">
                <span className="text-[10px] text-emerald-400 font-bold block">Upper Circuit (10%)</span>
                <strong className="text-emerald-200">₹{upperCircuit}</strong>
              </div>
            </div>
          </div>

          {/* Technical Sentiment Dial & Market Indicators */}
          <div className="bg-black border border-emerald-950 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-200 uppercase flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-emerald-400" />
                TECHNICAL SENTIMENT GAUGE
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                STRONG BUY
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#040805] p-2 rounded-lg border border-emerald-950">
                <span className="text-[10px] text-emerald-600 block">PCR Ratio</span>
                <strong className="text-emerald-400 text-sm">1.24</strong>
              </div>
              <div className="bg-[#040805] p-2 rounded-lg border border-emerald-950">
                <span className="text-[10px] text-emerald-600 block">Max Pain</span>
                <strong className="text-emerald-300 text-sm">₹{price}</strong>
              </div>
              <div className="bg-[#040805] p-2 rounded-lg border border-emerald-950">
                <span className="text-[10px] text-emerald-600 block">RSI (14)</span>
                <strong className="text-emerald-400 text-sm">62.8</strong>
              </div>
            </div>
          </div>

          {/* Fundamental Ratios Grid (Groww-style) */}
          <div className="bg-black border border-emerald-950 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-emerald-200 uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-emerald-400" />
              KEY FUNDAMENTALS
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-emerald-950">
                <span className="text-emerald-600">Market Cap</span>
                <strong className="text-emerald-200">₹18,45,200 Cr</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-emerald-950">
                <span className="text-emerald-600">P/E Ratio</span>
                <strong className="text-emerald-200">26.4</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-emerald-950">
                <span className="text-emerald-600">P/B Ratio</span>
                <strong className="text-emerald-200">3.82</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-emerald-950">
                <span className="text-emerald-600">Industry P/E</span>
                <strong className="text-emerald-200">28.1</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-emerald-950">
                <span className="text-emerald-600">Debt to Equity</span>
                <strong className="text-emerald-200">0.34</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-emerald-950">
                <span className="text-emerald-600">ROE</span>
                <strong className="text-emerald-400">18.6%</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-emerald-950">
                <span className="text-emerald-600">EPS (TTM)</span>
                <strong className="text-emerald-200">₹88.40</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-emerald-950">
                <span className="text-emerald-600">Div. Yield</span>
                <strong className="text-emerald-200">1.25%</strong>
              </div>
            </div>
          </div>

          {/* Institutional Activity (FII / DII) */}
          <div className="bg-black border border-emerald-950 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-emerald-200 uppercase block">Institutional Net Flow Today</span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-lg flex items-center justify-between">
                <span className="text-emerald-300 font-bold">FII Inflow</span>
                <strong className="text-emerald-400">+₹1,450 Cr</strong>
              </div>
              <div className="bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg flex items-center justify-between">
                <span className="text-emerald-300 font-bold">DII Inflow</span>
                <strong className="text-emerald-400">+₹820 Cr</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Order Buttons */}
        <div className="p-4 border-t border-emerald-950 bg-black flex space-x-3">
          <button
            onClick={() => { onClose(); onOpenOrderModal("BUY"); }}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <TrendingUp className="h-4 w-4" />
            <span>BUY {symbol}</span>
          </button>
          <button
            onClick={() => { onClose(); onOpenOrderModal("SELL"); }}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-95"
          >
            <TrendingDown className="h-4 w-4" />
            <span>SELL {symbol}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
