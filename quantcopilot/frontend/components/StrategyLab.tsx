"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  DRLAgentSignal, 
  DRLBacktestResult, 
  DeepForecastData, 
  DRLActionType,
  DRLTradeLog
} from "../types/strategy";
import { usePortfolioStore } from "../store/usePortfolioStore";
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  ShieldAlert, 
  Sliders, 
  RefreshCw, 
  Layers, 
  Award, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Crosshair,
  Cpu,
  BrainCircuit,
  Eye,
  CheckCircle2,
  Send,
  Timer,
  Clock,
  Target,
  ShieldCheck,
  Compass,
  ExternalLink
} from "lucide-react";
import { getApiBaseUrl } from "../lib/api";

const SUPPORTED_TICKERS = [
  { symbol: "NIFTY 50", name: "Nifty 50 Index", type: "INDEX" },
  { symbol: "BANKNIFTY", name: "Bank Nifty Index", type: "INDEX" },
  { symbol: "RELIANCE", name: "Reliance Industries", type: "EQUITY" },
  { symbol: "TCS", name: "Tata Consultancy Services", type: "EQUITY" },
  { symbol: "HDFCBANK", name: "HDFC Bank", type: "EQUITY" },
  { symbol: "INFY", name: "Infosys Ltd", type: "EQUITY" },
  { symbol: "ICICIBANK", name: "ICICI Bank", type: "EQUITY" },
  { symbol: "TATAMOTORS", name: "Tata Motors", type: "EQUITY" },
  { symbol: "SBIN", name: "State Bank of India", type: "EQUITY" },
  { symbol: "TATASTEEL", name: "Tata Steel", type: "EQUITY" }
];

