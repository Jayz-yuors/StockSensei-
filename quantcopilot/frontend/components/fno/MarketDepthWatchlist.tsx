"use client";

import React, { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { MarketDepth, GNNContagionSignal } from "../../types";
import { usePortfolioStore } from "../../store/usePortfolioStore";

interface MarketDepthWatchlistProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  marketDepth: MarketDepth | null;
  gnnSignal: GNNContagionSignal | null;
}

export const MarketDepthWatchlist: React.FC<MarketDepthWatchlistProps> = ({
  selectedSymbol,
  onSelectSymbol,
  marketDepth,
  gnnSignal
}) => {
  const { indianTickers } = usePortfolioStore();
  const [activeSideTab, setActiveSideTab] = useState<"WATCHLIST" | "DEPTH" | "GNN">("WATCHLIST");
  const [searchQuery, setSearchQuery] = useState("");

  const watchlistUniverse = [
    { symbol: "NIFTY 50", defaultPrice: 22759.35, defaultChange: 0.22, isIndex: true },
    { symbol: "BANKNIFTY", defaultPrice: 54758.55, defaultChange: 0.35, isIndex: true },
    { symbol: "SENSEX", defaultPrice: 72804.50, defaultChange: 0.18, isIndex: true },
    { symbol: "RELIANCE", defaultPrice: 1192.80, defaultChange: 0.85, isIndex: false },
    { symbol: "TCS", defaultPrice: 2095.80, defaultChange: -0.25, isIndex: false },
    { symbol: "HDFCBANK", defaultPrice: 713.80, defaultChange: 0.65, isIndex: false },
    { symbol: "INFY", defaultPrice: 1845.60, defaultChange: 0.92, isIndex: false },
    { symbol: "TATAMOTORS", defaultPrice: 980.50, defaultChange: -0.80, isIndex: false },
    { symbol: "SBIN", defaultPrice: 815.20, defaultChange: 0.45, isIndex: false },
    { symbol: "TATASTEEL", defaultPrice: 172.50, defaultChange: -0.65, isIndex: false },
    { symbol: "BEL", defaultPrice: 385.00, defaultChange: 0.11, isIndex: false }
  ].map((item) => {
    const live = indianTickers[item.symbol] || indianTickers[item.symbol.replace("-EQ", "")];
    return {
      symbol: item.symbol,
      price: live ? live.price : item.defaultPrice,
      change: live ? live.change_24h : item.defaultChange,
      isIndex: item.isIndex
    };
  });

  const filteredWatchlist = watchlistUniverse.filter((item) =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-72 bg-black flex flex-col text-xs font-mono select-none shrink-0 border-l border-emerald-950">
      <div className="flex border-b border-emerald-950 shrink-0">
        {(["WATCHLIST", "DEPTH", "GNN"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSideTab(tab)}
            className={`flex-1 py-2 font-bold text-[10px] transition-colors ${
              activeSideTab === tab ? "bg-[#040805] text-emerald-400 border-b-2 border-emerald-400" : "text-slate-500 hover:text-emerald-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeSideTab === "WATCHLIST" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-emerald-950 shrink-0">
            <div className="flex items-center bg-[#060c07] rounded px-2 py-1 border border-emerald-900/60">
              <Search className="h-3.5 w-3.5 text-emerald-600 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Stocks, F&O..."
                className="bg-transparent text-emerald-200 placeholder-emerald-800 text-xs outline-none w-full"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-emerald-950/60">
            {filteredWatchlist.map((item) => {
              const isPos = item.change >= 0;
              const isSelected = selectedSymbol === item.symbol;
              return (
                <div
                  key={item.symbol}
                  onClick={() => onSelectSymbol(item.symbol)}
                  className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
                    isSelected ? "bg-emerald-950/40 border-l-2 border-emerald-400" : "hover:bg-emerald-950/20"
                  }`}
                >
                  <div>
                    <div className="font-bold text-emerald-200">{item.symbol}</div>
                    <div className="text-[10px] text-emerald-600/80">{item.isIndex ? "NSE Index" : "NSE Equity"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-100">₹{item.price.toFixed(2)}</div>
                    <div className={`text-[10px] font-semibold ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                      {isPos ? "+" : ""}{item.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSideTab === "DEPTH" && (
        <div className="p-3 space-y-3 flex-1 overflow-y-auto">
          <div className="text-[10px] text-emerald-500/70 font-bold uppercase">
            5-LEVEL L2 DEPTH ({selectedSymbol})
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <div className="text-emerald-400 font-bold border-b border-emerald-950 pb-1 mb-1">BID (BUY)</div>
              {(marketDepth?.bids || [
                { price: 24144.0, orders: 12, qty: 1850 },
                { price: 24143.5, orders: 8, qty: 1200 },
                { price: 24143.0, orders: 15, qty: 3400 },
                { price: 24142.5, orders: 4, qty: 900 },
                { price: 24142.0, orders: 22, qty: 5600 },
              ]).map((b, i) => (
                <div key={i} className="flex justify-between py-0.5 text-slate-300">
                  <span>{b.price.toFixed(1)}</span>
                  <span className="text-emerald-400 font-bold">{b.qty}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="text-rose-400 font-bold border-b border-emerald-950 pb-1 mb-1">ASK (SELL)</div>
              {(marketDepth?.asks || [
                { price: 24144.5, orders: 18, qty: 2100 },
                { price: 24145.0, orders: 11, qty: 1650 },
                { price: 24145.5, orders: 9, qty: 1400 },
                { price: 24146.0, orders: 25, qty: 4200 },
                { price: 24146.5, orders: 30, qty: 6100 },
              ]).map((a, i) => (
                <div key={i} className="flex justify-between py-0.5 text-slate-300">
                  <span>{a.price.toFixed(1)}</span>
                  <span className="text-rose-400 font-bold">{a.qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSideTab === "GNN" && (
        <div className="p-3 space-y-3 flex-1 overflow-y-auto">
          <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> GNN CONTAGION SIGNALS
          </div>
          <div className="bg-[#040805] p-2.5 rounded border border-emerald-950 space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-emerald-500/70">System Contagion:</span>
              <span className="text-amber-400 font-bold">
                {gnnSignal?.systemic_contagion || 0.38} ({gnnSignal?.contagion_status || "MODERATE"})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-500/70">Gamma Squeeze Prob:</span>
              <span className="text-emerald-400 font-bold">
                {((gnnSignal?.gamma_squeeze_prob || 0.14) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-500/70">Predicted IV Drift:</span>
              <span className="text-emerald-300 font-bold">
                +{gnnSignal?.predicted_iv_drift || 0.45} vol pts
              </span>
            </div>
            <div className="pt-2 border-t border-emerald-950">
              <div className="text-[10px] text-emerald-600 mb-1">High Contagion Assets:</div>
              <div className="flex flex-wrap gap-1">
                {(gnnSignal?.high_risk_nodes || ["TATAMOTORS", "TATASTEEL"]).map((sym) => (
                  <span key={sym} className="px-1.5 py-0.5 bg-rose-950/50 border border-rose-800/50 text-rose-400 rounded text-[10px] font-bold">
                    {sym}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
