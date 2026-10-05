"use client";

import React from "react";
import { usePortfolioStore } from "../store/usePortfolioStore";
import { ActiveTab } from "../types";
import { 
  LayoutDashboard, 
  Network, 
  TrendingUp, 
  FlaskConical, 
  CandlestickChart, 
  Sparkles, 
  Settings,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: "emerald" | "cyan" | "slate";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = usePortfolioStore();

  const navSections: NavSection[] = [
    {
      title: "MARKETS & DESK",
      items: [
        { 
          id: "fno_terminal", 
          label: "F&O Trading Desk", 
          icon: <CandlestickChart className="h-4 w-4" /> 
        },
        { 
          id: "dashboard", 
          label: "Overview Dashboard", 
          icon: <LayoutDashboard className="h-4 w-4" /> 
        },
        { 
          id: "nse_market", 
          label: "Indian Market (NSE)", 
          icon: <TrendingUp className="h-4 w-4" /> 
        }
      ]
    },
    {
      title: "PORTFOLIO & SANDBOX",
      items: [
        { 
          id: "portfolio_lab", 
          label: "Live Portfolio Lab", 
          icon: <FlaskConical className="h-4 w-4" />,
          badge: "LIVE YF",
          badgeVariant: "cyan"
        }
      ]
    },
    {
      title: "QUANT INTELLIGENCE",
      items: [
        { 
          id: "ai_audit", 
          label: "AI Stock & Index Audit", 
          icon: <Sparkles className="h-4 w-4" />,
          badge: "PREDICT",
          badgeVariant: "cyan"
        },
        { 
          id: "gnn_risk", 
          label: "GNN Risk Engine", 
          icon: <Network className="h-4 w-4" /> 
        }
      ]
    },
    {
      title: "RESEARCH",
      items: [
        { 
          id: "strategy", 
          label: "Strategy Lab", 
          icon: <FlaskConical className="h-4 w-4" /> 
        }
      ]
    }
  ];

  return (
    <aside className="w-60 h-[calc(100vh-3.5rem)] bg-[#090d16] border-r border-slate-800/80 p-3 flex flex-col justify-between select-none overflow-y-auto">
      <div className="space-y-5">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider">
              {section.title}
            </div>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`relative w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-sans font-medium transition-all duration-150 active:scale-[0.99] ${
                        isActive
                          ? "bg-[#131b2a] text-white shadow-sm font-semibold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-[#0e1422]"
                      }`}
                    >
                      {/* Smooth Left Active Accent Hairline */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-emerald-500 rounded-r transition-all duration-200" />
                      )}

                      <div className="flex items-center space-x-2.5">
                        <span className={`transition-colors duration-150 ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-tight uppercase transition-colors duration-150 ${
                            item.badgeVariant === "cyan"
                              ? "bg-cyan-950/80 text-cyan-300 border border-cyan-800/60"
                              : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom Settings Button & Institutional System Bar */}
        <div className="border-t border-slate-800/80 pt-3 space-y-1.5">
          <button
            onClick={() => setActiveTab("settings")}
            className={`relative w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-sans font-medium transition-all duration-150 active:scale-[0.99] ${
              activeTab === "settings"
                ? "bg-[#131b2a] text-white shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#0e1422]"
            }`}
          >
            {activeTab === "settings" && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-emerald-500 rounded-r transition-all duration-200" />
            )}
            <div className="flex items-center space-x-2.5">
              <Settings className={`h-4 w-4 transition-colors duration-150 ${activeTab === "settings" ? "text-emerald-400" : "text-slate-500"}`} />
              <span>Workstation Settings</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">v1.2</span>
          </button>

          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500/80" /> GNN ACTIVE
            </span>
            <span className="text-slate-600">PROD-GRADE</span>
          </div>
        </div>
      </aside>
    );
  };
