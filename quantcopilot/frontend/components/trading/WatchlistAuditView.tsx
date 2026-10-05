"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Layers, 
  Activity, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  BarChart3, 
  Sliders, 
  AlertCircle,
  Zap,
  Target,
  ShieldCheck,
  Eye,
  X,
  Compass,
  ArrowRight,
  Briefcase,
  ChevronRight,
  DollarSign
} from "lucide-react";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { LiveYfinanceQuote, AssetAuditItem, PositionInput } from "../../types";
import { getApiBaseUrl } from "../../lib/api";
import { LiveTickPrice } from "../common/LiveTickPrice";

const POPULAR_NSE_TICKERS = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy" },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT Services" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Banking" },
  { symbol: "INFY", name: "Infosys Ltd", sector: "IT Services" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", sector: "Banking" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", sector: "Automotive" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking" },
  { symbol: "ITC", name: "ITC Ltd", sector: "FMCG" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", sector: "Telecom" },
  { symbol: "LT", name: "Larsen & Toubro Ltd", sector: "Infrastructure" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", sector: "Financial Services" },
  { symbol: "MARUTI", name: "Maruti Suzuki India", sector: "Automotive" },
  { symbol: "SUNPHARMA", name: "Sun Pharma Industries", sector: "Pharma" },
  { symbol: "TITAN", name: "Titan Company Ltd", sector: "Consumer" },
  { symbol: "TATASTEEL", name: "Tata Steel Ltd", sector: "Metals" },
  { symbol: "ZOMATO", name: "Zomato Ltd", sector: "Tech Platform" },
  { symbol: "TRENT", name: "Trent Ltd (Tata Retail)", sector: "Retail" },
  { symbol: "ADANIENT", name: "Adani Enterprises", sector: "Conglomerate" },
  { symbol: "NTPC", name: "NTPC Ltd", sector: "Power" },
  { symbol: "ONGC", name: "Oil & Natural Gas Corp", sector: "Energy" }
];

export const WatchlistAuditView: React.FC = () => {
  const { 
    watchlist, 
    addToWatchlist, 
    removeFromWatchlist, 
    addPosition,
    fetchSavedPositionsFromBackend 
  } = usePortfolioStore();

  // Live quotes state
  const [liveQuotes, setLiveQuotes] = useState<Record<string, LiveYfinanceQuote>>({});
  const [isQuotesLoading, setIsQuotesLoading] = useState<boolean>(false);
  const [lastQuotesSync, setLastQuotesSync] = useState<Date | null>(null);

  // AI Predictive Audits state
  const [auditMap, setAuditMap] = useState<Record<string, AssetAuditItem>>({});
  const [auditsLoading, setAuditsLoading] = useState<Record<string, boolean>>({});

  // Auto-refresh timer (60s, 120s, 300s, 0=manual)
  const [refreshInterval, setRefreshInterval] = useState<number>(120); // 2 minutes default
  const [countdown, setCountdown] = useState<number>(120);

  // Search & add scrip
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Filter & view modes
  const [filterStance, setFilterStance] = useState<"ALL" | "BULLISH" | "ACCUMULATION" | "BEARISH">("ALL");
  const [viewMode, setViewMode] = useState<"CARDS" | "TABLE">("CARDS");

  // Detailed Audit Inspection Modal / Drawer
  const [selectedAuditDrawer, setSelectedAuditDrawer] = useState<AssetAuditItem | null>(null);

  // Order Quick Add Modal (Add to Portfolio)
  const [orderModalStock, setOrderModalStock] = useState<{
    symbol: string;
    quote?: LiveYfinanceQuote;
    audit?: AssetAuditItem;
  } | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(50);
  const [orderSide, setOrderSide] = useState<"LONG" | "SHORT">("LONG");
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Initial database sync for portfolio
  useEffect(() => {
    fetchSavedPositionsFromBackend();
  }, [fetchSavedPositionsFromBackend]);

  // Fetch batch live market quotes for watched stocks
  const fetchQuotes = useCallback(async () => {
    if (!watchlist || watchlist.length === 0) return;
    setIsQuotesLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/portfolio/yfinance-batch-quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: watchlist })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quotes) {
          setLiveQuotes(prev => ({ ...prev, ...data.quotes }));
          setLastQuotesSync(new Date());
        }
      }
    } catch (err) {
      console.error("Error fetching watchlist quotes:", err);
    } finally {
      setIsQuotesLoading(false);
    }
  }, [watchlist]);

  // Fetch predictive quantitative audit for a single stock
  const fetchSingleAudit = useCallback(async (symbol: string) => {
    const cleanSym = symbol.trim().toUpperCase().replace("-EQ", "");
    setAuditsLoading(prev => ({ ...prev, [cleanSym]: true }));
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/fno/stock-audit/${cleanSym}`);
      if (res.ok) {
        const item: AssetAuditItem = await res.json();
        setAuditMap(prev => ({ ...prev, [cleanSym]: item }));
      }
    } catch (err) {
      console.error(`Error auditing ${cleanSym}:`, err);
    } finally {
      setAuditsLoading(prev => ({ ...prev, [cleanSym]: false }));
    }
  }, []);

  // Fetch predictive audits for any missing or outdated stocks
  const fetchAllAudits = useCallback(async () => {
    if (!watchlist || watchlist.length === 0) return;
    for (const sym of watchlist) {
      fetchSingleAudit(sym);
    }
  }, [watchlist, fetchSingleAudit]);

  // Initial load
  useEffect(() => {
    fetchQuotes();
    fetchAllAudits();
  }, [fetchQuotes, fetchAllAudits]);

  // Ticking countdown timer for automated refreshes
  useEffect(() => {
    if (refreshInterval <= 0) return;

    setCountdown(refreshInterval);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchQuotes();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshInterval, fetchQuotes]);

  // Search filtered stocks
  const filteredSearchList = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_NSE_TICKERS.filter(t => !watchlist.includes(t.symbol));
    const q = searchQuery.toLowerCase().trim();
    return POPULAR_NSE_TICKERS.filter(t => 
      !watchlist.includes(t.symbol) &&
      (t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.sector.toLowerCase().includes(q))
    );
  }, [searchQuery, watchlist]);

  // Filter watchlist items
  const displayItems = useMemo(() => {
    return watchlist.filter(sym => {
      if (filterStance === "ALL") return true;
      const audit = auditMap[sym];
      if (!audit) return true;
      const stance = audit.future_prediction?.dominant_stance || "";
      if (filterStance === "BULLISH") return stance.includes("BULLISH");
      if (filterStance === "ACCUMULATION") return stance.includes("ACCUMULATION") || stance.includes("RANGE");
      if (filterStance === "BEARISH") return stance.includes("BEARISH");
      return true;
    });
  }, [watchlist, filterStance, auditMap]);

  // Handle adding custom symbol
  const handleAddCustomSymbol = (sym: string) => {
    addToWatchlist(sym);
    setSearchQuery("");
    setIsSearchOpen(false);
    fetchSingleAudit(sym);
  };

  // Handle execute add to portfolio
  const handleExecuteAddToPortfolio = () => {
    if (!orderModalStock) return;
    const sym = orderModalStock.symbol;
    const quote = orderModalStock.quote;
    const curPrice = quote?.price || orderModalStock.audit?.spot_price || 1000.0;

    const newPos: PositionInput = {
      symbol: sym,
      quantity: Number(orderQuantity),
      entry_price: Number(curPrice.toFixed(2)),
      side: orderSide,
      leverage: 1.0
    };

    addPosition(newPos);
    setOrderSuccess(`Added ${orderQuantity}x ${sym} at ₹${curPrice.toFixed(2)} to live portfolio!`);
    setTimeout(() => {
      setOrderSuccess(null);
      setOrderModalStock(null);
    }, 1400);
  };

  // Helper for Stance badge styling
  const renderStanceBadge = (stance: string) => {
    const s = (stance || "").toUpperCase();
    if (s.includes("STRONG_BULLISH")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          Strong Bullish
        </span>
      );
    }
    if (s.includes("MODERATE_BULLISH")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-teal-500/15 text-teal-400 border border-teal-500/30">
          <TrendingUp className="w-3 h-3 text-teal-400" />
          Moderate Bullish
        </span>
      );
    }
    if (s.includes("ACCUMULATION") || s.includes("RANGE")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
          <Activity className="w-3 h-3 text-cyan-400" />
          Accumulation
        </span>
      );
    }
    if (s.includes("BEARISH")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <TrendingDown className="w-3 h-3 text-rose-400" />
          Bearish Pullback
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-slate-500/15 text-slate-300 border border-slate-500/30">
        <Activity className="w-3 h-3 text-slate-400" />
        Neutral
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-6 animate-fade-in-up">
      {/* ==================== DESK HEADER ==================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                Live Watchlist & Predictive Audit Desk
                <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  CMP REALTIME
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic Current Market Price quotes with multi-horizon AI price forecast cones & institutional governance audits.
              </p>
            </div>
          </div>
        </div>

        {/* Refresh controls & Search trigger */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh interval selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 hidden sm:inline">Interval:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent border-none text-slate-200 text-xs focus:ring-0 cursor-pointer pr-1 outline-none font-mono"
            >
              <option value={60} className="bg-slate-900 text-slate-200">1 Min</option>
              <option value={120} className="bg-slate-900 text-slate-200">2 Min</option>
              <option value={300} className="bg-slate-900 text-slate-200">5 Min</option>
              <option value={0} className="bg-slate-900 text-slate-200">Manual</option>
            </select>
          </div>

          {/* Countdown badge */}
          {refreshInterval > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Next tick:</span>
              <span className="text-emerald-400 font-semibold">{countdown}s</span>
            </div>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={() => {
              fetchQuotes();
              fetchAllAudits();
              setCountdown(refreshInterval);
            }}
            disabled={isQuotesLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors shadow-sm disabled:opacity-50"
            title="Force immediate quotes & audit refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isQuotesLoading ? "animate-spin text-emerald-400" : "text-slate-400"}`} />
            <span>Refresh Now</span>
          </button>

          {/* Add Stock to Watchlist Button */}
          <div className="relative">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Stock</span>
            </button>

            {/* Quick Add Popover */}
            {isSearchOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-fade-in-up">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">Add to Watchlist</span>
                  <button 
                    onClick={() => setIsSearchOpen(false)}
                    className="text-slate-400 hover:text-white p-1 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative mb-2.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search scrip (e.g. RELIANCE, ZOMATO)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredSearchList.length === 0 ? (
                    <div className="text-center py-3 text-xs text-slate-500">
                      No matching securities available
                    </div>
                  ) : (
                    filteredSearchList.map(item => (
                      <button
                        key={item.symbol}
                        onClick={() => handleAddCustomSymbol(item.symbol)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 text-left transition-colors group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-emerald-400">
                            {item.symbol}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                            {item.name}
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {item.sector}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== STATS STRIP & VIEW SWITCHER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Stance:</span>
          </span>
          {(["ALL", "BULLISH", "ACCUMULATION", "BEARISH"] as const).map((stance) => (
            <button
              key={stance}
              onClick={() => setFilterStance(stance)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                filterStance === stance
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {stance}
            </button>
          ))}
        </div>

        {/* Summary counts & View mode toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            Tracking: <strong className="text-white">{watchlist.length}</strong> securities
          </span>
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode("CARDS")}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === "CARDS" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Audit Cards
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === "TABLE" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Dense Table
            </button>
          </div>
        </div>
      </div>

      {/* ==================== CARDS VIEW ==================== */}
      {viewMode === "CARDS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayItems.map((symbol) => {
            const quote = liveQuotes[symbol];
            const audit = auditMap[symbol];
            const isLoadingAudit = auditsLoading[symbol];

            const curPrice = quote?.price ?? audit?.spot_price ?? 0;
            const changePts = quote?.change_pts ?? audit?.day_change ?? 0;
            const changePct = quote?.change_pct ?? audit?.day_change_pct ?? 0;
            const isPositive = changePts >= 0;

            const pred = audit?.future_prediction;
            const targetPrice = pred?.target_price ?? (curPrice * 1.04);
            const expectedReturn = pred?.expected_return_pct ?? 4.0;
            const confidence = pred?.confidence_pct ?? 82.0;
            const stance = pred?.dominant_stance ?? "MODERATE_BULLISH";

            const trajectory = pred?.trajectory_points || [];

            return (
              <div 
                key={symbol}
                className="bg-slate-900/70 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-black/40 backdrop-blur-md group"
              >
                <div>
                  {/* Top Row: Symbol, Sector, Remove button */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white tracking-tight">
                          {symbol}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          NSE
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                        {quote?.company_name || audit?.name || symbol}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {renderStanceBadge(stance)}
                      <button
                        onClick={() => removeFromWatchlist(symbol)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800/80 transition-colors"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* CMP Section with LiveTickPrice */}
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                        Current Market Price (CMP)
                      </span>
                      <div className="text-xl font-bold font-mono text-white mt-0.5">
                        <LiveTickPrice
                          value={curPrice}
                          formatter={(v) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        />
                      </div>
                    </div>

                    <div className={`text-right ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                      <div className="flex items-center justify-end gap-1 font-mono text-xs font-semibold">
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        <span>{isPositive ? "+" : ""}{changePts.toFixed(2)}</span>
                      </div>
                      <div className="text-[11px] font-mono font-medium">
                        ({isPositive ? "+" : ""}{changePct.toFixed(2)}%)
                      </div>
                    </div>
                  </div>

                  {/* Day High / Low bar */}
                  {quote && quote.day_high && quote.day_low && (
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                        <span>L: ₹{quote.day_low.toFixed(1)}</span>
                        <span>H: ₹{quote.day_high.toFixed(1)}</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500/70 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(5, ((curPrice - quote.day_low) / Math.max(1, quote.day_high - quote.day_low)) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* AI Predictive Audit Panel */}
                  <div className="mt-3.5 p-3 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        <span>AI Price Forecast Audit</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Horizon: 14 Days
                      </span>
                    </div>

                    {/* Target & Expected Return */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900/90 p-2 rounded border border-slate-800/60">
                        <span className="text-[10px] text-slate-400 block">Projected CMP Target</span>
                        <span className="font-mono font-bold text-white text-sm">
                          ₹{targetPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="bg-slate-900/90 p-2 rounded border border-slate-800/60">
                        <span className="text-[10px] text-slate-400 block">Expected Return %</span>
                        <span className={`font-mono font-bold text-sm ${expectedReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {expectedReturn >= 0 ? "+" : ""}{expectedReturn.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* AI Confidence Meter */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        AI Quant Confidence:
                      </span>
                      <span className="font-mono font-semibold text-cyan-400">
                        {confidence.toFixed(1)}%
                      </span>
                    </div>

                    {/* Trajectory Mini Sparkline */}
                    {trajectory.length > 0 && (
                      <div className="h-9 w-full pt-1">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
                          {/* Bearish floor boundary */}
                          <polyline
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                            opacity="0.4"
                            points={trajectory.map((p, idx) => {
                              const x = (idx / Math.max(1, trajectory.length - 1)) * 100;
                              const minP = Math.min(...trajectory.map(t => t.bearish_price));
                              const maxP = Math.max(...trajectory.map(t => t.bullish_price));
                              const y = 24 - ((p.bearish_price - minP) / Math.max(1, maxP - minP)) * 24;
                              return `${x},${y}`;
                            }).join(" ")}
                          />
                          {/* Bullish upper boundary */}
                          <polyline
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                            opacity="0.4"
                            points={trajectory.map((p, idx) => {
                              const x = (idx / Math.max(1, trajectory.length - 1)) * 100;
                              const minP = Math.min(...trajectory.map(t => t.bearish_price));
                              const maxP = Math.max(...trajectory.map(t => t.bullish_price));
                              const y = 24 - ((p.bullish_price - minP) / Math.max(1, maxP - minP)) * 24;
                              return `${x},${y}`;
                            }).join(" ")}
                          />
                          {/* Base Forecast Path */}
                          <polyline
                            fill="none"
                            stroke={expectedReturn >= 0 ? "#10b981" : "#f43f5e"}
                            strokeWidth="1.5"
                            points={trajectory.map((p, idx) => {
                              const x = (idx / Math.max(1, trajectory.length - 1)) * 100;
                              const minP = Math.min(...trajectory.map(t => t.bearish_price));
                              const maxP = Math.max(...trajectory.map(t => t.bullish_price));
                              const y = 24 - ((p.base_price - minP) / Math.max(1, maxP - minP)) * 24;
                              return `${x},${y}`;
                            }).join(" ")}
                          />
                        </svg>
                      </div>
                    )}

                    {/* Microstructure Indicators strip */}
                    {audit?.past_market && (
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>RSI: <strong className={audit.past_market.rsi_14 > 60 ? "text-emerald-400" : audit.past_market.rsi_14 < 40 ? "text-rose-400" : "text-slate-200"}>{audit.past_market.rsi_14}</strong></span>
                        <span>Vol: <strong className="text-slate-200">{audit.past_market.volatility_annualized_pct}%</strong></span>
                        <span>EMA: <strong className="text-slate-200">{audit.past_market.ema_alignment}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Inspect Audit & Add to Portfolio */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedAuditDrawer(audit || null)}
                    disabled={!audit}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-xs font-medium text-slate-200 transition-colors disabled:opacity-50"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Audit Detail</span>
                  </button>

                  <button
                    onClick={() => {
                      setOrderModalStock({ symbol, quote, audit });
                      setOrderQuantity(50);
                      setOrderSide("LONG");
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/35 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>+ Portfolio</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== TABLE VIEW ==================== */}
      {viewMode === "TABLE" && (
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl overflow-hidden shadow-lg backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Symbol / Name</th>
                  <th className="py-3 px-4">Current Price (CMP)</th>
                  <th className="py-3 px-4">24h Change</th>
                  <th className="py-3 px-4">AI Stance</th>
                  <th className="py-3 px-4">Target (14d)</th>
                  <th className="py-3 px-4">Expected Return</th>
                  <th className="py-3 px-4">AI Confidence</th>
                  <th className="py-3 px-4">RSI (14)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {displayItems.map((symbol) => {
                  const quote = liveQuotes[symbol];
                  const audit = auditMap[symbol];

                  const curPrice = quote?.price ?? audit?.spot_price ?? 0;
                  const changePts = quote?.change_pts ?? audit?.day_change ?? 0;
                  const changePct = quote?.change_pct ?? audit?.day_change_pct ?? 0;
                  const isPositive = changePts >= 0;

                  const pred = audit?.future_prediction;
                  const targetPrice = pred?.target_price ?? (curPrice * 1.04);
                  const expectedReturn = pred?.expected_return_pct ?? 4.0;
                  const confidence = pred?.confidence_pct ?? 82.0;
                  const stance = pred?.dominant_stance ?? "MODERATE_BULLISH";

                  return (
                    <tr key={symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{symbol}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {quote?.company_name || audit?.name || symbol}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        <LiveTickPrice
                          value={curPrice}
                          formatter={(v) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        <div className={`flex items-center gap-1 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>{isPositive ? "+" : ""}{changePts.toFixed(2)}</span>
                          <span className="text-[10px]">({isPositive ? "+" : ""}{changePct.toFixed(2)}%)</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderStanceBadge(stance)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                        ₹{targetPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3.5 px-4 font-mono font-bold ${expectedReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {expectedReturn >= 0 ? "+" : ""}{expectedReturn.toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cyan-400 font-semibold">
                        {confidence.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {audit?.past_market?.rsi_14 ?? "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAuditDrawer(audit || null)}
                            disabled={!audit}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                            title="Inspect Audit"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setOrderModalStock({ symbol, quote, audit });
                              setOrderQuantity(50);
                              setOrderSide("LONG");
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors"
                            title="Add to Portfolio"
                          >
                            + Add
                          </button>
                          <button
                            onClick={() => removeFromWatchlist(symbol)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Remove from Watchlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== AUDIT INSPECTION DRAWER MODAL ==================== */}
      {selectedAuditDrawer && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-fade-in-up">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {selectedAuditDrawer.symbol}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                    {selectedAuditDrawer.sector}
                  </span>
                  {renderStanceBadge(selectedAuditDrawer.future_prediction?.dominant_stance)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedAuditDrawer.name} — Institutional Microstructure & Policy Audit
                </p>
              </div>
              <button
                onClick={() => setSelectedAuditDrawer(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verdict summary */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                Executive Quant Verdict
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {selectedAuditDrawer.executive_verdict}
              </p>
            </div>

            {/* Forecast metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Spot CMP</span>
                <span className="font-mono font-bold text-white text-base">
                  ₹{selectedAuditDrawer.spot_price.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Target (14d)</span>
                <span className="font-mono font-bold text-emerald-400 text-base">
                  ₹{selectedAuditDrawer.future_prediction?.target_price?.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Expected Return</span>
                <span className="font-mono font-bold text-emerald-400 text-base">
                  +{selectedAuditDrawer.future_prediction?.expected_return_pct}%
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">AI Confidence</span>
                <span className="font-mono font-bold text-cyan-400 text-base">
                  {selectedAuditDrawer.future_prediction?.confidence_pct}%
                </span>
              </div>
            </div>

            {/* Quant Signals strip */}
            {selectedAuditDrawer.past_market && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">1W Return</span>
                  <span className="font-mono text-slate-200 font-semibold">{selectedAuditDrawer.past_market.return_1w_pct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">1M Return</span>
                  <span className="font-mono text-slate-200 font-semibold">{selectedAuditDrawer.past_market.return_1m_pct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">RSI (14)</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedAuditDrawer.past_market.rsi_14}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Volatility</span>
                  <span className="font-mono text-slate-200 font-semibold">{selectedAuditDrawer.past_market.volatility_annualized_pct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">52W High</span>
                  <span className="font-mono text-slate-200 font-semibold">₹{selectedAuditDrawer.past_market.high_52w}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">52W Low</span>
                  <span className="font-mono text-slate-200 font-semibold">₹{selectedAuditDrawer.past_market.low_52w}</span>
                </div>
              </div>
            )}

            {/* Policy & Regulatory Audit */}
            {selectedAuditDrawer.govt_policy && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Government & SEBI Regulatory Impact
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Stance: {selectedAuditDrawer.govt_policy.policy_stance}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedAuditDrawer.govt_policy.key_policy_summary}
                </p>
                {selectedAuditDrawer.govt_policy.applicable_circulars?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold block">Active Circulars:</span>
                    {selectedAuditDrawer.govt_policy.applicable_circulars.map((circ, idx) => (
                      <div key={idx} className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded">
                        {circ}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action button inside modal */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedAuditDrawer(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setOrderModalStock({ 
                    symbol: selectedAuditDrawer.symbol, 
                    quote: liveQuotes[selectedAuditDrawer.symbol], 
                    audit: selectedAuditDrawer 
                  });
                  setSelectedAuditDrawer(null);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20"
              >
                Add to Live Portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== QUICK ADD TO PORTFOLIO MODAL ==================== */}
      {orderModalStock && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Add {orderModalStock.symbol} to Portfolio
                </h3>
              </div>
              <button
                onClick={() => setOrderModalStock(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderSuccess ? (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-xs font-semibold text-emerald-300">{orderSuccess}</div>
              </div>
            ) : (
              <>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Current Market Price (CMP):</span>
                    <span className="font-mono font-bold text-white">
                      ₹{(orderModalStock.quote?.price ?? orderModalStock.audit?.spot_price ?? 1000).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">AI 14d Target Objective:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ₹{(orderModalStock.audit?.future_prediction?.target_price ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Position Side</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderSide("LONG")}
                        className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                          orderSide === "LONG"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        LONG (BUY)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderSide("SHORT")}
                        className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                          orderSide === "SHORT"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        SHORT (SELL)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Quantity (Shares)</label>
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 pt-1 font-mono">
                    <span>Total Investment Exposure:</span>
                    <span className="text-white font-bold">
                      ₹{(((orderModalStock.quote?.price ?? orderModalStock.audit?.spot_price ?? 1000)) * orderQuantity).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderModalStock(null)}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteAddToPortfolio}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    Confirm & Save Position
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
