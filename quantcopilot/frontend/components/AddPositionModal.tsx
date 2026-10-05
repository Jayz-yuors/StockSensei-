"use client";

import React, { useState } from "react";
import { usePortfolioStore } from "../store/usePortfolioStore";
import { X, Plus, Search } from "lucide-react";

export const AddPositionModal: React.FC = () => {
  const { isAddPositionOpen, setIsAddPositionOpen, addPosition, indianTickers } = usePortfolioStore();
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [side, setSide] = useState<"LONG" | "SHORT">("LONG");
  const [leverage, setLeverage] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isAddPositionOpen) return null;

  const seen = new Set<string>();
  const tickerList = Object.values(indianTickers).filter(
    (t) => {
      const key = t.token || t.symbol;
      if (seen.has(key)) return false;
      seen.add(key);
      return t.type === "EQUITY" && (
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.company_name && t.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
  );

  const selectTicker = (sym: string) => {
    setSymbol(sym);
    const t = indianTickers[sym];
    if (t) setEntryPrice(t.price.toFixed(2));
    setSearchQuery("");
  };

  const handleSubmit = () => {
    if (!symbol || !quantity || !entryPrice) return;
    addPosition({
      symbol,
      quantity: parseFloat(quantity),
      entry_price: parseFloat(entryPrice),
      side,
      leverage: parseFloat(leverage) || 1
    });
    setSymbol("");
    setQuantity("");
    setEntryPrice("");
    setSide("LONG");
    setLeverage("1");
    setIsAddPositionOpen(false);
  };

  const selectedTicker = indianTickers[symbol];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b0f17] border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-5 text-slate-100 font-sans animate-fade-in-up">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">

          <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>Add Position to Portfolio</span>
          </h3>
          <button 
            onClick={() => setIsAddPositionOpen(false)} 
            className="p-1.5 bg-[#0e1422] border border-slate-800 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Ticker Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
            Select NSE / BSE Ticker
          </label>
          {symbol ? (
            <div className="flex items-center justify-between bg-[#080b11] border border-slate-800 rounded-lg p-3">
              <div>
                <span className="font-bold font-mono text-white text-sm">{symbol}</span>
                {selectedTicker?.company_name && (
                  <span className="text-xs text-slate-400 ml-2 font-sans">{selectedTicker.company_name}</span>
                )}
              </div>
              <button 
                onClick={() => setSymbol("")} 
                className="text-xs font-sans text-emerald-400 hover:underline font-medium"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search RELIANCE, TCS, HDFCBANK..."
                  className="w-full bg-[#080b11] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/30 uppercase transition-colors"
                  autoFocus
                />
              </div>
              {searchQuery && (
                <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-lg bg-[#080b11] divide-y divide-slate-800/60">
                  {tickerList.slice(0, 10).map((t) => (
                    <button
                      key={t.symbol}
                      onClick={() => selectTicker(t.symbol)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono hover:bg-[#121929] transition-colors"
                    >
                      <div>
                        <span className="text-white font-bold">{t.symbol}</span>
                        <span className="text-slate-400 ml-2 font-sans text-[11px]">{t.company_name}</span>
                      </div>
                      <span className="text-slate-200 tabular-nums">₹{t.price.toLocaleString('en-IN')}</span>
                    </button>
                  ))}
                  {tickerList.length === 0 && (
                    <div className="px-3 py-4 text-xs text-slate-500 font-sans text-center">No matching tickers found</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Position Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
              className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
              Entry Price (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="2985.40"
              className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
              Side
            </label>
            <div className="grid grid-cols-2 gap-1 bg-[#080b11] p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setSide("LONG")}
                className={`py-1.5 rounded text-xs font-mono font-bold transition-colors ${
                  side === "LONG" 
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                LONG
              </button>
              <button
                type="button"
                onClick={() => setSide("SHORT")}
                className={`py-1.5 rounded text-xs font-mono font-bold transition-colors ${
                  side === "SHORT" 
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                SHORT
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
              Leverage
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/30"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!symbol || !quantity || !entryPrice}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg font-bold font-sans text-xs uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          Add Position to Portfolio
        </button>
      </div>
    </div>
  );
};
