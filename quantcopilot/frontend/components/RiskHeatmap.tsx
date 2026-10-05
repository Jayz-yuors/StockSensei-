"use client";

import React, { useState, useMemo } from "react";
import { usePortfolioStore } from "../store/usePortfolioStore";
import { GNNRiskNode, GNNShockResponse } from "../types";
import { 
  Network, 
  Sliders, 
  Play, 
  RotateCcw, 
  Zap, 
  ShieldAlert, 
  X, 
  ChevronRight, 
  BarChart2
} from "lucide-react";
import { getApiBaseUrl } from "../lib/api";

export const RiskHeatmap: React.FC = () => {
  const { gnnRisk } = usePortfolioStore();

  // State for What-If Stress Testing Simulator
  const [selectedShockSymbol, setSelectedShockSymbol] = useState<string>("HDFCBANK");
  const [shockPercentage, setShockPercentage] = useState<number>(-5.0);
  const [customShockInput, setCustomShockInput] = useState<string>("-5.0");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<GNNShockResponse | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // State for Dynamic Edge Sparsification Filter (0.10 to 0.80)
  const [edgeThreshold, setEdgeThreshold] = useState<number>(0.15);

  // State for Deep Node Inspector
  const [inspectedNode, setInspectedNode] = useState<GNNRiskNode | null>(null);

  // Active view mode within GNN interface: "MATRIX" | "SECTORS"
  const [viewMode, setViewMode] = useState<"MATRIX" | "SECTORS">("MATRIX");

  const numNodes = gnnRisk.nodes.length || 1;
  const gridCols = Math.min(Math.max(Math.ceil(Math.sqrt(numNodes)), 3), 8);

  // Execute Shock Simulation via backend
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/portfolio/risk/gnn-simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedShockSymbol,
          shock_percentage: shockPercentage,
          damping: 0.82
        })
      });

      if (!res.ok) {
        throw new Error(`Simulation failed with status ${res.status}`);
      }

      const data: GNNShockResponse = await res.json();
      setSimulationResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error executing stress test";
      setSimError(message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetSimulation = () => {
    setSimulationResult(null);
    setSimError(null);
  };

  const handleQuickShockSelect = (val: number) => {
    setShockPercentage(val);
    setCustomShockInput(val.toString());
  };

  // Node correlation lookup for Deep Node Inspector
  const inspectedNodeCorrelations = useMemo(() => {
    if (!inspectedNode || !gnnRisk.adjacency_matrix.length) return [];
    const idx = gnnRisk.nodes.findIndex(n => n.node_id === inspectedNode.node_id);
    if (idx === -1) return [];

    const row = gnnRisk.adjacency_matrix[idx] || [];
    const corrs = gnnRisk.nodes.map((node, i) => ({
      symbol: node.asset_name,
      company: node.company_name,
      corr: row[i] || 0.0,
      risk: node.risk_score
    })).filter(item => item.symbol !== inspectedNode.asset_name);

    corrs.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));
    return corrs.slice(0, 5);
  }, [inspectedNode, gnnRisk]);

  // Sector breakdown aggregation
  const sectorList = useMemo(() => {
    const secMap: Record<string, { totalRisk: number; count: number; maxRisk: number; symbols: string[] }> = {};
    for (const node of gnnRisk.nodes) {
      const sec = node.sector || "Other Equities";
      if (!secMap[sec]) {
        secMap[sec] = { totalRisk: 0, count: 0, maxRisk: 0, symbols: [] };
      }
      secMap[sec].totalRisk += node.risk_score;
      secMap[sec].count += 1;
      secMap[sec].maxRisk = Math.max(secMap[sec].maxRisk, node.risk_score);
      secMap[sec].symbols.push(node.asset_name);
    }

    return Object.entries(secMap).map(([sector, data]) => ({
      sector,
      avg_risk: roundTo(data.totalRisk / data.count, 4),
      max_risk: data.maxRisk,
      node_count: data.count,
      status: (data.totalRisk / data.count > 0.35 ? "CRITICAL" : (data.totalRisk / data.count > 0.22 ? "ELEVATED" : "STABLE")) as "CRITICAL" | "ELEVATED" | "STABLE",
      symbols: data.symbols
    })).sort((a, b) => b.avg_risk - a.avg_risk);
  }, [gnnRisk.nodes]);

  function roundTo(n: number, digits: number) {
    return Number(n.toFixed(digits));
  }

  // Count active edges above threshold
  const activeEdgeCount = useMemo(() => {
    let count = 0;
    const mat = gnnRisk.adjacency_matrix.slice(0, gridCols);
    mat.forEach(row => {
      row.slice(0, gridCols).forEach(val => {
        if (Math.abs(val) >= edgeThreshold) count++;
      });
    });
    return count;
  }, [gnnRisk.adjacency_matrix, gridCols, edgeThreshold]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-slate-100 font-sans pb-16">
      {/* 1. Main Header & High-level Status */}
      <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#0e1422] border border-slate-800 text-emerald-400">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold font-sans text-white tracking-wide uppercase">
                  CAUSALGRAPHX GNN RISK ENGINE MATRIX
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded">
                  4-HEAD GAT
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Dynamic 60-Day EWMA Covariance &amp; Relational Shock Diffusion across NSE Equities
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 text-xs font-mono">
            <div className="flex items-center space-x-2 bg-[#0e1422] px-3 py-1.5 rounded-md border border-slate-800">
              <span className="text-slate-400">Regime:</span>
              <span className="text-emerald-400 font-bold">
                {gnnRisk.regime_classification}
              </span>
            </div>

            <div className="flex items-center space-x-2 bg-[#0e1422] px-3 py-1.5 rounded-md border border-slate-800">
              <span className="text-slate-400">System Risk:</span>
              <span className={`font-bold tabular-nums ${
                simulationResult 
                  ? "text-rose-400" 
                  : gnnRisk.overall_system_risk > 0.35 ? "text-amber-400" : "text-emerald-400"
              }`}>
                {simulationResult ? simulationResult.post_shock_system_risk : gnnRisk.overall_system_risk}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Interactive "What-If" Contagion Stress Test Simulator Panel */}
        <div className="bg-[#080b11] border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-sans font-bold text-slate-200 uppercase tracking-wider">
                INTERACTIVE CONTAGION SHOCK SIMULATOR (WHAT-IF STRESS TESTING)
              </span>
            </div>
            <span className="text-xs text-slate-400 font-sans">
              Trace shock propagation across attention-weighted graph edges
            </span>
          </div>

          {/* Simulator Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Select Target Asset to Shock */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider block">
                1. Target Asset to Shock
              </label>
              <select
                value={selectedShockSymbol}
                onChange={(e) => setSelectedShockSymbol(e.target.value)}
                className="w-full bg-[#0e1422] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-100 outline-none focus:border-slate-600 transition-colors"
              >
                {gnnRisk.nodes.map((n) => (
                  <option key={n.asset_name} value={n.asset_name}>
                    {n.asset_name} ({n.company_name || n.sector || "Equity"})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Shock Selectors */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider block">
                2. Price Shock Magnitude (%)
              </label>
              <div className="flex items-center space-x-2">
                {[-2.0, -5.0, -8.0, -12.0].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleQuickShockSelect(val)}
                    className={`flex-1 py-1.5 px-2 text-xs font-mono font-bold rounded-md transition-all tabular-nums ${
                      shockPercentage === val
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
                        : "bg-[#0e1422] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {val}%
                  </button>
                ))}
                <input
                  type="number"
                  step="0.5"
                  value={customShockInput}
                  onChange={(e) => {
                    setCustomShockInput(e.target.value);
                    const parsed = parseFloat(e.target.value);
                    if (!isNaN(parsed)) setShockPercentage(parsed);
                  }}
                  className="w-20 bg-[#0e1422] border border-slate-800 rounded-md px-2 py-1.5 text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-slate-600 text-center"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-sans text-xs font-bold uppercase rounded-md shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSimulating ? (
                  <>
                    <Zap className="h-3.5 w-3.5 animate-spin" />
                    <span>Propagating...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Run Simulation</span>
                  </>
                )}
              </button>

              {simulationResult && (
                <button
                  onClick={handleResetSimulation}
                  className="py-2 px-3 bg-[#0e1422] hover:bg-slate-800 text-slate-300 font-sans text-xs rounded-md transition-colors border border-slate-700"
                  title="Reset simulation baseline"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Simulation Output Banner */}
          {simulationResult && (
            <div className="bg-rose-950/20 border border-rose-900/60 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-900/40 pb-2.5">
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <span className="font-bold text-rose-300">
                    SIMULATION IMPACT: {simulationResult.shocked_asset} SHOCKED BY {simulationResult.shock_percentage}%
                  </span>
                  <span className="text-xs text-slate-400">({simulationResult.latency_ms}ms)</span>
                </div>
                <div className="flex items-center space-x-3 text-xs font-mono tabular-nums">
                  <span className="text-slate-400">System Risk:</span>
                  <span className="text-slate-500 line-through">{simulationResult.baseline_system_risk}</span>
                  <span className="font-bold text-rose-400">&rarr; {simulationResult.post_shock_system_risk}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {simulationResult.contagion_status}
                  </span>
                </div>
              </div>

              {/* Top Cascade Victims Cards */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
                  Top Cascade Victims (Secondary Distressed Assets)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {simulationResult.top_cascade_victims.map((vic) => (
                    <div
                      key={vic.symbol}
                      className="bg-[#0b0f17] border border-slate-800 rounded-lg p-2.5 space-y-1 text-xs font-mono"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{vic.symbol}</span>
                        <span className="text-[11px] text-rose-400 font-semibold tabular-nums">{vic.projected_price_delta_pct}%</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate font-sans">{vic.sector || "Equities"}</div>
                      <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-800">
                        <span className="text-slate-500 font-sans">Risk:</span>
                        <span className="text-rose-400 font-bold tabular-nums">+{vic.risk_delta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {simError && (
            <div className="text-xs font-sans text-rose-400 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40">
              {simError}
            </div>
          )}
        </div>

        {/* 3. View Switcher Tabs: Network Matrix vs Sector Aggregator */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-xs font-sans">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("MATRIX")}
              className={`px-3 py-1.5 rounded-md transition-all duration-150 active:scale-95 font-semibold ${
                viewMode === "MATRIX"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Asset Contagion &amp; Matrix
            </button>
            <button
              onClick={() => setViewMode("SECTORS")}
              className={`px-3 py-1.5 rounded-md transition-all duration-150 active:scale-95 font-semibold ${
                viewMode === "SECTORS"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sector Vulnerability Fragility
            </button>
          </div>

          {/* Dynamic Edge Threshold Filter Slider */}
          <div className="flex items-center space-x-2 font-mono">
            <span className="text-[10px] text-slate-400 uppercase font-sans">Corr Threshold (&tau;):</span>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={edgeThreshold}
              onChange={(e) => setEdgeThreshold(parseFloat(e.target.value))}
              className="w-24 accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-bold text-white w-8 text-right tabular-nums">
              {edgeThreshold.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 4. Main Views: Matrix View vs Sector View */}
        <div key={viewMode} className="animate-fade-in-up">
          {viewMode === "MATRIX" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Asset Contagion & Centrality Vector List */}
              <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider">
                  Asset Contagion &amp; Centrality Vectors
                </h3>
                <span className="text-[11px] font-sans text-slate-500">
                  Click any node to inspect transmission edges
                </span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {gnnRisk.nodes.map((node) => {
                  const isHigh = node.risk_score > 0.35;
                  const isInspected = inspectedNode?.node_id === node.node_id;

                  return (
                    <div
                      key={node.node_id}
                      onClick={() => setInspectedNode(node)}
                      className={`bg-[#080b11] border rounded-lg p-3 flex items-center justify-between text-xs font-mono cursor-pointer transition-all hover:border-slate-700 ${
                        isInspected 
                          ? "border-emerald-500/50 bg-[#0e1422] shadow-sm" 
                          : "border-slate-800"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${isHigh ? "bg-rose-500" : "bg-emerald-500"}`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white font-mono">{node.asset_name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-slate-300 font-sans">
                              {node.sector || "Equities"}
                            </span>
                          </div>
                          {node.company_name && (
                            <span className="text-[11px] text-slate-400 font-sans block">
                              {node.company_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-slate-400 font-sans">Centrality</span>
                          <span className="text-slate-200 tabular-nums">{node.centrality}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-slate-400 font-sans">Contagion</span>
                          <span className="text-slate-200 tabular-nums">{node.systemic_contagion_factor}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-slate-400 font-sans">GNN Risk</span>
                          <span className={`font-bold tabular-nums ${isHigh ? "text-rose-400" : "text-emerald-400"}`}>
                            {node.risk_score}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Dynamic Adjacency Correlation Heatmap */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-sans text-slate-400">
                <span className="uppercase font-semibold tracking-wider">Correlation Heatmap</span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">{activeEdgeCount} Edges Active</span>
              </div>

              <div className="bg-[#080b11] border border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center shadow-sm">
                <div 
                  className="grid gap-1 w-full aspect-square max-w-[240px]"
                  style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
                >
                  {gnnRisk.adjacency_matrix.slice(0, gridCols).map((row, i) =>
                    row.slice(0, gridCols).map((val, j) => {
                      const isPassing = Math.abs(val) >= edgeThreshold;
                      const opacity = isPassing ? Math.max(0.20, Math.abs(val)) : 0.05;

                      return (
                        <div
                          key={`${i}-${j}`}
                          title={`Correlation Edge (${i}, ${j}): ${val.toFixed(2)}`}
                          style={{
                            backgroundColor: `rgba(16, 185, 129, ${opacity})`
                          }}
                          className={`rounded border flex items-center justify-center text-[9px] font-mono font-bold transition-all tabular-nums ${
                            isPassing 
                              ? "border-emerald-500/50 text-white font-bold" 
                              : "border-slate-800/40 text-slate-600 opacity-20"
                          }`}
                        >
                          {isPassing ? val.toFixed(2) : "·"}
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-[11px] font-sans text-slate-400 mt-3 text-center">
                  Thresholded Backbone ({edgeThreshold.toFixed(2)}+ correlation). Hover cell for pair values.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Sector Vulnerability Fragility View */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-sans text-slate-400">
              <span className="uppercase font-semibold tracking-wider">SECTOR-LEVEL SYSTEMIC RISK &amp; CONTAGION CLUSTERS</span>
              <span className="text-xs font-mono">{sectorList.length} Sectors Modeled</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectorList.map((sec) => (
                <div
                  key={sec.sector}
                  className="bg-[#080b11] border border-slate-800 rounded-xl p-4 space-y-3 font-sans text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="font-bold text-white">{sec.sector}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      sec.status === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : sec.status === "ELEVATED"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {sec.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-300 text-xs">
                      <span className="font-sans text-slate-400">Avg Contagion Score:</span>
                      <span className="font-bold tabular-nums text-white">{sec.avg_risk}</span>
                    </div>
                    {/* Visual Risk Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          sec.avg_risk > 0.35 ? "bg-rose-500" : sec.avg_risk > 0.22 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, sec.avg_risk * 200)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    <span>{sec.node_count} Constituents</span>
                    <span className="truncate max-w-[150px] font-mono">{sec.symbols.join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>


      {/* 5. Deep Node Inspector Modal */}
      {inspectedNode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f17] border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-5 font-sans text-xs animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">

              <div className="flex items-center space-x-2">
                <BarChart2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  NODE TRANSMISSION PROFILE: {inspectedNode.asset_name}
                </span>
              </div>
              <button
                onClick={() => setInspectedNode(null)}
                className="p-1.5 bg-[#0e1422] rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono tabular-nums">
              <div className="bg-[#080b11] border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Risk Score</div>
                <div className="text-base font-bold text-rose-400 mt-1">{inspectedNode.risk_score}</div>
              </div>
              <div className="bg-[#080b11] border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Centrality</div>
                <div className="text-base font-bold text-white mt-1">{inspectedNode.centrality}</div>
              </div>
              <div className="bg-[#080b11] border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Contagion Factor</div>
                <div className="text-base font-bold text-emerald-400 mt-1">{inspectedNode.systemic_contagion_factor}</div>
              </div>
            </div>

            {/* Top Correlated Transmission Neighbors */}
            <div className="space-y-2">
              <div className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
                Top Correlated Transmission Neighbors
              </div>
              <div className="space-y-1.5 font-mono">
                {inspectedNodeCorrelations.map((peer) => (
                  <div
                    key={peer.symbol}
                    className="flex items-center justify-between bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{peer.symbol}</span>
                      {peer.company && (
                        <span className="text-[11px] text-slate-400 ml-2 font-sans">{peer.company}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 tabular-nums">
                      <span className="text-xs text-slate-400 font-sans">Edge: {peer.corr.toFixed(3)}</span>
                      <span className={`font-bold ${peer.risk > 0.35 ? "text-rose-400" : "text-emerald-400"}`}>
                        {peer.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 18-Alpha Feature Vector Readings */}
            {inspectedNode.features && inspectedNode.features.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 font-mono">
                <div className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
                  Alpha Vector Feature Signature (Partial)
                </div>
                <div className="grid grid-cols-4 gap-1 text-[11px] tabular-nums">
                  {inspectedNode.features.slice(0, 4).map((f, i) => (
                    <div key={i} className="bg-[#080b11] px-2 py-1 rounded border border-slate-800 text-center text-slate-300">
                      &alpha;_{i+1}: <span className="text-white font-bold">{f.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
