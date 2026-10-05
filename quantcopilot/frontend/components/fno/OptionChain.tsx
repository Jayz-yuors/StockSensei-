"use client";

import React, { useEffect, useState } from "react";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { OptionStrike } from "../../types";

interface OptionChainProps {
  onSelectContract: (symbol: string) => void;
}

export const OptionChain: React.FC<OptionChainProps> = React.memo(({ onSelectContract }) => {
  const { selectedFnoSymbol, fnoOptionChain, fetchFnoChain } = usePortfolioStore();
  const [expiry, setExpiry] = useState("28-AUG-2026");

  useEffect(() => {
    fetchFnoChain(selectedFnoSymbol, expiry);
  }, [selectedFnoSymbol, expiry, fetchFnoChain]);

  const spot = fnoOptionChain?.spot_price || 24144.10;
  const pcr = fnoOptionChain?.pcr_ratio || 1.15;
  const maxPain = fnoOptionChain?.max_pain_strike || 24150.0;
  const totalCalls = fnoOptionChain?.total_call_oi || 450000;
  const totalPuts = fnoOptionChain?.total_put_oi || 520000;
  const strikes: OptionStrike[] = fnoOptionChain?.strikes || [];

  return (
    <div className="flex flex-col h-full w-full bg-black text-[11px] font-mono select-none overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#040805] border-b border-emerald-950 shrink-0">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-emerald-200 uppercase">OPTION CHAIN ({selectedFnoSymbol})</span>
          <select
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="bg-black border border-emerald-900 text-emerald-300 rounded px-2 py-0.5 text-[10px] outline-none"
          >
            <option value="28-AUG-2026">28-AUG-2026 (Weekly)</option>
            <option value="04-SEP-2026">04-SEP-2026 (Weekly)</option>
            <option value="25-SEP-2026">25-SEP-2026 (Monthly)</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <span className="text-emerald-500/70">PCR:</span>
            <span className={`font-bold ${pcr >= 1 ? "text-emerald-400" : "text-rose-400"}`}>{pcr}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-emerald-500/70">Max Pain:</span>
            <span className="font-bold text-emerald-300">₹{maxPain}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-emerald-500/70">Call OI:</span>
            <span className="text-emerald-200">{(totalCalls / 100000).toFixed(2)}L</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-emerald-500/70">Put OI:</span>
            <span className="text-emerald-200">{(totalPuts / 100000).toFixed(2)}L</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-center border-collapse">
          <thead className="sticky top-0 bg-[#060c07] text-[10px] text-emerald-500/80 border-b border-emerald-950 z-10">
            <tr>
              <th colSpan={6} className="py-1 bg-emerald-950/40 text-emerald-400 border-r border-emerald-950 font-bold">CALLS</th>
              <th className="py-1 bg-[#040805] text-emerald-200 font-bold">STRIKE</th>
              <th colSpan={6} className="py-1 bg-rose-950/20 text-rose-400 border-l border-emerald-950 font-bold">PUTS</th>
            </tr>
            <tr className="border-b border-emerald-950 text-[9px] text-emerald-600">
              <th className="py-1">OI</th>
              <th>CHG OI</th>
              <th>VOL</th>
              <th>IV</th>
              <th>DELTA</th>
              <th className="border-r border-emerald-950 text-emerald-400">LTP</th>
              <th className="bg-[#040805] text-emerald-200">PRICE</th>
              <th className="border-l border-emerald-950 text-rose-400">LTP</th>
              <th>DELTA</th>
              <th>IV</th>
              <th>VOL</th>
              <th>CHG OI</th>
              <th>OI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-950/50">
            {strikes.map((row) => {
              const isATM = Math.abs(row.strike_price - spot) < 30;
              const isITMCall = row.strike_price < spot;
              const isITMPut = row.strike_price > spot;

              return (
                <tr
                  key={row.strike_price}
                  className={`hover:bg-emerald-950/20 transition-colors ${
                    isATM ? "bg-emerald-950/30 border-y border-emerald-500/40" : ""
                  }`}
                >
                  <td className={`py-1 text-slate-400 ${isITMCall ? "bg-emerald-950/20" : ""}`}>{row.call_oi.toLocaleString("en-IN")}</td>
                  <td className={`${row.call_change_oi >= 0 ? "text-emerald-400" : "text-rose-400"} ${isITMCall ? "bg-emerald-950/20" : ""}`}>
                    {row.call_change_oi > 0 ? "+" : ""}{row.call_change_oi}
                  </td>
                  <td className={`text-slate-400 ${isITMCall ? "bg-emerald-950/20" : ""}`}>{row.call_volume.toLocaleString("en-IN")}</td>
                  <td className={`text-slate-400 ${isITMCall ? "bg-emerald-950/20" : ""}`}>{row.call_iv}%</td>
                  <td className={`text-slate-500 ${isITMCall ? "bg-emerald-950/20" : ""}`}>{row.call_delta}</td>
                  <td
                    onClick={() => onSelectContract(`${selectedFnoSymbol} ${row.strike_price} CE`)}
                    className={`font-bold cursor-pointer hover:bg-emerald-500/30 text-emerald-400 border-r border-emerald-950 transition-colors ${
                      isITMCall ? "bg-emerald-950/40" : ""
                    }`}
                  >
                    ₹{row.call_ltp.toFixed(2)}
                  </td>

                  <td className="py-1 font-bold bg-[#040805] text-emerald-200">
                    {row.strike_price}
                  </td>

                  <td
                    onClick={() => onSelectContract(`${selectedFnoSymbol} ${row.strike_price} PE`)}
                    className={`font-bold cursor-pointer hover:bg-rose-500/30 text-rose-400 border-l border-emerald-950 transition-colors ${
                      isITMPut ? "bg-rose-950/30" : ""
                    }`}
                  >
                    ₹{row.put_ltp.toFixed(2)}
                  </td>
                  <td className={`text-slate-500 ${isITMPut ? "bg-rose-950/10" : ""}`}>{row.put_delta}</td>
                  <td className={`text-slate-400 ${isITMPut ? "bg-rose-950/10" : ""}`}>{row.put_iv}%</td>
                  <td className={`text-slate-400 ${isITMPut ? "bg-rose-950/10" : ""}`}>{row.put_volume.toLocaleString("en-IN")}</td>
                  <td className={`${row.put_change_oi >= 0 ? "text-emerald-400" : "text-rose-400"} ${isITMPut ? "bg-rose-950/10" : ""}`}>
                    {row.put_change_oi > 0 ? "+" : ""}{row.put_change_oi}
                  </td>
                  <td className={`text-slate-400 ${isITMPut ? "bg-rose-950/10" : ""}`}>{row.put_oi.toLocaleString("en-IN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

OptionChain.displayName = "OptionChain";