export const StrategyLab: React.FC = () => {
  const { addPosition, setActiveTab: setRootActiveTab } = usePortfolioStore();
  const [selectedSymbol, setSelectedSymbol] = useState<string>("RELIANCE");
  const [activeSubTab, setActiveSubTab] = useState<"DRL_AGENT" | "DEEP_FORECASTER">("DRL_AGENT");
  
  // Backtest parameters
  const [capital, setCapital] = useState<number>(100000);
  const [leverage, setLeverage] = useState<number>(1.0);
  const [riskProfile, setRiskProfile] = useState<"CONSERVATIVE" | "BALANCED" | "AGGRESSIVE">("BALANCED");
  
  // Data states
  const [drlSignal, setDrlSignal] = useState<DRLAgentSignal | null>(null);
  const [backtestData, setBacktestData] = useState<DRLBacktestResult | null>(null);
  const [forecastData, setForecastData] = useState<DeepForecastData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hoveredForecastIndex, setHoveredForecastIndex] = useState<number | null>(null);
  const [deploymentNotification, setDeploymentNotification] = useState<{
    message: string;
    qty: number;
    symbol: string;
    side: "LONG" | "SHORT";
    price: number;
  } | null>(null);

  // Fetch live signals and backtests
  const fetchStrategyData = async (symbol: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch DRL Live Signal
      const sigRes = await fetch(`${getApiBaseUrl()}/api/v1/strategy/drl-agent/${encodeURIComponent(symbol)}`);
      if (sigRes.ok) {
        const sigJson = await sigRes.json();
        setDrlSignal(sigJson);
      }

      // 2. Fetch DRL Backtest Simulation
      const btRes = await fetch(`${getApiBaseUrl()}/api/v1/strategy/drl-backtest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          initialCapital: capital,
          leverage,
          riskProfile
        })
      });
      if (btRes.ok) {
        const btJson = await btRes.json();
        setBacktestData(btJson);
      }

      // 3. Fetch Deep Forecaster
      const fcRes = await fetch(`${getApiBaseUrl()}/api/v1/strategy/deep-forecast/${encodeURIComponent(symbol)}?horizon=20`);

      if (fcRes.ok) {
        const fcJson = await fcRes.json();
        setForecastData(fcJson);
      }
    } catch (e) {
      console.error("Error fetching Strategy Lab data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategyData(selectedSymbol);
  }, [selectedSymbol]);

  const handleRunBacktest = () => {
    fetchStrategyData(selectedSymbol);
  };

  const handleDeploySignal = () => {
    if (!drlSignal) return;
    const side: "LONG" | "SHORT" = drlSignal.recommendedAction === "SHORT" ? "SHORT" : "LONG";
    const qty = drlSignal.recommendedQuantity || Math.max(1, Math.floor(capital / Math.max(1, drlSignal.currentPrice)));
    
    addPosition({
      symbol: drlSignal.symbol,
      quantity: qty,
      entry_price: drlSignal.currentPrice,
      side: side,
      leverage: leverage || 1.0,
    });

    setDeploymentNotification({
      message: `Position executed! Deployed ${qty} units of ${drlSignal.symbol} (${side}) into active portfolio.`,
      qty,
      symbol: drlSignal.symbol,
      side,
      price: drlSignal.currentPrice,
    });

    setTimeout(() => {
      setDeploymentNotification(null);
    }, 7000);
  };

  const getActionColor = (action?: DRLActionType) => {
    switch (action) {
      case "LONG": return "text-emerald-400 bg-emerald-950/70 border-emerald-700/60";
      case "SHORT": return "text-rose-400 bg-rose-950/70 border-rose-700/60";
      case "HEDGE": return "text-amber-400 bg-amber-950/70 border-amber-700/60";
      case "HOLD": return "text-slate-300 bg-[#0c140e] border-emerald-950";
      default: return "text-emerald-400 bg-emerald-950/70 border-emerald-700/60";
    }
  };

  // SVG Chart Dimensions for Equity Curve
  const chartWidth = 760;
  const chartHeight = 240;
  const padding = { top: 20, right: 30, bottom: 30, left: 60 };

  const equityPoints = backtestData?.equityCurve || [];
  
  const { minVal, maxVal, pathAgent, pathBench } = useMemo(() => {
    if (equityPoints.length < 2) return { minVal: 0, maxVal: 1, pathAgent: "", pathBench: "" };
    
    const allVals = equityPoints.flatMap(p => [p.agentEquity, p.benchmarkEquity]);
    const min = Math.min(...allVals) * 0.98;
    const max = Math.max(...allVals) * 1.02;
    const range = max - min || 1;

    const getX = (idx: number) => padding.left + (idx / (equityPoints.length - 1)) * (chartWidth - padding.left - padding.right);
    const getY = (val: number) => chartHeight - padding.bottom - ((val - min) / range) * (chartHeight - padding.top - padding.bottom);

    const agentCoords = equityPoints.map((p, i) => `${getX(i)},${getY(p.agentEquity)}`).join(" L ");
    const benchCoords = equityPoints.map((p, i) => `${getX(i)},${getY(p.benchmarkEquity)}`).join(" L ");

    return {
      minVal: min,
      maxVal: max,
      pathAgent: `M ${agentCoords}`,
      pathBench: `M ${benchCoords}`
    };
  }, [equityPoints]);

  // Quantile Fan Chart Calculations (Temporal Attention)
  const fanWidth = 760;
  const fanHeight = 260;
  const fanPadding = { top: 25, right: 35, bottom: 30, left: 65 };
  const trajectory = forecastData?.trajectory || [];

  const {
    minFanVal,
    maxFanVal,
    pathMedian,
    pathBullish,
    pathBearish,
    polygon95,
    polygon80,
    fanPoints
  } = useMemo(() => {
    if (!trajectory || trajectory.length < 2) {
      return {
        minFanVal: 0,
        maxFanVal: 1,
        pathMedian: "",
        pathBullish: "",
        pathBearish: "",
        polygon95: "",
        polygon80: "",
        fanPoints: []
      };
    }

    const allVals = trajectory.flatMap(p => [
      p.lowerConfidence95,
      p.upperConfidence95,
      p.basePrice,
      p.bullishPrice || p.upperConfidence80,
      p.bearishPrice || p.lowerConfidence80
    ]);
    const min = Math.min(...allVals) * 0.992;
    const max = Math.max(...allVals) * 1.008;
    const range = max - min || 1;

    const getX = (idx: number) => fanPadding.left + (idx / (trajectory.length - 1)) * (fanWidth - fanPadding.left - fanPadding.right);
    const getY = (val: number) => fanHeight - fanPadding.bottom - ((val - min) / range) * (fanHeight - fanPadding.top - fanPadding.bottom);

    const pts95Upper = trajectory.map((p, i) => `${getX(i)},${getY(p.upperConfidence95)}`);
    const pts95Lower = [...trajectory].reverse().map((p, i) => `${getX(trajectory.length - 1 - i)},${getY(p.lowerConfidence95)}`);
    const poly95 = `${pts95Upper.join(" ")} ${pts95Lower.join(" ")}`;

    const pts80Upper = trajectory.map((p, i) => `${getX(i)},${getY(p.upperConfidence80)}`);
    const pts80Lower = [...trajectory].reverse().map((p, i) => `${getX(trajectory.length - 1 - i)},${getY(p.lowerConfidence80)}`);
    const poly80 = `${pts80Upper.join(" ")} ${pts80Lower.join(" ")}`;

    const medianCoords = trajectory.map((p, i) => `${getX(i)},${getY(p.basePrice)}`).join(" L ");
    const bullishCoords = trajectory.map((p, i) => `${getX(i)},${getY(p.bullishPrice || p.upperConfidence80)}`).join(" L ");
    const bearishCoords = trajectory.map((p, i) => `${getX(i)},${getY(p.bearishPrice || p.lowerConfidence80)}`).join(" L ");

    const points = trajectory.map((p, i) => ({
      x: getX(i),
      y: getY(p.basePrice),
      data: p
    }));

    return {
      minFanVal: min,
      maxFanVal: max,
      pathMedian: `M ${medianCoords}`,
      pathBullish: `M ${bullishCoords}`,
      pathBearish: `M ${bearishCoords}`,
      polygon95: poly95,
      polygon80: poly80,
      fanPoints: points
    };
  }, [trajectory]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-100">
      {/* Top Header Strip */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#0e1422] border border-slate-800 rounded-lg text-emerald-400">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold font-sans tracking-wide text-white uppercase">
                STRATEGY LAB &amp; DEEP LEARNING STUDIO
              </h2>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-slate-700">
                PyTorch Neural Core
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Deep Reinforcement Learning (Actor-Critic) policy execution &amp; Multi-Horizon Attention Forecaster.
            </p>
          </div>
        </div>

        {/* Controls: Ticker Selector & SubTab switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#080b11] border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setActiveSubTab("DRL_AGENT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans font-semibold transition-all duration-150 active:scale-95 ${
                activeSubTab === "DRL_AGENT"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              DRL Policy Agent
            </button>
            <button
              onClick={() => setActiveSubTab("DEEP_FORECASTER")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans font-semibold transition-all duration-150 active:scale-95 ${
                activeSubTab === "DEEP_FORECASTER"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Temporal Attention
            </button>
          </div>

          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-[#080b11] border border-slate-800 text-slate-100 text-xs font-mono font-medium rounded-lg px-3 py-1.5 outline-none focus:border-slate-600 transition-colors"
          >
            {SUPPORTED_TICKERS.map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol} ({t.name})
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchStrategyData(selectedSymbol)}
            disabled={isLoading}
            className="flex items-center gap-1 bg-[#0e1422] hover:bg-slate-800 text-slate-200 text-xs font-sans font-semibold px-3 py-1.5 rounded-lg border border-slate-700/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notification Toast for Position Deployment */}
      {deploymentNotification && (
        <div className="flex items-center justify-between bg-[#0b0f17] border border-slate-700 rounded-xl px-5 py-3.5 shadow-xl text-xs font-sans animate-in fade-in duration-300">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-white uppercase tracking-wide">
                Live Order Dispatched:
              </span>{" "}
              <span className="text-slate-300">{deploymentNotification.message}</span>
            </div>
          </div>
          <button
            onClick={() => setRootActiveTab("dashboard")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1422] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-md text-xs font-semibold transition-colors ml-4"
          >
            <span>View In Portfolio</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div key={activeSubTab} className="animate-fade-in-up">
        {activeSubTab === "DRL_AGENT" ? (
          <div className="space-y-6">

          {/* Top Row: Real-Time DRL Agent Signal Card + Action Probability Matrix + Feature Drivers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-Time Neural Signal Badge Card with Target & Live Deployment */}
            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-sans font-bold text-slate-200 uppercase tracking-wider">
                    LIVE DRL AGENT DECISION
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {selectedSymbol} @ ₹{drlSignal?.currentPrice?.toLocaleString("en-IN") || "0.00"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-sans text-slate-400 uppercase tracking-wider mb-1">Recommended Action</div>
                  <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-bold font-mono border shadow-sm ${getActionColor(drlSignal?.recommendedAction)}`}>
                    {drlSignal?.recommendedAction === "LONG" && <TrendingUp className="h-4 w-4 text-emerald-400" />}
                    {drlSignal?.recommendedAction === "SHORT" && <TrendingDown className="h-4 w-4 text-rose-400" />}
                    {drlSignal?.recommendedAction === "HEDGE" && <ShieldAlert className="h-4 w-4 text-amber-400" />}
                    {drlSignal?.recommendedAction === "HOLD" && <Activity className="h-4 w-4 text-slate-400" />}
                    {drlSignal?.recommendedAction || "EVALUATING..."}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[10px] font-sans text-slate-400 uppercase tracking-wider mb-1">Action Confidence</div>
                  <div className="text-2xl font-bold text-emerald-400 tabular-nums">
                    {drlSignal?.confidencePct || 0}%
                  </div>
                  <div className="text-[10px] text-slate-500 tabular-nums">
                    Entropy: {drlSignal?.policyEntropy || 0.5}
                  </div>
                </div>
              </div>

              {/* Execution Targets & Suggested Bounds */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#080b11] border border-slate-800 rounded-lg p-3">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1 font-sans font-semibold">
                    <Target className="h-3 w-3 text-emerald-400" />
                    Suggested Target
                  </div>
                  <div className="font-bold text-emerald-400 mt-0.5 tabular-nums">
                    ₹{drlSignal?.suggestedTarget?.toLocaleString("en-IN") || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1 font-sans font-semibold">
                    <ShieldCheck className="h-3 w-3 text-rose-400" />
                    Stop Loss
                  </div>
                  <div className="font-bold text-rose-400 mt-0.5 tabular-nums">
                    ₹{drlSignal?.suggestedStopLoss?.toLocaleString("en-IN") || "—"}
                  </div>
                </div>
              </div>

              {/* Direct Deployment Button */}
              <button
                onClick={handleDeploySignal}
                disabled={!drlSignal || drlSignal.recommendedAction === "HOLD"}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold font-sans uppercase tracking-wider py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Deploy Signal to Portfolio ({drlSignal?.recommendedQuantity || 1} Qty)</span>
              </button>
            </div>

            {/* Action Distribution Probabilities */}
            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-sans font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  POLICY ACTION PROBABILITIES
                </span>
                <span className="text-[10px] font-mono text-slate-500">Softmax Output</span>
              </div>

              <div className="space-y-2.5 pt-1">
                {(drlSignal?.actionDistribution || [
                  { action: "LONG", probability: 0.68, probPct: 68.0, qValue: 1.42 },
                  { action: "HEDGE", probability: 0.16, probPct: 16.0, qValue: 0.58 },
                  { action: "HOLD", probability: 0.11, probPct: 11.0, qValue: 0.12 },
                  { action: "SHORT", probability: 0.05, probPct: 5.0, qValue: -0.84 }
                ]).map((item) => (
                  <div key={item.action} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className={`font-semibold ${
                        item.action === "LONG" ? "text-emerald-400" :
                        item.action === "SHORT" ? "text-rose-400" :
                        item.action === "HEDGE" ? "text-amber-400" : "text-slate-300"
                      }`}>
                        {item.action}
                      </span>
                      <div className="space-x-2 text-slate-400 tabular-nums">
                        <span>Q: {item.qValue > 0 ? `+${item.qValue}` : item.qValue}</span>
                        <span className="font-bold text-white">{item.probPct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.action === "LONG" ? "bg-emerald-500" :
                          item.action === "SHORT" ? "bg-rose-500" :
                          item.action === "HEDGE" ? "bg-amber-500" : "bg-slate-600"
                        }`}
                        style={{ width: `${item.probPct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Neural Feature Drivers */}
            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-sans font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-emerald-400" />
                  TOP NEURAL SIGNAL DRIVERS
                </span>
                <span className="text-[10px] font-mono text-slate-500">Feature Importance</span>
              </div>

              <div className="space-y-2 pt-1 font-sans">
                {(drlSignal?.topSignalDrivers || [
                  { feature: "Normalized Return Momentum", importancePct: 26.5 },
                  { feature: "RSI Divergence Vector (14)", importancePct: 22.1 },
                  { feature: "Order Book Imbalance (5-Level)", importancePct: 18.4 },
                  { feature: "GNN Contagion Spillover Risk", importancePct: 16.8 },
                  { feature: "Volatility Regime Z-Score", importancePct: 16.2 }
                ]).map((feat, idx) => (
                  <div key={feat.feature} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                    <span className="text-slate-300 truncate max-w-[160px]">
                      {idx + 1}. {feat.feature}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${feat.importancePct}%` }} />
                      </div>
                      <span className="font-bold font-mono text-slate-200 w-10 text-right tabular-nums">{feat.importancePct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Institutional Performance Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-3.5 space-y-1 shadow-sm font-mono tabular-nums">
              <div className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">Sharpe Ratio</div>
              <div className="text-lg font-bold text-white">
                {backtestData?.sharpeRatio || 2.18}
              </div>
              <div className="text-[9px] text-slate-500">Benchmark: 1.12</div>
            </div>

            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-3.5 space-y-1 shadow-sm font-mono tabular-nums">
              <div className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">Alpha vs Index</div>
              <div className="text-lg font-bold text-emerald-400">
                +{backtestData?.alphaPct || 13.3}%
              </div>
              <div className="text-[9px] text-slate-500">Excess Return</div>
            </div>

            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-3.5 space-y-1 shadow-sm font-mono tabular-nums">
              <div className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">Max Drawdown</div>
              <div className="text-lg font-bold text-rose-400">
                {backtestData?.maxDrawdownPct || -6.4}%
              </div>
              <div className="text-[9px] text-slate-500">Bench: {backtestData?.benchmarkMaxDrawdownPct || -14.2}%</div>
            </div>

            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-3.5 space-y-1 shadow-sm font-mono tabular-nums">
              <div className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">Win Rate</div>
              <div className="text-lg font-bold text-white">
                {backtestData?.winRatePct || 65.5}%
              </div>
              <div className="text-[9px] text-slate-500">Trades: {backtestData?.totalTrades || 38}</div>
            </div>

            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-3.5 space-y-1 shadow-sm font-mono tabular-nums">
              <div className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">Profit Factor</div>
              <div className="text-lg font-bold text-white">
                {backtestData?.profitFactor || 2.34}x
              </div>
              <div className="text-[9px] text-slate-500">Sortino: {backtestData?.sortinoRatio || 2.85}</div>
            </div>

            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-3.5 space-y-1 shadow-sm font-mono tabular-nums">
              <div className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">Agent Return</div>
              <div className="text-lg font-bold text-emerald-400">
                +{backtestData?.agentReturnPct || 24.5}%
              </div>
              <div className="text-[9px] text-slate-500">₹{backtestData?.finalAgentEquity?.toLocaleString("en-IN") || "124,500"}</div>
            </div>
          </div>

          {/* Interactive Equity Curve & Backtesting Simulation */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chart Area (3 cols) */}
            <div className="lg:col-span-3 bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-sans font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    CUMULATIVE EQUITY: DRL NEURAL AGENT VS BUY &amp; HOLD
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs font-mono tabular-nums">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                    <span className="text-emerald-400 font-semibold">DRL Agent (+{backtestData?.agentReturnPct || 24.5}%)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-0.5 bg-slate-500" />
                    <span className="text-slate-400">Buy &amp; Hold (+{backtestData?.benchmarkReturnPct || 11.2}%)</span>
                  </div>
                </div>
              </div>

              {/* SVG Equity Curve Chart */}
              <div className="relative w-full overflow-hidden bg-[#080b11] p-2 rounded-xl border border-slate-800">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-auto text-slate-400 select-none"
                >
                  {/* Grid Lines */}
                  {[0.25, 0.5, 0.75].map((pct, idx) => {
                    const y = padding.top + pct * (chartHeight - padding.top - padding.bottom);
                    const val = maxVal - pct * (maxVal - minVal);
                    return (
                      <g key={idx}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={chartWidth - padding.right}
                          y2={y}
                          stroke="#1e293b"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 3}
                          fontSize="9"
                          fontFamily="monospace"
                          fill="#94a3b8"
                          opacity="0.8"
                          textAnchor="end"
                        >
                          ₹{Math.round(val).toLocaleString("en-IN")}
                        </text>
                      </g>
                    );
                  })}

                  {/* Benchmark Line */}
                  <path
                    d={pathBench}
                    fill="none"
                    stroke="#475569"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />

                  {/* DRL Agent Line */}
                  <path
                    d={pathAgent}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Highlight Nodes */}
                  {equityPoints.length > 0 && (
                    <circle
                      cx={chartWidth - padding.right}
                      cy={chartHeight - padding.bottom - ((equityPoints[equityPoints.length - 1].agentEquity - minVal) / (maxVal - minVal || 1)) * (chartHeight - padding.top - padding.bottom)}
                      r="4"
                      fill="#10b981"
                      stroke="#022c22"
                      strokeWidth="2"
                    />
                  )}
                </svg>
              </div>
            </div>

            {/* Backtesting Parameter Controls (1 col) */}
            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                <Sliders className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-sans font-bold text-slate-200 uppercase tracking-wider">
                  SIMULATION PARAMETERS
                </span>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400 font-sans">
                    <span>Initial Capital:</span>
                    <span className="font-bold text-white font-mono tabular-nums">₹{capital.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min="25000"
                    max="1000000"
                    step="25000"
                    value={capital}
                    onChange={(e) => setCapital(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-800 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400 font-sans">
                    <span>Leverage:</span>
                    <span className="font-bold text-white font-mono">{leverage}x</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1.0, 2.0, 3.0, 5.0].map((l) => (
                      <button
                        key={l}
                        onClick={() => setLeverage(l)}
                        className={`py-1.5 text-center rounded-lg border font-bold transition-colors ${
                          leverage === l
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-[#080b11] text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {l}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-slate-400 font-sans">Risk Profile / Policy:</div>
                  <div className="space-y-1 font-sans">
                    {(["CONSERVATIVE", "BALANCED", "AGGRESSIVE"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setRiskProfile(mode)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                          riskProfile === mode
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : "bg-[#080b11] text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRunBacktest}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-sans text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  <span>{isLoading ? "Simulating Agent..." : "Run Neural Backtest"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Algorithmic Simulated Execution Trade Log */}
          <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-sans font-bold text-slate-200 uppercase tracking-wider">
                  ALGORITHMIC SIMULATED TRADE EXECUTION LOG
                </span>
                <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {backtestData?.executionLatencyMs ? `${backtestData.executionLatencyMs.toFixed(2)} ms latency` : "< 3.5 ms"}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Executed Trades: <span className="font-bold text-white">{backtestData?.simulatedTrades?.length || 0}</span> | Win Rate: <span className="font-bold text-emerald-400">{backtestData?.winRatePct || 65.5}%</span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg bg-[#0e1422]/40">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#090d16] text-slate-400 border-b border-slate-800 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Trade ID</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entry Step / Price</th>
                    <th className="py-2.5 px-3">Exit Step / Price</th>
                    <th className="py-2.5 px-3">Return (%)</th>
                    <th className="py-2.5 px-3">Simulated P&amp;L</th>
                    <th className="py-2.5 px-3 text-right">Execution Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                  {(backtestData?.simulatedTrades && backtestData.simulatedTrades.length > 0) ? (
                    backtestData.simulatedTrades.map((t) => {
                      const isProfitable = t.pnl >= 0;
                      return (
                        <tr key={t.tradeId} className="hover:bg-[#121929] transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white">#{t.tradeId}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.action === "LONG" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                              t.action === "SHORT" ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" :
                              "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            }`}>
                              {t.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-200">
                            <span className="text-slate-500 mr-1.5 font-normal">t+{t.entryStep}</span>
                            ₹{t.entryPrice.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-slate-200">
                            <span className="text-slate-500 mr-1.5 font-normal">t+{t.exitStep}</span>
                            ₹{t.exitPrice.toLocaleString("en-IN")}
                          </td>
                          <td className={`py-2.5 px-3 font-bold flex items-center gap-1 ${isProfitable ? "text-emerald-400" : "text-rose-400"}`}>
                            {isProfitable ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                            {t.returnPct > 0 ? `+${t.returnPct.toFixed(2)}` : t.returnPct.toFixed(2)}%
                          </td>
                          <td className={`py-2.5 px-3 font-bold ${isProfitable ? "text-emerald-400" : "text-rose-400"}`}>
                            {isProfitable ? `+₹${Math.round(t.pnl).toLocaleString("en-IN")}` : `-₹${Math.round(Math.abs(t.pnl)).toLocaleString("en-IN")}`}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              t.status === "CLOSED" ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-emerald-950 text-emerald-300 border border-emerald-600 animate-pulse"
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-500 font-sans">
                        No simulated trade logs available for this symbol. Run backtest to populate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Temporal Attention Forecaster View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Forecast Summary Card */}
            <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-sans font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  QUANTILE HORIZON SUMMARY
                </span>
                <span className="text-[10px] font-mono text-slate-500">t+1 to t+20</span>
              </div>

              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-sans">Dominant Trend:</span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    forecastData?.dominantTrend === "BULLISH" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                    forecastData?.dominantTrend === "BEARISH" ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" :
                    "bg-slate-800 text-slate-300"
                  }`}>
                    {forecastData?.dominantTrend || "BULLISH"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-sans">Neural Trend Confidence:</span>
                  <span className="font-bold text-emerald-400 tabular-nums">{forecastData?.trendConfidence || 74.2}%</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-sans">Expected 20-Bar Drift:</span>
                  <span className="font-bold text-emerald-400 tabular-nums">+{forecastData?.expectedDriftPct || 2.5}%</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-sans">Volatility Envelope:</span>
                  <span className="font-bold text-amber-400 tabular-nums">±{forecastData?.volatilityEnvelopePct || 4.8}%</span>
                </div>
              </div>
            </div>

            {/* Feature Attention Breakdown */}
            <div className="lg:col-span-2 bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-sans font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Crosshair className="h-4 w-4 text-emerald-400" />
                  TEMPORAL SELF-ATTENTION WEIGHTS
                </span>
                <span className="text-[10px] font-mono text-slate-500">Multi-Head Attention</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {(forecastData?.featureImportance || [
                  { feature: "Price Momentum", weight: 0.284, importancePct: 28.4 },
                  { feature: "RSI Divergence", weight: 0.216, importancePct: 21.6 },
                  { feature: "Volume Z-Score", weight: 0.185, importancePct: 18.5 },
                  { feature: "GNN Contagion Weight", weight: 0.162, importancePct: 16.2 }
                ]).map((feat) => (
                  <div key={feat.feature} className="bg-[#080b11] border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <div className="flex justify-between text-xs font-sans">
                      <span className="text-slate-300">{feat.feature}</span>
                      <span className="font-bold font-mono text-white tabular-nums">{feat.importancePct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${feat.importancePct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Probabilistic Quantile Fan Chart (Cone of Uncertainty) */}
          <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Compass className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-sans font-bold text-slate-200 uppercase tracking-wider">
                  MULTI-HORIZON PROBABILISTIC CONE OF UNCERTAINTY (QUANTILE FAN)
                </span>
                <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Attention 20-Step
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/40" />
                  <span className="text-slate-300">95% Envelope</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500/40 border border-emerald-500/70" />
                  <span className="text-slate-300">80% Envelope</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Median Path</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-emerald-400 border-dashed" />
                  <span className="text-emerald-400">Bull Drift</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-rose-400 border-dashed" />
                  <span className="text-rose-400">Bear Drift</span>
                </div>
              </div>
            </div>

            {/* SVG Quantile Fan Chart */}
            <div className="relative w-full overflow-hidden bg-[#080b11] p-2 rounded-xl border border-slate-800">
              <svg
                viewBox={`0 0 ${fanWidth} ${fanHeight}`}
                className="w-full h-auto text-slate-400 select-none"
              >
                <defs>
                  <linearGradient id="fanGrad95" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.16" />
                  </linearGradient>
                  <linearGradient id="fanGrad80" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.32" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                {[0.2, 0.4, 0.6, 0.8].map((pct, idx) => {
                  const y = fanPadding.top + pct * (fanHeight - fanPadding.top - fanPadding.bottom);
                  const val = maxFanVal - pct * (maxFanVal - minFanVal);
                  return (
                    <g key={idx}>
                      <line
                        x1={fanPadding.left}
                        y1={y}
                        x2={fanWidth - fanPadding.right}
                        y2={y}
                        stroke="#1e293b"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={fanPadding.left - 8}
                        y={y + 3}
                        fontSize="9"
                        fontFamily="monospace"
                        fill="#94a3b8"
                        opacity="0.8"
                        textAnchor="end"
                      >
                        ₹{Math.round(val).toLocaleString("en-IN")}
                      </text>
                    </g>
                  );
                })}

                {/* 95% Confidence Fan Polygon */}
                {polygon95 && (
                  <polygon
                    points={polygon95}
                    fill="url(#fanGrad95)"
                    stroke="#047857"
                    strokeWidth="0.8"
                    strokeOpacity="0.3"
                  />
                )}

                {/* 80% Confidence Fan Polygon */}
                {polygon80 && (
                  <polygon
                    points={polygon80}
                    fill="url(#fanGrad80)"
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeOpacity="0.45"
                  />
                )}

                {/* Bullish Drift Path */}
                <path
                  d={pathBullish}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  strokeOpacity="0.75"
                />

                {/* Bearish Drift Path */}
                <path
                  d={pathBearish}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  strokeOpacity="0.75"
                />

                {/* Median Forecast Trajectory */}
                <path
                  d={pathMedian}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Horizon Step Labels on X-axis */}
                {fanPoints.filter((_, idx) => idx % 4 === 0 || idx === fanPoints.length - 1).map((pt, idx) => (
                  <text
                    key={idx}
                    x={pt.x}
                    y={fanHeight - 8}
                    fontSize="9"
                    fontFamily="monospace"
                    fill="#94a3b8"
                    opacity="0.8"
                    textAnchor="middle"
                  >
                    t+{pt.data.step}
                  </text>
                ))}

                {/* Interactive Points on Median Line */}
                {fanPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredForecastIndex === idx ? 5 : 2.5}
                    fill={hoveredForecastIndex === idx ? "#34d399" : "#10b981"}
                    stroke="#064e3b"
                    strokeWidth={hoveredForecastIndex === idx ? 2 : 1}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredForecastIndex(idx)}
                    onMouseLeave={() => setHoveredForecastIndex(null)}
                  />
                ))}
              </svg>

              {/* Hover Info Tooltip */}
              {hoveredForecastIndex !== null && fanPoints[hoveredForecastIndex] && (
                <div 
                  className="absolute top-2 right-4 bg-[#0b0f17]/95 border border-slate-700 rounded-lg p-3 shadow-2xl text-xs font-mono pointer-events-none z-10 space-y-1"
                >
                  <div className="text-white font-bold border-b border-slate-800 pb-1 flex justify-between gap-4 font-sans">
                    <span>Horizon t+{fanPoints[hoveredForecastIndex].data.step}</span>
                    <span className="text-slate-400 font-mono">{fanPoints[hoveredForecastIndex].data.timestamp}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-slate-200 pt-0.5 tabular-nums">
                    <span className="font-sans text-slate-400">Median Expected:</span>
                    <span className="font-bold text-white">₹{fanPoints[hoveredForecastIndex].data.basePrice.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-slate-300 tabular-nums">
                    <span className="font-sans text-slate-400">80% CI:</span>
                    <span>₹{fanPoints[hoveredForecastIndex].data.lowerConfidence80.toLocaleString("en-IN")} – ₹{fanPoints[hoveredForecastIndex].data.upperConfidence80.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-slate-400 tabular-nums">
                    <span className="font-sans text-slate-400">95% CI:</span>
                    <span>₹{fanPoints[hoveredForecastIndex].data.lowerConfidence95.toLocaleString("en-IN")} – ₹{fanPoints[hoveredForecastIndex].data.upperConfidence95.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Forecast Points Table with 80% & 95% Confidence Intervals */}
          <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-sans font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                MULTI-HORIZON PROBABILISTIC TRAJECTORY TABLE
              </span>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                Current: ₹{forecastData?.currentPrice?.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg bg-[#0e1422]/40">
              <table className="w-full text-left text-xs font-mono tabular-nums">
                <thead>
                  <tr className="bg-[#090d16] text-slate-400 border-b border-slate-800 text-[10px] uppercase font-semibold font-sans">
                    <th className="py-2.5 px-3">Horizon Step</th>
                    <th className="py-2.5 px-3">Time Offset</th>
                    <th className="py-2.5 px-3">95% Lower</th>
                    <th className="py-2.5 px-3">80% Lower</th>
                    <th className="py-2.5 px-3 text-white font-bold">Median Forecast</th>
                    <th className="py-2.5 px-3">80% Upper</th>
                    <th className="py-2.5 px-3">95% Upper</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(forecastData?.trajectory || []).slice(0, 10).map((pt) => (
                    <tr key={pt.step} className="hover:bg-[#121929] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">t+{pt.step}</td>
                      <td className="py-2.5 px-3 text-slate-400">{pt.timestamp}</td>
                      <td className="py-2.5 px-3 text-rose-400">₹{pt.lowerConfidence95?.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 text-rose-300">₹{pt.lowerConfidence80?.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 font-bold text-white">₹{pt.basePrice?.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 text-emerald-300">₹{pt.upperConfidence80?.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 text-emerald-400">₹{pt.upperConfidence95?.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};


