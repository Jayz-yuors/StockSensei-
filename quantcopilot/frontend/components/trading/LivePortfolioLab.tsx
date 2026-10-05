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
  Download, 
  Sliders, 
  AlertCircle,
  FlaskConical,
  Zap,
  Globe
} from "lucide-react";
import { LiveYfinanceQuote, LabPortfolioPosition } from "../../types";
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
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", sector: "Financials" },
  { symbol: "MARUTI", name: "Maruti Suzuki India", sector: "Automotive" },
  { symbol: "SUNPHARMA", name: "Sun Pharma Industries", sector: "Pharma" },
  { symbol: "TITAN", name: "Titan Company Ltd", sector: "Consumer" },
  { symbol: "ZOMATO", name: "Zomato Ltd", sector: "Tech Platform" },
  { symbol: "TRENT", name: "Trent Ltd (Tata Retail)", sector: "Retail" }
];

const LOCAL_STORAGE_KEY = "quantcopilot_lab_portfolio_v1";

export const LivePortfolioLab: React.FC = () => {
  // Positions in custom lab
  const [positions, setPositions] = useState<LabPortfolioPosition[]>([]);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

  // Live quotes map fetched from yfinance
  const [liveQuotes, setLiveQuotes] = useState<Record<string, LiveYfinanceQuote>>({});
  const [isQuotesLoading, setIsQuotesLoading] = useState(false);
  const [lastQuotesSync, setLastQuotesSync] = useState<Date | null>(null);

  // Stock picker state
  const [selectedSymbol, setSelectedSymbol] = useState<string>("RELIANCE");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activePickerQuote, setActivePickerQuote] = useState<LiveYfinanceQuote | null>(null);
  const [isPickerQuoteLoading, setIsPickerQuoteLoading] = useState(false);

  // Trade form
  const [quantity, setQuantity] = useState<number>(50);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [side, setSide] = useState<"LONG" | "SHORT">("LONG");
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);

  // Auto-refresh timer
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30); // seconds
  const [countdown, setCountdown] = useState<number>(30);

  // Load positions from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPositions(parsed);
        }
      }
    } catch {
      // Ignore storage error
    }
    setIsLoadedFromStorage(true);
  }, []);

  // Save positions to LocalStorage
  useEffect(() => {
    if (isLoadedFromStorage) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(positions));
      } catch {
        // Ignore storage error
      }
    }
  }, [positions, isLoadedFromStorage]);

  // Fetch live quote for picker whenever selectedSymbol changes
  const fetchPickerQuote = useCallback(async (sym: string) => {
    if (!sym) return;
    setIsPickerQuoteLoading(true);
    try {
      const cleanSym = sym.trim().toUpperCase();
      const res = await fetch(`${getApiBaseUrl()}/api/v1/portfolio/yfinance-quote/${cleanSym}`);
      if (res.ok) {
        const data: LiveYfinanceQuote = await res.json();
        setActivePickerQuote(data);
        // Default entry price to current live market price
        setEntryPrice(data.price);
      }
    } catch (err) {
      console.error("Failed to fetch picker live quote:", err);
    } finally {
      setIsPickerQuoteLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPickerQuote(selectedSymbol);
  }, [selectedSymbol, fetchPickerQuote]);

  // Batch fetch live quotes from yfinance for all portfolio positions
  const fetchPortfolioBatchQuotes = useCallback(async (posList: LabPortfolioPosition[]) => {
    if (posList.length === 0) return;
    setIsQuotesLoading(true);
    try {
      const symbols = Array.from(new Set(posList.map((p) => p.symbol)));
      const res = await fetch(`${getApiBaseUrl()}/api/v1/portfolio/yfinance-batch-quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quotes) {
          setLiveQuotes((prev) => ({ ...prev, ...data.quotes }));
          setLastQuotesSync(new Date());
        }
      }
    } catch (err) {
      console.error("Failed to fetch batch yfinance quotes:", err);
    } finally {
      setIsQuotesLoading(false);
    }
  }, []);

  // Sync batch quotes when positions change
  useEffect(() => {
    if (positions.length > 0) {
      fetchPortfolioBatchQuotes(positions);
    }
  }, [positions, fetchPortfolioBatchQuotes]);

  // Auto-refresh countdown loop
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (positions.length > 0) {
            fetchPortfolioBatchQuotes(positions);
          }
          if (selectedSymbol) {
            fetchPickerQuote(selectedSymbol);
          }
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, positions, selectedSymbol, fetchPortfolioBatchQuotes, fetchPickerQuote]);

  // Add position handler
  const handleAddPosition = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSymbol || quantity <= 0) return;

    const currentPriceToUse = entryPrice > 0 ? entryPrice : (activePickerQuote?.price || 1000);
    const matchedStock = POPULAR_NSE_TICKERS.find((t) => t.symbol === selectedSymbol);

    const newPos: LabPortfolioPosition = {
      id: `${selectedSymbol}-${Date.now()}`,
      symbol: selectedSymbol,
      company_name: matchedStock?.name || selectedSymbol,
      exchange: "NSE",
      quantity,
      entry_price: currentPriceToUse,
      side,
      added_at: new Date().toISOString()
    };

    // If already exists with same side, update quantity & avg price
    setPositions((prev) => {
      const existingIdx = prev.findIndex((p) => p.symbol === selectedSymbol && p.side === side);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const totalQty = existing.quantity + quantity;
        const avgPrice = Number(
          (((existing.entry_price * existing.quantity) + (currentPriceToUse * quantity)) / totalQty).toFixed(2)
        );
        const updated = [...prev];
        updated[existingIdx] = { ...existing, quantity: totalQty, entry_price: avgPrice };
        return updated;
      }
      return [newPos, ...prev];
    });

    setAddSuccessMessage(`Added ${quantity} qty of ${selectedSymbol} @ Rs ${currentPriceToUse}`);
    setTimeout(() => setAddSuccessMessage(null), 3000);
  };

  // Remove individual position
  const handleRemovePosition = (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  // Clear all positions (Clean slate)
  const handleClearAllPositions = () => {
    if (positions.length === 0) return;
    if (confirm("Clear all positions from Live Portfolio Lab to start with an empty slate?")) {
      setPositions([]);
      setLiveQuotes({});
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  };

  // Load sample starter portfolio
  const handleLoadSamplePositions = () => {
    const samples: LabPortfolioPosition[] = [
      { id: "s1", symbol: "RELIANCE", company_name: "Reliance Industries", exchange: "NSE", quantity: 50, entry_price: 1180.0, side: "LONG", added_at: new Date().toISOString() },
      { id: "s2", symbol: "TCS", company_name: "Tata Consultancy Services", exchange: "NSE", quantity: 30, entry_price: 2100.0, side: "LONG", added_at: new Date().toISOString() },
      { id: "s3", symbol: "INFY", company_name: "Infosys Ltd", exchange: "NSE", quantity: 60, entry_price: 1015.0, side: "LONG", added_at: new Date().toISOString() },
      { id: "s4", symbol: "TATAMOTORS", company_name: "Tata Motors Ltd", exchange: "NSE", quantity: 100, entry_price: 1040.0, side: "LONG", added_at: new Date().toISOString() }
    ];
    setPositions(samples);
  };

  // Compute portfolio valuation with live quotes
  const portfolioMetrics = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalDayChange = 0;

    const computedPositions = positions.map((p) => {
      const quote = liveQuotes[p.symbol];
      const livePrice = quote?.price || p.entry_price;
      const prevClose = quote?.prev_close || livePrice;

      const mult = p.side === "LONG" ? 1 : -1;
      const investedValue = p.quantity * p.entry_price;
      const currentValue = p.quantity * livePrice;
      const unrealizedPnl = (currentValue - investedValue) * mult;
      const pnlPct = investedValue > 0 ? (unrealizedPnl / investedValue) * 100 : 0;
      const dayChangeVal = (livePrice - prevClose) * p.quantity * mult;

      totalInvested += investedValue;
      totalCurrent += currentValue;
      totalDayChange += dayChangeVal;

      return {
        ...p,
        livePrice,
        prevClose,
        investedValue,
        currentValue,
        unrealizedPnl,
        pnlPct,
        dayChangeVal,
        change24hPct: quote?.change_pct || 0,
        dayHigh: quote?.day_high,
        dayLow: quote?.day_low,
        volume: quote?.volume || 0,
        marketCapCr: quote?.market_cap_cr || 0
      };
    });

    const netUnrealizedPnl = totalCurrent - totalInvested;
    const netReturnPct = totalInvested > 0 ? (netUnrealizedPnl / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      netUnrealizedPnl,
      netReturnPct,
      totalDayChange,
      positionsWithLive: computedPositions
    };
  }, [positions, liveQuotes]);

  // Filtered popular tickers for search
  const filteredTickers = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_NSE_TICKERS;
    const q = searchQuery.trim().toUpperCase();
    return POPULAR_NSE_TICKERS.filter(
      (t) => t.symbol.includes(q) || t.name.toUpperCase().includes(q) || t.sector.toUpperCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-slate-100 font-sans pb-16">
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="p-1.5 rounded-md bg-[#0e1422] border border-slate-800 text-emerald-400">
              <FlaskConical className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider uppercase">
              SANDBOX &amp; PORTFOLIO LAB
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700/80 uppercase">
              YAHOO FINANCE DIRECT (.NS)
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-white uppercase">
            LIVE PORTFOLIO LAB
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-3xl">
            Clean-slate quantitative experimentation sandbox. Choose equities at their current market value, eliminate pre-loaded positions, and monitor positions streaming directly from Yahoo Finance (.NS).
          </p>
        </div>

        {/* Live Status Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center space-x-2 bg-[#0e1422] border border-slate-800 rounded-md px-2.5 py-1.5 shadow-sm">
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-300 font-semibold text-[11px]">FEED: YFINANCE LIVE</span>
          </div>

          <div className="flex items-center space-x-2 bg-[#0e1422] border border-slate-800 rounded-md px-2.5 py-1.5 shadow-sm">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">
              {lastQuotesSync ? `SYNCED: ${lastQuotesSync.toLocaleTimeString()}` : "CONNECTING..."}
            </span>
          </div>

          <button
            onClick={() => {
              if (positions.length > 0) fetchPortfolioBatchQuotes(positions);
              if (selectedSymbol) fetchPickerQuote(selectedSymbol);
              setCountdown(autoRefreshInterval);
            }}
            disabled={isQuotesLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#0e1422] hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-sans font-medium text-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isQuotesLoading ? "animate-spin text-emerald-400" : ""}`} />
            <span>REFRESH ({countdown}s)</span>
          </button>

          <button
            onClick={handleClearAllPositions}
            disabled={positions.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 font-sans font-medium text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Remove all positions to start with a clean slate"
          >
            <Trash2 className="h-3 w-3" />
            <span>CLEAR ALL</span>
          </button>
        </div>
      </div>

      {/* Aggregate Portfolio KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Invested Capital</span>
            <Layers className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            <LiveTickPrice
              value={portfolioMetrics.totalInvested}
              prefix="₹"
              formatter={(v) => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
            />
          </div>
          <div className="mt-1 text-xs text-slate-500 font-sans">
            {positions.length} Active Position{positions.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Live Market Valuation</span>
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100 tabular-nums">
            <LiveTickPrice
              value={portfolioMetrics.totalCurrent}
              prefix="₹"
              formatter={(v) => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
            />
          </div>
          <div className="mt-1 text-xs text-slate-500 font-sans">
            Real-time Mark-to-Market
          </div>
        </div>

        <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Unrealized P&amp;L</span>
            {portfolioMetrics.netUnrealizedPnl >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
            )}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums flex items-center space-x-1">
            <LiveTickPrice
              value={portfolioMetrics.netUnrealizedPnl}
              formatter={(v) => `${Number(v) >= 0 ? "+" : ""}₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
              colorize={true}
              showDirectionIcon={true}
            />
          </div>
          <div className="mt-1 text-xs font-mono tabular-nums">
            <LiveTickPrice
              value={portfolioMetrics.netReturnPct}
              formatter={(v) => `${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(2)}% Overall`}
              colorize={true}
              className="font-semibold text-xs font-mono"
            />
          </div>
        </div>

        <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Today&#39;s Day P&amp;L</span>
            <Activity className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums">
            <LiveTickPrice
              value={portfolioMetrics.totalDayChange}
              formatter={(v) => `${Number(v) >= 0 ? "+" : ""}₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
              colorize={true}
            />
          </div>
          <div className="mt-1 text-xs text-slate-500 font-sans">
            Source: yfinance (.NS) Close
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Stock Selector & Live Market Value Card; Right = User Portfolio Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stock Selector & Live Value Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-4 md:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-200">
                  CHOOSE STOCK &amp; LIVE VALUE
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/80">
                NSE / BSE
              </span>
            </div>

            {/* Custom Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search symbol (e.g. RELIANCE, ZOMATO)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    setSelectedSymbol(searchQuery.trim().toUpperCase());
                  }
                }}
                className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/30 uppercase transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      setSelectedSymbol(searchQuery.trim().toUpperCase());
                    }
                  }}
                  className="absolute right-2 top-2 px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
                >
                  LOAD
                </button>
              )}
            </div>

            {/* Quick-Pick Popular Stock Pills */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider block">
                Quick Select Popular Equities:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {filteredTickers.map((t) => {
                  const isSelected = selectedSymbol === t.symbol;
                  return (
                    <button
                      key={t.symbol}
                      onClick={() => {
                        setSelectedSymbol(t.symbol);
                        setSearchQuery("");
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                        isSelected
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-bold shadow-sm"
                          : "bg-[#0e1422] text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-100"
                      }`}
                    >
                      {t.symbol}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Current Market Value Display Card */}
            <div className="bg-[#080b11] border border-slate-800/80 rounded-lg p-4 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-base font-bold font-mono text-white tracking-wide">
                    {selectedSymbol}
                  </span>
                  <span className="text-[11px] font-sans text-slate-400 block">
                    {activePickerQuote?.company_name || selectedSymbol} (NSE)
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-sans text-slate-500 uppercase tracking-wider">Feed Source</div>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    Yahoo Finance (.NS)
                  </span>
                </div>
              </div>

              {isPickerQuoteLoading ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin" />
                  <span className="text-xs font-sans text-slate-400">Fetching live market value...</span>
                </div>
              ) : activePickerQuote ? (
                <div className="space-y-3 pt-1">
                  {/* Big Live Price */}
                  <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2.5">
                    <div>
                      <span className="text-2xl font-bold font-mono text-white tabular-nums">
                        ₹{activePickerQuote.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 text-xs font-mono font-bold px-2 py-0.5 rounded tabular-nums ${
                        activePickerQuote.change_pct >= 0
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {activePickerQuote.change_pct >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      <span>
                        {activePickerQuote.change_pct >= 0 ? "+" : ""}
                        {activePickerQuote.change_pct.toFixed(2)}% (₹{activePickerQuote.change_pts})
                      </span>
                    </div>
                  </div>

                  {/* Day Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#0e1422]/70 p-2 rounded border border-slate-800/70">
                      <span className="text-[10px] font-sans text-slate-400 uppercase tracking-wider block">Day Range</span>
                      <span className="text-slate-200 font-mono font-medium tabular-nums">
                        ₹{activePickerQuote.day_low} - ₹{activePickerQuote.day_high}
                      </span>
                    </div>
                    <div className="bg-[#0e1422]/70 p-2 rounded border border-slate-800/70">
                      <span className="text-[10px] font-sans text-slate-400 uppercase tracking-wider block">52-Week Range</span>
                      <span className="text-slate-200 font-mono font-medium tabular-nums">
                        ₹{activePickerQuote.fifty_two_week_low || "N/A"} - ₹{activePickerQuote.fifty_two_week_high || "N/A"}
                      </span>
                    </div>
                    <div className="bg-[#0e1422]/70 p-2 rounded border border-slate-800/70">
                      <span className="text-[10px] font-sans text-slate-400 uppercase tracking-wider block">Day Volume</span>
                      <span className="text-slate-200 font-mono font-medium tabular-nums">
                        {activePickerQuote.volume.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="bg-[#0e1422]/70 p-2 rounded border border-slate-800/70">
                      <span className="text-[10px] font-sans text-slate-400 uppercase tracking-wider block">Market Cap</span>
                      <span className="text-slate-200 font-mono font-medium tabular-nums">
                        {activePickerQuote.market_cap_cr
                          ? `₹${activePickerQuote.market_cap_cr.toLocaleString("en-IN")} Cr`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500 font-sans">
                  Select a ticker to inspect live price
                </div>
              )}
            </div>

            {/* Position Trade Input Form */}
            <form onSubmit={handleAddPosition} className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Side
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-[#080b11] p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSide("LONG")}
                      className={`py-1 text-xs font-mono font-bold rounded transition-colors ${
                        side === "LONG"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      BUY / LONG
                    </button>
                    <button
                      type="button"
                      onClick={() => setSide("SHORT")}
                      className={`py-1 text-xs font-mono font-bold rounded transition-colors ${
                        side === "SHORT"
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      SELL / SHORT
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/30"
                  />
                </div>
              </div>

              {/* Quick Qty Preset Chips */}
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-sans text-slate-500 mr-1">Presets:</span>
                {[10, 25, 50, 100, 250].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0e1422] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    +{q}
                  </button>
                ))}
              </div>

              {/* Entry Price (Pre-filled with Live Market Value) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
                    Entry Price (₹)
                  </label>
                  {activePickerQuote && (
                    <button
                      type="button"
                      onClick={() => setEntryPrice(activePickerQuote.price)}
                      className="text-[10px] font-mono text-emerald-400 hover:underline"
                    >
                      Use Live LTP (₹{activePickerQuote.price})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.05"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600/30"
                />
              </div>

              {/* Add Button */}
              <button
                type="submit"
                disabled={!selectedSymbol || quantity <= 0}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                <span>ADD TO LIVE PORTFOLIO</span>
              </button>

              {addSuccessMessage && (
                <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800/80 text-xs font-mono text-emerald-300 flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{addSuccessMessage}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: User's Custom Portfolio Positions Table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-4 md:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                  <span>ACTIVE LAB PORTFOLIO</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {positions.length} STOCKS
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Data streaming live from Yahoo Finance (.NS) for mark-to-market execution
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {positions.length === 0 && (
                  <button
                    onClick={handleLoadSamplePositions}
                    className="px-3 py-1.5 rounded-md bg-[#0e1422] hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-sans font-medium transition-colors"
                  >
                    Load Sample Equities
                  </button>
                )}
                {positions.length > 0 && (
                  <button
                    onClick={handleClearAllPositions}
                    className="px-3 py-1.5 rounded-md bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 text-xs font-sans font-medium transition-colors flex items-center space-x-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Position Table or Clean Slate Screen */}
            {positions.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-slate-800 rounded-xl bg-[#080b11] p-8 space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#0e1422] border border-slate-800 flex items-center justify-center mx-auto text-emerald-400">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold font-sans text-white uppercase tracking-wider">
                    EMPTY LAB SANDBOX - CLEAN SLATE
                  </h4>
                  <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
                    Pre-added mock positions have been removed. Choose stocks on the left at their live current market value from Yahoo Finance to build your custom portfolio.
                  </p>
                </div>
                <div className="pt-2 flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      setSelectedSymbol("RELIANCE");
                      fetchPickerQuote("RELIANCE");
                    }}
                    className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold font-sans transition-colors"
                  >
                    Choose RELIANCE (₹{activePickerQuote?.price || 1186})
                  </button>
                  <button
                    onClick={handleLoadSamplePositions}
                    className="px-3.5 py-1.5 rounded-md bg-[#0e1422] hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-sans font-medium transition-colors"
                  >
                    Load 4 Sample Equities
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800/80 rounded-lg bg-[#0e1422]/40">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-[#090d16] text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Asset</th>
                      <th className="py-2.5 px-3">Side</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Entry (₹)</th>
                      <th className="py-2.5 px-3 text-right">Live LTP (₹)</th>
                      <th className="py-2.5 px-3 text-right">Invested</th>
                      <th className="py-2.5 px-3 text-right">Current Value</th>
                      <th className="py-2.5 px-3 text-right">Unrealized P&amp;L</th>
                      <th className="py-2.5 px-3 text-right">Day Chg</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {portfolioMetrics.positionsWithLive.map((pos) => {
                      const isProfit = pos.unrealizedPnl >= 0;
                      return (
                        <tr
                          key={pos.id}
                          className="hover:bg-[#121929] transition-colors group"
                        >
                          <td className="py-3 px-3">
                            <div className="font-bold text-white font-mono flex items-center space-x-1.5">
                              <span>{pos.symbol}</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-sans">
                                .NS
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[130px] font-sans">
                              {pos.company_name || pos.symbol}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                pos.side === "LONG"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {pos.side}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-slate-200 tabular-nums">
                            {pos.quantity}
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                            ₹{pos.entry_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-100 tabular-nums">
                            <LiveTickPrice value={pos.livePrice} prefix="₹" />
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                            ₹{pos.investedValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </td>

                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-100 tabular-nums">
                            <LiveTickPrice value={pos.currentValue} prefix="₹" />
                          </td>

                          <td className="py-3 px-3 text-right font-mono tabular-nums">
                            <div className="font-bold">
                              <LiveTickPrice
                                value={pos.unrealizedPnl}
                                formatter={(v) => `${Number(v) >= 0 ? "+" : ""}₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                                colorize={true}
                                showDirectionIcon={true}
                              />
                            </div>
                            <div
                              className={`text-[10px] ${
                                isProfit ? "text-emerald-500" : "text-rose-500"
                              }`}
                            >
                              {pos.pnlPct >= 0 ? "+" : ""}
                              {pos.pnlPct.toFixed(2)}%
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-mono tabular-nums">
                            <span
                              className={`text-xs ${
                                pos.change24hPct >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {pos.change24hPct >= 0 ? "+" : ""}
                              {pos.change24hPct.toFixed(2)}%
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleRemovePosition(pos.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                              title="Remove position"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Footer Info */}
            {positions.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-sans text-slate-500 pt-3 border-t border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>
                    Auto-persisted to Local Storage. Live prices query Yahoo Finance API (.NS) with zero mock latency.
                  </span>
                </div>
                <div className="mt-1 sm:mt-0 text-slate-400 font-mono tabular-nums">
                  Total Exposure: ₹{portfolioMetrics.totalCurrent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
              </div>
            )}
          </div>

          {/* Allocation & Risk Breakdown Bar */}
          {positions.length > 0 && (
            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-4 md:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="font-bold uppercase tracking-wider text-slate-300">
                  PORTFOLIO ALLOCATION BREAKDOWN
                </span>
                <span className="text-slate-500 font-mono">100% Total Capital</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-800">
                {portfolioMetrics.positionsWithLive.map((pos, idx) => {
                  const weight = portfolioMetrics.totalCurrent > 0 
                    ? (pos.currentValue / portfolioMetrics.totalCurrent) * 100 
                    : 0;
                  const colors = [
                    "bg-emerald-500",
                    "bg-cyan-500",
                    "bg-indigo-500",
                    "bg-amber-500",
                    "bg-purple-500",
                    "bg-rose-500"
                  ];
                  const color = colors[idx % colors.length];
                  return (
                    <div
                      key={pos.id}
                      style={{ width: `${weight}%` }}
                      className={`${color} h-full transition-all`}
                      title={`${pos.symbol}: ${weight.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 pt-1 text-xs">
                {portfolioMetrics.positionsWithLive.map((pos, idx) => {
                  const weight = portfolioMetrics.totalCurrent > 0 
                    ? (pos.currentValue / portfolioMetrics.totalCurrent) * 100 
                    : 0;
                  const colors = [
                    "text-emerald-400",
                    "text-cyan-400",
                    "text-indigo-400",
                    "text-amber-400",
                    "text-purple-400",
                    "text-rose-400"
                  ];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={pos.id} className="flex items-center space-x-1 font-mono text-[11px] tabular-nums">
                      <span className={`font-bold ${color}`}>{pos.symbol}:</span>
                      <span className="text-slate-300">{weight.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
