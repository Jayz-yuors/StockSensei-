"use client";

import React from "react";
import { usePortfolioStore } from "../store/usePortfolioStore";
import { RiskHeatmap } from "../components/RiskHeatmap";
import { IndianMarketWidget } from "../components/IndianMarketWidget";
import { TradingTerminal } from "../components/fno";
import { StrategyLab } from "../components/StrategyLab";
import { AddPositionModal } from "../components/AddPositionModal";
import { PortfolioImportModal } from "../components/PortfolioImportModal";
import { ShieldCheck, Zap, Plus, Upload, Trash2, ArrowUpRight, ArrowDownRight, Layers, Activity } from "lucide-react";
import { AiUniverseAuditView } from "../components/trading/AiUniverseAuditView";
import { LivePortfolioLab } from "../components/trading/LivePortfolioLab";
import { WorkstationSettingsView } from "../components/WorkstationSettingsView";
import { LiveTickPrice } from "../components/common/LiveTickPrice";

export default function Home() {
  const { 
    portfolio, 
    activeTab, 
    setActiveTab,
    setSelectedFnoSymbol,
    setIsAddPositionOpen, 
    setIsImportModalOpen, 
    clearPortfolio, 
    deletePosition 
  } = usePortfolioStore();

  if (activeTab === "portfolio_lab") {
    return (
      <div key="portfolio_lab" className="w-full max-w-[1600px] mx-auto animate-fade-in-up">
        <LivePortfolioLab />
      </div>
    );
  }

  if (activeTab === "ai_audit") {
    return (
      <div key="ai_audit" className="w-full max-w-[1600px] mx-auto animate-fade-in-up">
        <AiUniverseAuditView 
          onOpenOrderModal={(sym, side) => {
            setSelectedFnoSymbol(sym);
            setActiveTab("fno_terminal");
          }} 
        />
      </div>
    );
  }

  if (activeTab === "settings") {
    return (
      <div key="settings" className="w-full max-w-[1600px] mx-auto animate-fade-in-up">
        <WorkstationSettingsView />
      </div>
    );
  }

  if (activeTab === "fno_terminal") {
    return (
      <div key="fno_terminal" className="w-full max-w-[1600px] mx-auto animate-fade-in-up">
        <TradingTerminal />
      </div>
    );
  }

  if (activeTab === "nse_market") {
    return (
      <div key="nse_market" className="space-y-6 max-w-[1600px] mx-auto animate-fade-in-up">
        <IndianMarketWidget />
        <AddPositionModal />
        <PortfolioImportModal />
      </div>
    );
  }

  if (activeTab === "gnn_risk") {
    return (
      <div key="gnn_risk" className="space-y-6 max-w-[1600px] mx-auto animate-fade-in-up">
        <RiskHeatmap />
      </div>
    );
  }

  if (activeTab === "strategy") {
    return (
      <div key="strategy" className="space-y-6 max-w-[1600px] mx-auto animate-fade-in-up">
        <StrategyLab />
      </div>
    );
  }

  return (
    <div key="overview_dashboard" className="space-y-6 max-w-[1600px] mx-auto text-slate-100 font-sans animate-fade-in-up">
      {/* Refined Page Header Module */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider uppercase mb-1">
            PORTFOLIO &amp; RISK DESK
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-white">
            QUANTITATIVE TERMINAL OVERVIEW
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Real-time portfolio delta, GNN contagion vectors, and systemic risk engine telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 text-xs font-mono">
          <div className="flex items-center space-x-2 bg-[#0e1422] border border-slate-800 rounded-md px-2.5 py-1.5 shadow-sm">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-300 font-medium text-[11px]">FEED: WEBSOCKET ACTIVE</span>
          </div>
          <div className="flex items-center space-x-2 bg-[#0e1422] border border-slate-800 rounded-md px-2.5 py-1.5 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-300 font-medium text-[11px]">GRL RISK ENGINE: ENGAGED</span>
          </div>
        </div>
      </div>

      {/* Indian Market Feed & Benchmark Index Cards */}
      <IndianMarketWidget />

      {/* Institutional Portfolio Holdings Table */}
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold font-sans text-white tracking-tight flex items-center space-x-2">
              <span>ACTIVE PORTFOLIO POSITIONS &amp; LEVERAGE</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {portfolio.positions.length} ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Mark-to-market valuations and net exposure tracked in real-time.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddPositionOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold font-sans px-3 py-1.5 rounded-md transition-all active:translate-y-[0.5px] shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Position</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#0e1422] hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-medium font-sans px-3 py-1.5 rounded-md transition-all active:translate-y-[0.5px]"
            >
              <Upload className="h-3.5 w-3.5 text-slate-400" />
              <span>Import CSV</span>
            </button>
            {portfolio.positions.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Delete entire portfolio and remove all positions?")) {
                    clearPortfolio();
                  }
                }}
                className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-medium font-sans px-3 py-1.5 rounded-md transition-all active:translate-y-[0.5px]"
                title="Delete entire portfolio"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Portfolio</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800/80 rounded-lg bg-[#0e1422]/60">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#090d16] text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-4 font-semibold">Symbol</th>
                <th className="py-2.5 px-3 font-semibold">Side</th>
                <th className="py-2.5 px-3 text-right font-semibold">Quantity</th>
                <th className="py-2.5 px-3 text-right font-semibold">Entry Price</th>
                <th className="py-2.5 px-3 text-right font-semibold">Mark Price</th>
                <th className="py-2.5 px-3 text-right font-semibold">Leverage</th>
                <th className="py-2.5 px-4 text-right font-semibold">Unrealized P&amp;L</th>
                <th className="py-2.5 px-3 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {portfolio.positions.map((pos, idx) => {
                const isPos = pos.unrealized_pnl >= 0;
                return (
                  <tr 
                    key={`${pos.symbol}-${pos.side}-${idx}`} 
                    className="hover:bg-[#121929] transition-colors duration-150 group"
                  >
                    <td className="py-3 px-4 font-bold text-slate-100 font-mono flex items-center space-x-1.5">
                      <span>{pos.symbol}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-sans">
                        NSE
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        pos.side === "LONG" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {pos.side}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200 tabular-nums">
                      {pos.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                      <LiveTickPrice value={pos.entry_price} prefix="₹" />
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-100 font-bold tabular-nums">
                      <LiveTickPrice value={pos.current_price} prefix="₹" />
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                      {pos.leverage}x
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      <div className="flex items-center justify-end gap-1">
                        <LiveTickPrice
                          value={pos.unrealized_pnl}
                          formatter={(v) => `${Number(v) >= 0 ? "+" : "-"}₹${Math.abs(Number(v)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          showDirectionIcon={true}
                          colorize={true}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => deletePosition(pos.symbol)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-all active:scale-95"
                        title="Remove position"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {portfolio.positions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans text-xs">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                        <Layers className="h-5 w-5" />
                      </div>
                      <p className="text-slate-300 font-medium">
                        Your portfolio is empty. No pre-fed positions are loaded.
                      </p>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setIsAddPositionOpen(true)}
                          className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition-colors shadow-sm"
                        >
                          + Create Position
                        </button>
                        <button
                          onClick={() => setActiveTab("portfolio_lab")}
                          className="px-3.5 py-1.5 rounded-md bg-[#0e1422] hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 font-semibold text-xs transition-colors"
                        >
                          Open Live Portfolio Lab
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddPositionModal />
      <PortfolioImportModal />
    </div>
  );
}
