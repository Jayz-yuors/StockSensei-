"use client";

import React, { useEffect, useState } from "react";
import { usePortfolioStore } from "../store/usePortfolioStore";
import { ShieldCheck, ShieldAlert, Clock, Search, User, RefreshCw } from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { CustomerLoginModal } from "./CustomerLoginModal";

export const Header: React.FC = () => {
  const { 
    gnnRisk, 
    connectionStatus, 
    marketStatus, 
    fetchMarketData, 
    initLiveFeed,
    hydrateFromStorage,
    fetchSavedPositionsFromBackend,
    fetchGnnRiskMetrics,
    currentCustomer,
    setIsCustomerLoginModalOpen,
    refreshCustomerPortfolioLive,
    isLiveSyncing
  } = usePortfolioStore();
  const [istTime, setIstTime] = useState<string>("");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Client hydration from localStorage, backend sync & daily GNN index fetch
  useEffect(() => {
    hydrateFromStorage();
    fetchSavedPositionsFromBackend();
    fetchGnnRiskMetrics();
  }, [hydrateFromStorage, fetchSavedPositionsFromBackend, fetchGnnRiskMetrics]);

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

  const isMarketOpen = marketStatus ? marketStatus.is_market_open : false;
  const isPreOpen = marketStatus?.status === "PRE_OPEN";

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-14 bg-[#0C100F] border-b border-white/[0.065] px-4 md:px-6 flex items-center justify-between text-[#F2F0E8] select-none transition-colors duration-200">
        {/* Left: Brand Identity & Live Session Module */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Brand Lockup - Institutional Luxury */}
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-md bg-[#111614] border border-white/[0.08] flex items-center justify-center font-bold text-xs tracking-wider transition-colors duration-150">
              <span className="text-[#159570]">Q</span>
              <span className="text-[#C8A96B]">C</span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-sm font-semibold tracking-tight text-[#F2F0E8] font-sans">
                QUANTCOPILOT
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#111614] text-[#C8A96B] border border-white/[0.065] uppercase">
                AI
              </span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-white/[0.065] hidden sm:block" />

          {/* Live Indian Stock Market Session Badge - Restrained Institutional */}
          <div className="hidden sm:flex items-center space-x-2.5 bg-[#111614] border border-white/[0.065] rounded-md px-2.5 py-1 text-xs transition-all duration-200">
            <span className="flex h-1.5 w-1.5 relative">
              {isMarketOpen ? (
                <span className="inline-flex rounded-full h-1.5 w-1.5 bg-[#159570]" />
              ) : isPreOpen ? (
                <span className="inline-flex rounded-full h-1.5 w-1.5 bg-[#B89655]" />
              ) : (
                <span className="inline-flex rounded-full h-1.5 w-1.5 bg-[#68716C]" />
              )}
            </span>

            <span className="font-sans text-[11px] font-medium text-[#A7ADA8] tracking-wide">
              {isMarketOpen
                ? "NSE ● MARKET OPEN"
                : isPreOpen
                ? "NSE ● PRE-OPEN"
                : "NSE ● MARKET CLOSED"}
            </span>

            <span className="text-[#68716C]/60">|</span>

            <div className="flex items-center space-x-1.5 text-[#68716C] font-mono text-[11px] tabular-nums">
              <Clock className="h-3 w-3 text-[#68716C]" />
              <span className="text-[#A7ADA8]">{istTime || "IST"}</span>
            </div>
          </div>

          {/* Quick Command Palette Button */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="hidden lg:flex items-center space-x-2 bg-[#111614] hover:bg-[#161C19] border border-white/[0.065] px-2.5 py-1 rounded-md text-xs text-[#A7ADA8] hover:text-[#F2F0E8] transition-colors duration-150 active:translate-y-[0.5px]"
            title="Open Command Palette (Ctrl+K)"
          >
            <Search className="h-3 w-3 text-[#68716C]" />
            <span className="text-[11px] font-sans">Search</span>
            <kbd className="px-1.5 py-0.2 text-[9px] font-mono text-[#A7ADA8] bg-[#161C19] border border-white/[0.065] rounded">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Telemetry & Daily GNN Contagion Risk System */}
        <div className="flex items-center space-x-2.5 md:space-x-3 text-xs">
          
          {/* Customer Portfolio Account Selector / Login Trigger */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setIsCustomerLoginModalOpen(true)}
              className="flex items-center space-x-2 bg-[#111614] hover:bg-[#161C19] border border-white/[0.08] hover:border-[#159570]/50 rounded-md px-2.5 py-1 text-xs transition-all duration-150 active:translate-y-[0.5px]"
              title="Customer Account & Portfolio Settings (Custom Database & Live Yahoo Finance Sync)"
            >
              <div className="h-5 w-5 rounded-full bg-[#159570]/20 border border-[#159570]/40 flex items-center justify-center text-[10px] font-bold text-[#159570]">
                {currentCustomer ? currentCustomer.name.charAt(0) : <User className="h-3 w-3" />}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-[11px] text-[#F2F0E8] leading-tight flex items-center gap-1">
                  <span className="truncate max-w-[100px] sm:max-w-[130px]">{currentCustomer ? currentCustomer.name : "Sign In / Switch"}</span>
                  {currentCustomer && (
                    <span className="text-[8px] font-mono px-1 py-0.1 rounded bg-[#161C19] text-[#C8A96B] border border-white/[0.065]">
                      {currentCustomer.account_tier === "PRO_QUANT" ? "PRO" : currentCustomer.account_tier.split("_")[0]}
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-mono text-[#A7ADA8] flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#159570] animate-pulse"></span>
                  <span>YF LIVE SYNC</span>
                </span>
              </div>
            </button>

            {currentCustomer && (
              <button
                onClick={() => refreshCustomerPortfolioLive()}
                disabled={isLiveSyncing}
                className="p-1.5 bg-[#111614] hover:bg-[#161C19] border border-white/[0.065] text-[#A7ADA8] hover:text-[#159570] rounded-md transition-colors"
                title="Fetch latest live market quotes from Yahoo Finance"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLiveSyncing ? "animate-spin text-[#159570]" : ""}`} />
              </button>
            )}
          </div>

          <div className="h-4 w-[1px] bg-white/[0.065] hidden md:block" />

          {/* Dynamic Daily GNN Systemic Risk Index */}
          <div 
            className="hidden md:flex items-center space-x-2.5 bg-[#111614] border border-white/[0.065] rounded-md px-3 py-1.5 transition-colors duration-200"
            title={`GNN Systemic Contagion Risk Index computed dynamically on a daily basis from stock price returns (Last updated: ${gnnRisk.daily_date || 'Daily'})`}
          >
            {gnnRisk.overall_system_risk < 0.35 ? (
              <ShieldCheck className="h-4 w-4 text-[#159570] shrink-0 transition-colors duration-200" />
            ) : gnnRisk.overall_system_risk < 0.55 ? (
              <ShieldAlert className="h-4 w-4 text-[#B89655] shrink-0 transition-colors duration-200" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-[#C45D62] shrink-0 transition-colors duration-200" />
            )}
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-sans text-[#68716C] uppercase tracking-wider font-semibold">
                  GNN SYSTEM RISK
                </span>
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-white/[0.04] text-[#A7ADA8] border border-white/[0.04]">
                  {gnnRisk.daily_date ? `DAILY (${gnnRisk.daily_date})` : "DAILY EOD"}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono text-xs font-semibold text-[#F2F0E8] tabular-nums" suppressHydrationWarning>
                  {Number(gnnRisk.overall_system_risk || 0).toFixed(2)}
                </span>
                <span className="font-mono text-[10px] text-[#A7ADA8]">Idx</span>
                <span className={`text-[9px] font-sans font-medium px-1.5 py-0.2 rounded ${
                  gnnRisk.overall_system_risk < 0.35 
                    ? "bg-[#159570]/15 text-[#42A77A] border border-[#159570]/30" 
                    : gnnRisk.overall_system_risk < 0.55 
                    ? "bg-[#B89655]/15 text-[#B89655] border border-[#B89655]/30" 
                    : "bg-[#C45D62]/15 text-[#C45D62] border border-[#C45D62]/30"
                }`}>
                  {gnnRisk.contagion_status || (gnnRisk.overall_system_risk < 0.35 ? "LOW" : gnnRisk.overall_system_risk < 0.55 ? "MODERATE" : "HIGH")}
                </span>
              </div>
            </div>
          </div>

          {/* Feed & WebSocket Status Pill */}
          <div className="flex items-center space-x-1.5 bg-[#111614] border border-white/[0.065] rounded-md px-2.5 py-1.5 text-[11px] font-mono transition-all duration-200">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connectionStatus === "CONNECTED" ? "bg-[#159570]" : "bg-[#B89655]"
              }`}
            />
            <span className="text-[#A7ADA8] hidden sm:inline transition-colors duration-200">
              {connectionStatus === "CONNECTED" ? "LIVE FEED" : connectionStatus}
            </span>
          </div>
        </div>
      </header>

      {/* Global Command Palette Dialog */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />

      {/* Customer Portfolio Login & Account Switcher Modal */}
      <CustomerLoginModal />
    </>
  );
};
