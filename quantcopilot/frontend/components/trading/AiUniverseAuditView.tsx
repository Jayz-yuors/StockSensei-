"use client";

import React, { useState, useEffect } from "react";
import { 
  UniverseAuditResponse, 
  AssetAuditItem 
} from "../../types";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  FileText, 
  Cpu, 
  RefreshCw, 
  AlertTriangle,
  BarChart3,
  Search,
  X
} from "lucide-react";
import { getApiBaseUrl } from "../../lib/api";

interface AiUniverseAuditViewProps {
  onOpenOrderModal?: (symbol: string, side: "BUY" | "SELL") => void;
}

export const AiUniverseAuditView: React.FC<AiUniverseAuditViewProps> = ({ onOpenOrderModal }) => {
  const [auditData, setAuditData] = useState<UniverseAuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAssetType, setSelectedAssetType] = useState<"ALL" | "STOCK" | "INDEX_FUND">("ALL");
  const [selectedStance, setSelectedStance] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("EXPECTED_RETURN");
  const [viewMode, setViewMode] = useState<"GRID" | "MATRIX">("GRID");

  // Selected item for deep-dive drawer
  const [selectedItem, setSelectedItem] = useState<AssetAuditItem | null>(null);

  const fetchAuditData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${getApiBaseUrl()}/api/v1/fno/ai-universe-audit?asset_type=${selectedAssetType}&sort_by=${sortBy}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Audit server returned HTTP ${res.status}`);
      }
      const data: UniverseAuditResponse = await res.json();
      setAuditData(data);
      if (selectedItem) {
        const updated = data.items.find(it => it.symbol === selectedItem.symbol);
        if (updated) setSelectedItem(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load AI universe audit";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [selectedAssetType, sortBy]);

  // Client-side search and stance filtering
  const filteredItems = (auditData?.items || []).filter((item) => {
    const matchesSearch = 
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sector.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStance = 
      selectedStance === "ALL" || 
      item.future_prediction.dominant_stance === selectedStance;

    return matchesSearch && matchesStance;
  });

  const getStanceBadge = (stance: string) => {
    switch (stance) {
      case "STRONG_BULLISH":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "MODERATE_BULLISH":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
      case "ACCUMULATION_NEUTRAL":
        return "bg-slate-800 text-slate-300 border-slate-700";
      case "DEFENSIVE_BEARISH":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getPolicyStanceBadge = (stance: string) => {
    switch (stance) {
      case "TAILWIND":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "HEADWIND":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans select-none text-slate-100 pb-16">
      {/* Top Banner: Header & Macro Overview */}
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 md:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="h-6 w-6 rounded-md bg-[#0e1422] border border-slate-800 flex items-center justify-center text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider uppercase">
                MULTI-ASSET PREDICTIVE INTELLIGENCE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                MULTI-ASSET
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-white uppercase">
              AI UNIVERSE AUDIT &amp; PREDICTIVE FORECASTING ENGINE
            </h2>
            <p className="text-xs text-slate-400 font-sans max-w-3xl leading-relaxed">
              Continuous multi-factor audit across Indian equities and benchmark index funds. 
              Synthesizes historical price microstructure, 52-week volatility envelopes, and live 
              SEBI / Indian Government regulatory policy tailwinds into 14-day forward predictive trajectories.
            </p>
          </div>

          {/* Quick Refresh Button */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={fetchAuditData}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-[#0e1422] hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-sans font-semibold px-3.5 py-2 rounded-md text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
              <span>{isLoading ? "Running Audit..." : "Refresh Universe Audit"}</span>
            </button>
          </div>
        </div>

        {/* Macro Stat Cards */}
        {auditData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-800/80">
            <div className="bg-[#0e1422]/60 border border-slate-800/70 rounded-lg p-3">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Assets Audited</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold font-mono text-white tabular-nums">{auditData.total_assets}</span>
                <span className="text-xs text-slate-400 font-mono">
                  {auditData.stocks_count} Stocks &bull; {auditData.index_funds_count} Funds
                </span>
              </div>
            </div>

            <div className="bg-[#0e1422]/60 border border-slate-800/70 rounded-lg p-3">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Dominant Stance</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">{auditData.bullish_count} Bullish</span>
                <span className="text-xs text-slate-400 font-mono">
                  {auditData.neutral_count} Neutral
                </span>
              </div>
            </div>

            <div className="bg-[#0e1422]/60 border border-slate-800/70 rounded-lg p-3">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Top Policy Tailwind</span>
              <div className="text-xs font-bold text-slate-200 truncate" title={auditData.top_policy_tailwind}>
                Green Energy &amp; EV PLI
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">MNRE / MoRTH Incentives</span>
            </div>

            <div className="bg-[#0e1422]/60 border border-slate-800/70 rounded-lg p-3">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Forecast Horizon</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xl font-bold font-mono text-white tabular-nums">14 Days</span>
                <span className="text-xs text-slate-500 font-sans">Multi-Quantile</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Left: Search & Asset Type Tabs */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter ticker, name, sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#080b11] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/30 transition-colors w-48 sm:w-60 font-sans"
            />
          </div>

          {/* Asset Type Toggle */}
          <div className="flex items-center bg-[#080b11] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setSelectedAssetType("ALL")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedAssetType === "ALL"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Assets ({auditData?.total_assets || 16})
            </button>
            <button
              onClick={() => setSelectedAssetType("STOCK")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedAssetType === "STOCK"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Stocks ({auditData?.stocks_count || 10})
            </button>
            <button
              onClick={() => setSelectedAssetType("INDEX_FUND")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                selectedAssetType === "INDEX_FUND"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Index Funds ({auditData?.index_funds_count || 6})
            </button>
          </div>
        </div>

        {/* Right: Sort By, Stance Filter & View Mode */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Stance Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 text-xs">Stance:</span>
            <select
              value={selectedStance}
              onChange={(e) => setSelectedStance(e.target.value)}
              className="bg-[#080b11] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-600 font-sans"
            >
              <option value="ALL">All Stances</option>
              <option value="STRONG_BULLISH">Strong Bullish</option>
              <option value="MODERATE_BULLISH">Moderate Bullish</option>
              <option value="ACCUMULATION_NEUTRAL">Accumulation / Neutral</option>
              <option value="DEFENSIVE_BEARISH">Defensive / Bearish</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 text-xs">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#080b11] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-600 font-sans"
            >
              <option value="EXPECTED_RETURN">Expected Return %</option>
              <option value="POLICY_RISK">Policy Risk Score</option>
              <option value="RSI">RSI (14)</option>
              <option value="MARKET_CAP">Market Cap / AUM</option>
              <option value="DAY_CHANGE">Day Change %</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#080b11] border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("GRID")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all duration-150 active:scale-95 ${
                viewMode === "GRID"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("MATRIX")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all duration-150 active:scale-95 ${
                viewMode === "MATRIX"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && !auditData && (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Cpu className="h-8 w-8 text-emerald-400 animate-spin" />
          <div className="text-sm font-semibold text-slate-200">
            Running Algorithmic Audit &amp; Policy Alignment across Universe...
          </div>
          <p className="text-xs text-slate-400">
            Ingesting historical price action, RSI metrics, and SEBI regulatory circulars
          </p>
        </div>
      )}

      {error && !auditData && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/60 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>Error loading AI Universe Audit: {error}</span>
        </div>
      )}

      {/* Main Content Area with Smooth Mode Transition */}
      {auditData && (
        <div key={viewMode} className="animate-fade-in-up">
          {viewMode === "GRID" ? (
            /* ==================== CARD GRID VIEW ==================== */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const isPositiveDay = item.day_change >= 0;
                const isPositiveExp = item.future_prediction.expected_return_pct >= 0;

                return (
                  <div
                    key={item.symbol}
                    className="bg-[#0b0f17] border border-slate-800/80 hover:border-slate-700 rounded-xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header: Symbol, Name, Badges */}
                      <div className="flex items-start justify-between border-b border-slate-800/80 pb-3 mb-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-base font-bold font-mono text-white group-hover:text-emerald-400 transition-colors">
                              {item.symbol}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              item.asset_type === "STOCK"
                                ? "bg-slate-800 text-slate-300 border-slate-700"
                                : "bg-purple-950/40 text-purple-300 border-purple-800/60"
                            }`}>
                              {item.asset_type === "STOCK" ? "EQUITY" : "INDEX FUND"}
                            </span>
                          </div>
                          <div className="text-xs text-slate-300 font-sans font-medium truncate max-w-[280px]">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-sans">
                            {item.sector}
                          </div>
                        </div>

                        {/* Stance Badge */}
                        <div className="flex flex-col items-end space-y-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getStanceBadge(item.future_prediction.dominant_stance)}`}>
                            {item.future_prediction.dominant_stance.replace("_", " ")}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Confidence: <strong className="text-emerald-400">{item.future_prediction.confidence_pct}%</strong>
                          </span>
                        </div>
                      </div>

                      {/* Current Spot Price & Past Market Snapshot */}
                      <div className="grid grid-cols-2 gap-3 mb-3.5">
                        {/* Spot Price */}
                        <div className="bg-[#0e1422]/60 border border-slate-800/70 rounded-lg p-3">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Current Spot</span>
                          <div className="flex items-baseline space-x-2">
                            <span className="text-lg font-bold font-mono text-white tabular-nums">
                              ₹{item.spot_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`text-xs font-mono font-bold tabular-nums ${isPositiveDay ? "text-emerald-400" : "text-rose-400"}`}>
                              {isPositiveDay ? "+" : ""}{item.day_change_pct}%
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-1">
                            MCap/AUM: ₹{(item.market_cap_or_aum_cr / 1000).toFixed(1)}K Cr
                          </div>
                        </div>

                        {/* Past Market Returns */}
                        <div className="bg-[#0e1422]/60 border border-slate-800/70 rounded-lg p-3">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Historical Return</span>
                          <div className="grid grid-cols-3 gap-1 text-xs font-mono font-bold text-center mt-1 tabular-nums">
                            <div className="bg-[#080b11] py-1 rounded border border-slate-800/60">
                              <span className="text-[9px] text-slate-500 block font-sans">1W</span>
                              <span className={item.past_market.return_1w_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                {item.past_market.return_1w_pct >= 0 ? "+" : ""}{item.past_market.return_1w_pct}%
                              </span>
                            </div>
                            <div className="bg-[#080b11] py-1 rounded border border-slate-800/60">
                              <span className="text-[9px] text-slate-500 block font-sans">1M</span>
                              <span className={item.past_market.return_1m_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                {item.past_market.return_1m_pct >= 0 ? "+" : ""}{item.past_market.return_1m_pct}%
                              </span>
                            </div>
                            <div className="bg-[#080b11] py-1 rounded border border-slate-800/60">
                              <span className="text-[9px] text-slate-500 block font-sans">1Y</span>
                              <span className={item.past_market.return_1y_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                {item.past_market.return_1y_pct >= 0 ? "+" : ""}{item.past_market.return_1y_pct}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Technical Microstructure Mini-Row */}
                      <div className="flex items-center justify-between bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 mb-3.5 text-xs font-mono">
                        <div>
                          <span className="text-slate-500 font-sans">RSI (14): </span>
                          <strong className={`tabular-nums ${item.past_market.rsi_14 > 60 ? "text-amber-400" : item.past_market.rsi_14 < 40 ? "text-cyan-400" : "text-emerald-400"}`}>
                            {item.past_market.rsi_14}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 font-sans">EMA Trend: </span>
                          <strong className="text-slate-300">{item.past_market.ema_alignment.replace("_", " ")}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 font-sans">52W Position: </span>
                          <strong className="text-slate-200 tabular-nums">{item.past_market.range_52w_pct}%</strong>
                        </div>
                      </div>

                      {/* Government Policy Audit Box */}
                      <div className="bg-[#080b11] border border-slate-800 rounded-lg p-3 mb-3.5 space-y-1.5 font-sans">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                              Govt Policy Audit
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 font-mono">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getPolicyStanceBadge(item.govt_policy.policy_stance)}`}>
                              {item.govt_policy.policy_stance}
                            </span>
                            <span className="text-xs text-slate-400">
                              Risk: <strong className="text-slate-200">{item.govt_policy.policy_risk_score}/100</strong>
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-snug">
                          {item.govt_policy.key_policy_summary}
                        </p>
                      </div>

                      {/* 14-Day Future Prediction Box */}
                      <div className="bg-[#0e1422]/60 border border-slate-800 rounded-lg p-3 mb-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider font-sans">
                              14-Day AI Forecast
                            </span>
                          </div>
                          <div className="flex items-baseline space-x-1 text-xs font-mono">
                            <span className="text-slate-400 font-sans">Target:</span>
                            <span className="font-bold text-white tabular-nums">
                              ₹{item.future_prediction.target_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`font-bold tabular-nums ${isPositiveExp ? "text-emerald-400" : "text-rose-400"}`}>
                              ({isPositiveExp ? "+" : ""}{item.future_prediction.expected_return_pct}%)
                            </span>
                          </div>
                        </div>

                        {/* Bullish vs Bearish Band */}
                        <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-[#080b11] px-2.5 py-1 rounded border border-slate-800/60 tabular-nums">
                          <span>+2σ Bull: <strong className="text-emerald-400">₹{item.future_prediction.bullish_target_2sigma}</strong></span>
                          <span>-2σ Floor: <strong className="text-rose-400">₹{item.future_prediction.bearish_floor_2sigma}</strong></span>
                        </div>

                        {/* Alpha Driver Tag */}
                        <div className="text-[11px] text-slate-400 truncate font-sans">
                          <span className="text-slate-500 font-semibold">Alpha Driver: </span>
                          <span className="text-slate-300">{item.future_prediction.alpha_driver}</span>
                        </div>
                      </div>

                      {/* Executive Verdict Quote */}
                      <div className="p-2.5 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-400 leading-relaxed italic font-sans">
                        &quot;{item.executive_verdict}&quot;
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center space-x-2 pt-3.5 border-t border-slate-800/80 mt-3.5">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="flex-1 py-1.5 rounded-md bg-[#0e1422] hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-1 transition-colors"
                      >
                        <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                        <span>Deep Audit Sheet</span>
                      </button>

                      {onOpenOrderModal && (
                        <button
                          onClick={() => onOpenOrderModal(item.symbol, isPositiveExp ? "BUY" : "SELL")}
                          className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors"
                        >
                          Trade
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ==================== DATA MATRIX VIEW ==================== */
            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#090d16] border-b border-slate-800 text-slate-400 text-[10px] uppercase font-semibold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Asset</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Spot Price</th>
                      <th className="py-2.5 px-3 text-right">Day %</th>
                      <th className="py-2.5 px-3 text-center">1W / 1M / 1Y</th>
                      <th className="py-2.5 px-3 text-center">RSI (14)</th>
                      <th className="py-2.5 px-3">Govt Policy Stance</th>
                      <th className="py-2.5 px-3">14D AI Stance</th>
                      <th className="py-2.5 px-3 text-right">Target</th>
                      <th className="py-2.5 px-3 text-right">Exp Return</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                    {filteredItems.map((item) => {
                      const isPositiveDay = item.day_change >= 0;
                      const isPositiveExp = item.future_prediction.expected_return_pct >= 0;

                      return (
                        <tr key={item.symbol} className="hover:bg-[#121929] transition-colors group">
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-white group-hover:text-emerald-400">{item.symbol}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[140px] font-sans">{item.name}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                              item.asset_type === "STOCK"
                                ? "bg-slate-800 text-slate-300 border-slate-700"
                                : "bg-purple-950/40 text-purple-300 border-purple-800/60"
                            }`}>
                              {item.asset_type === "STOCK" ? "EQUITY" : "INDEX"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            ₹{item.spot_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-bold ${isPositiveDay ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositiveDay ? "+" : ""}{item.day_change_pct}%
                          </td>
                          <td className="py-2.5 px-3 text-center text-[11px] text-slate-400">
                            {item.past_market.return_1w_pct}% &bull; {item.past_market.return_1m_pct}% &bull; {item.past_market.return_1y_pct}%
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">
                            <span className={item.past_market.rsi_14 > 60 ? "text-amber-400" : "text-emerald-400"}>
                              {item.past_market.rsi_14}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getPolicyStanceBadge(item.govt_policy.policy_stance)}`}>
                              {item.govt_policy.policy_stance} ({item.govt_policy.policy_risk_score})
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getStanceBadge(item.future_prediction.dominant_stance)}`}>
                              {item.future_prediction.dominant_stance.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            ₹{item.future_prediction.target_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-bold ${isPositiveExp ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositiveExp ? "+" : ""}{item.future_prediction.expected_return_pct}%
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="px-2.5 py-1 rounded bg-[#0e1422] hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-[10px] font-sans font-semibold transition-colors"
                            >
                              Audit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ==================== DEEP DIVE AUDIT DRAWER MODAL ==================== */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f17] border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative space-y-6 font-sans animate-fade-in-up">
            {/* Modal Header */}

            <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold font-mono text-white">{selectedItem.symbol}</span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${
                    selectedItem.asset_type === "STOCK"
                      ? "bg-slate-800 text-slate-300 border-slate-700"
                      : "bg-purple-950/40 text-purple-300 border-purple-800/60"
                  }`}>
                    {selectedItem.asset_type === "STOCK" ? "EQUITY STOCK" : "INDEX FUND / ETF"}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getStanceBadge(selectedItem.future_prediction.dominant_stance)}`}>
                    {selectedItem.future_prediction.dominant_stance.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 font-sans">{selectedItem.name} &bull; {selectedItem.sector}</div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-md bg-[#0e1422] border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Trajectory Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#080b11] border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Spot Price</span>
                <span className="text-lg font-bold font-mono text-white tabular-nums">
                  ₹{selectedItem.spot_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-[#080b11] border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">14-Day Target</span>
                <span className="text-lg font-bold font-mono text-white tabular-nums">
                  ₹{selectedItem.future_prediction.target_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-[#080b11] border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Expected Return</span>
                <span className={`text-lg font-bold font-mono tabular-nums ${selectedItem.future_prediction.expected_return_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {selectedItem.future_prediction.expected_return_pct >= 0 ? "+" : ""}{selectedItem.future_prediction.expected_return_pct}%
                </span>
              </div>
              <div className="bg-[#080b11] border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Policy Risk</span>
                <span className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                  {selectedItem.govt_policy.policy_risk_score}/100
                </span>
              </div>
            </div>

            {/* Government Policy Audit Details */}
            <div className="bg-[#080b11] border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Indian Government &amp; SEBI Policy Directives
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getPolicyStanceBadge(selectedItem.govt_policy.policy_stance)}`}>
                  {selectedItem.govt_policy.policy_stance}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedItem.govt_policy.key_policy_summary}
              </p>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Applicable Circulars:</span>
                {selectedItem.govt_policy.applicable_circulars.map((circ, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300 bg-[#0e1422] p-2 rounded-lg border border-slate-800">
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{circ}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 14-Day Forward Trajectory Curve Points */}
            <div className="bg-[#080b11] border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    14-Day Multi-Quantile Forecast Path
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Confidence: <strong className="text-emerald-400">{selectedItem.future_prediction.confidence_pct}%</strong>
                </span>
              </div>

              {/* Trajectory Points Table */}
              <div className="max-h-48 overflow-y-auto pr-1">
                <table className="w-full text-left text-xs font-mono tabular-nums">
                  <thead className="bg-[#090d16] text-[10px] text-slate-400 uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="py-1.5 px-3">Day Step</th>
                      <th className="py-1.5 px-3">Date</th>
                      <th className="py-1.5 px-3 text-right">Base Path</th>
                      <th className="py-1.5 px-3 text-right">+2σ Bull Target</th>
                      <th className="py-1.5 px-3 text-right">-2σ Bear Floor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedItem.future_prediction.trajectory_points.map((pt) => (
                      <tr key={pt.step} className="hover:bg-[#121929]">
                        <td className="py-1.5 px-3 text-slate-400">Day {pt.step}</td>
                        <td className="py-1.5 px-3 text-slate-300">{pt.timestamp}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-white">₹{pt.base_price.toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-right text-emerald-400">₹{pt.bullish_price.toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-right text-rose-400">₹{pt.bearish_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/80">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-md bg-[#0e1422] hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-xs transition-colors"
              >
                Close Audit Sheet
              </button>

              {onOpenOrderModal && (
                <button
                  onClick={() => {
                    const side = selectedItem.future_prediction.expected_return_pct >= 0 ? "BUY" : "SELL";
                    onOpenOrderModal(selectedItem.symbol, side);
                    setSelectedItem(null);
                  }}
                  className="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                >
                  Execute Order on {selectedItem.symbol}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
