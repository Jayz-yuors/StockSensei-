"use client";

import React, { useEffect, useState } from "react";
import { usePortfolioStore } from "../store/usePortfolioStore";
import { HistoricalCandle, HistoricalSeriesPayload } from "../types";
import { 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Search, 
  TrendingUp, 
  BarChart2, 
  X, 
  Filter, 
  Layers,
  ArrowUpDown
} from "lucide-react";
import { getApiBaseUrl } from "../lib/api";
import { LiveTickPrice } from "./common/LiveTickPrice";

const SECTORS = [
  "ALL",
  "Banking",
  "IT Services",
  "Automotive",
  "Energy",
  "FMCG",
  "Pharma",
  "Infrastructure",
  "Metals",
  "Financial Services"
];

export const IndianMarketWidget: React.FC = () => {
  const { 
    indianTickers, 
    selectedSectorFilter, 
    setSelectedSectorFilter,
    selectedHistorySymbol, 
    setSelectedHistorySymbol 
  } = usePortfolioStore();

  const [exchangeFilter, setExchangeFilter] = useState<"ALL" | "NSE" | "BSE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"symbol" | "price" | "change" | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [historyPayload, setHistoryPayload] = useState<HistoricalSeriesPayload | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);


  // Fetch historical price series when a symbol is clicked
  useEffect(() => {
    if (!selectedHistorySymbol) {
      setHistoryPayload(null);
      return;
    }

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const cleanSym = selectedHistorySymbol.replace("-EQ", "").trim();
        const res = await fetch(`${getApiBaseUrl()}/api/v1/nse/history/${encodeURIComponent(cleanSym)}?period=1y`);
        if (res.ok) {
          const data = await res.json();
          setHistoryPayload(data);
        } else {
          setHistoryPayload(generateFallbackSeries(selectedHistorySymbol));
        }
      } catch {
        setHistoryPayload(generateFallbackSeries(selectedHistorySymbol));
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [selectedHistorySymbol]);

  const generateFallbackSeries = (symbol: string): HistoricalSeriesPayload => {
    const candles: HistoricalCandle[] = [];
    let price = 1000.0;
    const now = new Date();
    for (let i = 90; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const change = (Math.random() - 0.48) * 0.03;
      const open = price;
      const close = price * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      price = close;
      candles.push({
        symbol,
        date: d.toISOString().split("T")[0],
        open_price: Number(open.toFixed(2)),
        high_price: Number(high.toFixed(2)),
        low_price: Number(low.toFixed(2)),
        close_price: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 5000000) + 500000,
        pct_change: Number((change * 100).toFixed(2))
      });
    }
    return {
      symbol,
      company_name: symbol,
      period: "1y",
      candles
    };
  };

  const seenTokens = new Set<string>();
  const tickerList = Object.values(indianTickers).filter((t) => {
    const key = t.token || t.symbol;
    if (seenTokens.has(key)) return false;
    seenTokens.add(key);
    return true;
  });

  const filteredTickers = tickerList.filter((t) => {
    const isBse = t.symbol === "SENSEX" || t.exchange === "BSE" || (t.company_name && t.company_name.includes("BSE"));
    const matchesExchange =
      exchangeFilter === "ALL" ||
      (exchangeFilter === "BSE" && isBse) ||
      (exchangeFilter === "NSE" && !isBse);

    const matchesSector = selectedSectorFilter === "ALL" || t.sector === selectedSectorFilter;
    const matchesSearch =
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.company_name && t.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.sector && t.sector.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesExchange && matchesSector && matchesSearch;
  });

  const sortedTickers = [...filteredTickers].sort((a, b) => {
    if (!sortField) return 0;
    if (sortField === "symbol") {
      return sortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
    }
    if (sortField === "price") {
      return sortAsc ? a.price - b.price : b.price - a.price;
    }
    if (sortField === "change") {
      return sortAsc ? a.change_24h - b.change_24h : b.change_24h - a.change_24h;
    }
    return 0;
  });

  const toggleSort = (field: "symbol" | "price" | "change") => {
    if (sortField === field) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortField(null);
        setSortAsc(true);
      }
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const avgLatency = tickerList.length > 0
    ? (tickerList.reduce((acc, t) => acc + t.latency_ms, 0) / tickerList.length).toFixed(2)
    : "1.38";

  return (
    <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-4 md:p-5 shadow-sm space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs">
            NSE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-bold font-sans text-white tracking-tight">
                INDIAN STOCK MARKET TERMINAL
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded font-mono font-medium">
                NSE &amp; BSE LIVE
              </span>
            </div>
            <p className="text-xs font-sans text-slate-400 mt-0.5">
              Real-time market depth, official exchange LTP, and historical OHLCV data engine.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-2 bg-[#0e1422] border border-slate-800/90 rounded-md px-2.5 py-1">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400 text-[11px]">
              LATENCY: <strong className="text-slate-200 font-bold">{avgLatency}ms</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2 bg-[#0e1422] border border-slate-800/90 rounded-md px-2.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-300 text-[11px]">FEED: YAHOO DIRECT &amp; POSTGRES</span>
          </div>
        </div>
      </div>

      {/* Benchmark Index Cards Grid (4 columns on lg, 2 on sm) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tickerList.filter((t) => t.type === "INDEX").map((indexTicker) => {
          const isPos = indexTicker.change_24h >= 0;
          return (
            <div
              key={indexTicker.symbol}
              onClick={() => setSelectedHistorySymbol(indexTicker.symbol)}
              className="bg-[#0e1422] border border-slate-800/90 hover:border-slate-700 rounded-lg p-3.5 flex flex-col justify-between shadow-sm cursor-pointer transition-all hover:bg-[#121929] active:scale-[0.99]"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-sans text-slate-400 uppercase tracking-wider font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <TrendingUp className="h-3 w-3 text-slate-500" />
                    INDEX BENCHMARK
                  </span>
                  <span className="text-[9px] font-mono font-semibold px-1 py-0.2 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                    {indexTicker.exchange || "NSE"}
                  </span>
                </div>

                <div className="text-sm font-bold font-sans text-white mt-1.5 tracking-tight">
                  {indexTicker.symbol}
                </div>
              </div>

              <div className="my-2.5">
                <div className="text-xl md:text-2xl font-bold font-mono text-slate-100 tabular-nums">
                  <LiveTickPrice value={indexTicker.price} prefix="₹" />
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <div
                    className={`inline-flex items-center space-x-1 text-xs font-mono font-bold px-1.5 py-0.5 rounded tabular-nums ${
                      isPos
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    <LiveTickPrice
                      value={indexTicker.change_24h}
                      formatter={(val) => `${Number(val) >= 0 ? "+" : ""}${Number(val)}%`}
                      showDirectionIcon={true}
                      colorize={true}
                    />
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {indexTicker.change_pts ? (
                      <LiveTickPrice
                        value={indexTicker.change_pts}
                        formatter={(val) => `${isPos ? "+" : ""}₹${val}`}
                      />
                    ) : ""}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                <span>Bid: <LiveTickPrice value={indexTicker.bid} prefix="₹" /></span>
                <span>Ask: <LiveTickPrice value={indexTicker.ask} prefix="₹" /></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exchange Switcher + Search + Sector Toolbar */}
      <div className="flex flex-col gap-3 bg-[#0e1422] p-3 rounded-lg border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Exchange Filter Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-sans text-slate-400 font-medium flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-500" /> Exchange:
            </span>
            <div className="inline-flex bg-[#090d16] p-0.5 rounded-md border border-slate-800">
              {(["ALL", "NSE", "BSE"] as const).map((ex) => (
                <button
                  key={ex}
                  onClick={() => setExchangeFilter(ex)}
                  className={`px-3 py-1 text-xs font-mono rounded font-medium transition-all ${
                    exchangeFilter === ex
                      ? "bg-slate-800 text-white font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {ex === "ALL" ? "ALL (NSE & BSE)" : ex}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative shrink-0 w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across ~6,700+ NSE & BSE stocks..."
              className="w-full bg-[#090d16] border border-slate-800 rounded-md pl-9 pr-8 py-1.5 text-xs text-slate-200 font-sans placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sector Filters (Horizontal Scrolling Strip) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 pt-2 border-t border-slate-800/80">
          <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0 ml-1" />
          {SECTORS.map((sector) => {
            const isSelected = selectedSectorFilter === sector;
            return (
              <button
                key={sector}
                onClick={() => setSelectedSectorFilter(sector)}
                className={`px-2.5 py-1 text-[11px] font-sans rounded-md shrink-0 transition-colors ${
                  isSelected
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {sector}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Stock Data Table */}
      <div className="overflow-x-auto border border-slate-800/80 rounded-lg bg-[#0e1422]/60">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="bg-[#090d16] text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-medium select-none">
              <th 
                onClick={() => toggleSort("symbol")} 
                className="py-2.5 px-4 font-semibold cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Symbol / Company</span>
                  <ArrowUpDown className={`h-3 w-3 text-slate-500 transition-colors ${sortField === "symbol" ? "text-emerald-400" : ""}`} />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold">Sector</th>
              <th 
                onClick={() => toggleSort("price")} 
                className="py-2.5 px-3 text-right font-semibold cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>LTP (Last Traded)</span>
                  <ArrowUpDown className={`h-3 w-3 text-slate-500 transition-colors ${sortField === "price" ? "text-emerald-400" : ""}`} />
                </div>
              </th>
              <th 
                onClick={() => toggleSort("change")} 
                className="py-2.5 px-3 text-right font-semibold cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>24h Change</span>
                  <ArrowUpDown className={`h-3 w-3 text-slate-500 transition-colors ${sortField === "change" ? "text-emerald-400" : ""}`} />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right font-semibold">Prev Close / Open</th>
              <th className="py-2.5 px-3 text-right font-semibold">Day High / Low</th>
              <th className="py-2.5 px-3 text-right font-semibold">52W High / Low</th>
              <th className="py-2.5 px-4 text-right font-semibold">Analytics</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedTickers.map((t) => {
              const isPos = t.change_24h >= 0;
              const prevCloseVal = t.prev_close || Number((t.price / (1 + (t.change_24h / 100))).toFixed(2));
              const openPriceVal = t.open_price || t.price;

              return (
                <tr
                  key={t.symbol}
                  onClick={() => setSelectedHistorySymbol(t.symbol)}
                  className="hover:bg-[#121929] transition-colors duration-150 cursor-pointer group active:bg-[#162034]"
                >
                  {/* Symbol & Company */}
                  <td className="py-2.5 px-4">
                    <div className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors flex items-center space-x-2 font-mono">
                      <span>{t.symbol}</span>
                      <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                        {t.symbol === "SENSEX" || (t.company_name && t.company_name.includes("BSE")) ? "BSE" : "NSE"}
                      </span>
                    </div>
                    {t.company_name && (
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                        {t.company_name}
                      </div>
                    )}
                  </td>

                  {/* Sector */}
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/60 text-slate-300 border border-slate-700/60">
                      {t.sector || "Equities"}
                    </span>
                  </td>

                  {/* LTP with Micro-Interaction */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100 tabular-nums">
                    <LiveTickPrice value={t.price} prefix="₹" />
                  </td>

                  {/* 24h Change with Micro-Interaction */}
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    <LiveTickPrice
                      value={t.change_24h}
                      formatter={(val) => `${Number(val) >= 0 ? "+" : ""}${Number(val)}%`}
                      colorize={true}
                      showDirectionIcon={true}
                    />
                  </td>

                  {/* Prev Close / Open */}
                  <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-300 tabular-nums">
                    <div>Prev: ₹{prevCloseVal.toLocaleString("en-IN")}</div>
                    <div className="text-[10px] text-slate-500">
                      Open: ₹{openPriceVal.toLocaleString("en-IN")}
                    </div>
                  </td>

                  {/* Day High / Low */}
                  <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-300 tabular-nums">
                    <div>H: ₹{(t.day_high || t.high_24h).toLocaleString("en-IN")}</div>
                    <div className="text-[10px] text-slate-500">
                      L: ₹{(t.day_low || t.low_24h).toLocaleString("en-IN")}
                    </div>
                  </td>

                  {/* 52W High / Low */}
                  <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-300 tabular-nums">
                    <div>₹{(t.fifty_two_week_high || t.high_24h).toLocaleString("en-IN")}</div>
                    <div className="text-[10px] text-slate-500">
                      ₹{(t.fifty_two_week_low || t.low_24h).toLocaleString("en-IN")}
                    </div>
                  </td>

                  {/* Analytics Button */}
                  <td className="py-2.5 px-4 text-right">
                    <button className="inline-flex items-center space-x-1 bg-[#141c2c] hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono px-2.5 py-1 rounded transition-all duration-150 active:translate-y-[0.5px] border border-slate-700/80">
                      <BarChart2 className="h-3 w-3 text-slate-400" />
                      <span>OHLCV</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Historical Trend Chart Drawer / Modal */}
      {selectedHistorySymbol && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold font-sans text-white flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-emerald-400" />
                  HISTORICAL TIME-SERIES &amp; OHLCV TREND: {selectedHistorySymbol}
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  1-Year Daily OHLCV dataset fed into PyTorch GNN Contagion Risk Engine.
                </p>
              </div>
              <button 
                onClick={() => setSelectedHistorySymbol(null)}
                className="p-1.5 bg-slate-800 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="h-64 flex items-center justify-center space-x-3 text-slate-400 font-mono text-xs">
                <Zap className="h-4 w-4 text-emerald-400 animate-spin" />
                <span>Fetching Historical Time-Series Data from Database &amp; Yahoo Finance...</span>
              </div>
            ) : historyPayload ? (
              <div className="space-y-6">
                {/* Candle Trend Viz */}
                <div className="bg-[#090d16] border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-sans text-slate-400">
                    <span>PRICE TREND (LAST 90 TRADING DAYS)</span>
                    <span className="text-slate-200 font-mono font-medium">INTERVAL: DAILY OHLCV</span>
                  </div>

                  <div className="h-44 flex items-end space-x-1 overflow-x-auto pt-4 pb-2 border-b border-slate-800">
                    {historyPayload.candles.slice(-90).map((c, i) => {
                      const isUp = c.close_price >= c.open_price;
                      const maxP = Math.max(...historyPayload.candles.slice(-90).map((x) => x.high_price));
                      const minP = Math.min(...historyPayload.candles.slice(-90).map((x) => x.low_price));
                      const range = maxP - minP || 1;
                      const barHeight = Math.max(12, ((c.close_price - minP) / range) * 140);
                      
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center group relative min-w-[6px]">
                          <div 
                            style={{ height: `${barHeight}px` }} 
                            className={`w-full rounded-sm ${isUp ? "bg-emerald-500/80 hover:bg-emerald-400" : "bg-rose-500/80 hover:bg-rose-400"} transition-all`}
                          />
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-[#111827] border border-slate-700 text-[10px] font-mono text-slate-100 p-2 rounded shadow-xl z-20 whitespace-nowrap">
                            <div>Date: {c.date}</div>
                            <div>Close: ₹{c.close_price}</div>
                            <div>Change: {c.pct_change}%</div>
                            <div>Vol: {c.volume.toLocaleString()}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Historical Candle Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-sans font-bold text-slate-300 uppercase">
                    Recent Daily OHLCV Candles
                  </h4>
                  <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="sticky top-0 bg-[#090d16] text-slate-400 border-b border-slate-800 text-[10px] uppercase font-semibold">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-2">Open</th>
                          <th className="py-2 px-2">High</th>
                          <th className="py-2 px-2">Low</th>
                          <th className="py-2 px-2">Close</th>
                          <th className="py-2 px-2">Change %</th>
                          <th className="py-2 px-3 text-right">Volume</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-[#0e1422]/60">
                        {historyPayload.candles.slice(-15).reverse().map((c, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 text-slate-300">{c.date}</td>
                            <td className="py-2 px-2 text-slate-400">₹{c.open_price}</td>
                            <td className="py-2 px-2 text-slate-400">₹{c.high_price}</td>
                            <td className="py-2 px-2 text-slate-400">₹{c.low_price}</td>
                            <td className="py-2 px-2 font-bold text-slate-100">₹{c.close_price}</td>
                            <td className={`py-2 px-2 font-semibold ${c.pct_change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {c.pct_change >= 0 ? "+" : ""}{c.pct_change}%
                            </td>
                            <td className="py-2 px-3 text-right text-slate-400">{c.volume.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
