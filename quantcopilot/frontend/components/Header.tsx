"use client";

import React, { useEffect, useState } from "react";
import { usePortfolioStore } from "../store/usePortfolioStore";
import { ShieldCheck, ShieldAlert, TrendingUp, TrendingDown, Clock, Activity, Zap, Search } from "lucide-react";
import { LiveTickPrice } from "./common/LiveTickPrice";
import { CommandPalette } from "./CommandPalette";

export const Header: React.FC = () => {
  const { portfolio, gnnRisk, connectionStatus, marketStatus, fetchMarketData, initLiveFeed } = usePortfolioStore();
  const [istTime, setIstTime] = useState<string>("");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live IST Clock Tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      };
      setIstTime(new Intl.DateTimeFormat("en-IN", options).format(now) + " IST");
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll real market quotes and market status every 10 seconds, and connect live WebSocket feed
  useEffect(() => {
    fetchMarketData();
    initLiveFeed();
    const pollInterval = setInterval(() => {
      fetchMarketData();
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [fetchMarketData, initLiveFeed]);

  const isPositiveDaily = portfolio.daily_pnl >= 0;
  const isMarketOpen = marketStatus ? marketStatus.is_market_open : false;
  const isPreOpen = marketStatus?.status === "PRE_OPEN";

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-14 bg-[#0a0e17]/95 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between text-slate-100 select-none shadow-sm transition-colors duration-200">
        {/* Left: Brand Identity & Live Session Module */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Brand Lockup */}
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs tracking-wider transition-transform duration-150 hover:scale-105">
              QC
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-sm font-bold tracking-tight text-white font-sans">
                QUANTCOPILOT
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-800/80 text-emerald-400 border border-slate-700/60 uppercase">
                AI DESK
              </span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Live Indian Stock Market Session Badge */}
          <div className="hidden sm:flex items-center space-x-2.5 bg-[#0e1422] border border-slate-800/90 rounded-md px-2.5 py-1 text-xs transition-all duration-200">
            <span className="relative flex h-2 w-2">
              {isMarketOpen ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </>
              ) : isPreOpen ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500" />
              )}
            </span>

            <span className="font-sans text-[11px] font-medium text-slate-300 transition-colors duration-200">
              {isMarketOpen
                ? "MARKET OPEN (09:15-15:30 IST)"
                : isPreOpen
                ? "PRE-OPEN SESSION"
                : "MARKET CLOSED (AMO)"}
            </span>

            <span className="text-slate-700">|</span>

            <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[11px] tabular-nums">
              <Clock className="h-3 w-3 text-slate-500" />
              <span>{istTime || "IST"}</span>
            </div>
          </div>

          {/* Quick Command Palette Button */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="hidden lg:flex items-center space-x-2 bg-[#0e1422] hover:bg-slate-800/80 border border-slate-800 px-2.5 py-1 rounded-md text-xs text-slate-400 hover:text-slate-200 transition-colors duration-150 active:translate-y-[0.5px]"
            title="Open Command Palette (Ctrl+K)"
          >
            <Search className="h-3 w-3 text-slate-400" />
            <span className="text-[11px] font-sans">Quick Search</span>
            <kbd className="px-1.5 py-0.2 text-[9px] font-mono text-slate-400 bg-slate-800 border border-slate-700/80 rounded">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Telemetry & Dynamic Portfolio Summary Bar */}
        <div className="flex items-center space-x-4 md:space-x-6 text-xs">
          {/* Dynamic Portfolio Value with Micro-Interaction */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-sans text-slate-400 uppercase tracking-wider font-medium">
              PORTFOLIO VALUE
            </span>
            <LiveTickPrice
              value={portfolio.total_equity}
              prefix="Rs "
              className="font-mono font-semibold text-xs md:text-sm text-slate-100 tabular-nums"
            />
          </div>

          <div className="h-6 w-[1px] bg-slate-800 hidden md:block" />

          {/* Dynamic Day P&L with Micro-Interaction */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-sans text-slate-400 uppercase tracking-wider font-medium">
              DAY P&amp;L
            </span>
            <div className="flex items-center space-x-1 font-mono text-xs font-semibold tabular-nums">
              {isPositiveDaily ? (
                <TrendingUp className="h-3 w-3 inline text-emerald-400 shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 inline text-rose-400 shrink-0" />
              )}
              <LiveTickPrice
                value={portfolio.daily_pnl_percentage}
                prefix={isPositiveDaily ? "+" : ""}
                suffix="%"
                colorize={true}
                className="font-mono text-xs font-semibold tabular-nums"
              />
              <span className="text-slate-400 text-[11px]">
                (Rs {Math.abs(portfolio.daily_pnl).toLocaleString("en-IN")})
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-800 hidden lg:block" />

          {/* Dynamic GNN Contagion Risk Score with Micro-Interaction */}
          <div className="hidden lg:flex items-center space-x-2 bg-[#0e1422] border border-slate-800 rounded-md px-2.5 py-1 transition-colors duration-200">
            {gnnRisk.overall_system_risk < 0.4 ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0 transition-colors duration-200" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0 transition-colors duration-200" />
            )}
            <div className="flex flex-col">
              <span className="text-[9px] font-sans text-slate-400 uppercase tracking-wider">
                SYSTEM RISK
              </span>
              <div className="flex items-center space-x-1">
                <LiveTickPrice
                  value={gnnRisk.overall_system_risk}
                  className="font-mono text-[11px] font-semibold text-slate-200 tabular-nums"
                />
                <span className="font-mono text-[10px] text-slate-500">Index</span>
              </div>
            </div>
          </div>

          {/* Feed & WebSocket Status Pill */}
          <div className="flex items-center space-x-1.5 bg-[#0e1422] border border-slate-800 rounded-md px-2.5 py-1 text-[11px] font-mono transition-all duration-200">
            <Zap
              className={`h-3 w-3 transition-colors duration-200 ${
                connectionStatus === "CONNECTED" ? "text-emerald-400 animate-status-pulse" : "text-amber-400"
              }`}
            />
            <span className="text-slate-300 hidden sm:inline transition-colors duration-200">
              {connectionStatus === "CONNECTED" ? "LIVE FEED" : connectionStatus}
            </span>
          </div>
        </div>
      </header>

      {/* Global Command Palette Dialog */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
};

