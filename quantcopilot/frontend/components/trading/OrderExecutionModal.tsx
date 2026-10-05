"use client";

import React, { useState } from "react";
import { OrderInput } from "../../types/trading";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Check, 
  Info, 
  Zap, 
  ArrowRight 
} from "lucide-react";

interface OrderExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  initialSide?: "BUY" | "SELL";
}

export const OrderExecutionModal: React.FC<OrderExecutionModalProps> = ({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  initialSide = "BUY"
}) => {
  const { addPosition } = usePortfolioStore();

  const [side, setSide] = useState<"BUY" | "SELL">(initialSide);
  const [productType, setProductType] = useState<"INTRADAY" | "DELIVERY" | "OPTIONS_NRML">("INTRADAY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT" | "SL_LIMIT">("MARKET");
  const [quantity, setQuantity] = useState<number>(50);
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice || 1000);
  const [hasBracketSL, setHasBracketSL] = useState<boolean>(false);
  const [stopLossPrice, setStopLossPrice] = useState<number>(Number(((currentPrice || 1000) * 0.98).toFixed(2)));
  const [targetPrice, setTargetPrice] = useState<number>(Number(((currentPrice || 1000) * 1.04).toFixed(2)));
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false);

  if (!isOpen) return null;

  const price = orderType === "MARKET" ? currentPrice : limitPrice;
  const leverage = productType === "INTRADAY" ? 5 : 1;
  const grossValue = price * quantity;
  const marginRequired = Number((grossValue / leverage).toFixed(2));
  
  // Groww / Zerodha estimated statutory charges calculation
  const brokerage = Math.min(20, Number((grossValue * 0.0003).toFixed(2)));
  const stt = Number((grossValue * (side === "SELL" || productType === "DELIVERY" ? 0.001 : 0.00025)).toFixed(2));
  const exchangeCharges = Number((grossValue * 0.0000345).toFixed(2));
  const gst = Number(((brokerage + exchangeCharges) * 0.18).toFixed(2));
  const sebiCharges = Number((grossValue * 0.000001).toFixed(2));
  const totalCharges = Number((brokerage + stt + exchangeCharges + gst + sebiCharges).toFixed(2));

  const handleExecuteOrder = () => {
    addPosition({
      symbol: symbol.toUpperCase(),
      quantity,
      entry_price: price,
      side: side === "BUY" ? "LONG" : "SHORT",
      leverage: productType === "INTRADAY" ? 5 : 1
    });

    setOrderPlaced(true);
    setTimeout(() => {
      setOrderPlaced(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#040805] border border-emerald-950 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-mono text-emerald-100">
        {/* Header Bar */}
        <div className={`p-4 flex items-center justify-between ${
          side === "BUY" ? "bg-emerald-500 text-black" : "bg-rose-600 text-white"
        }`}>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-sm uppercase">{side} {symbol}</span>
              <span className="text-[10px] bg-black/20 font-bold px-2 py-0.5 rounded-full">
                NSE
              </span>
            </div>
            <div className={`text-xs font-bold mt-0.5 ${side === "BUY" ? "text-emerald-950" : "text-rose-100"}`}>
              LTP: ₹{currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {orderPlaced ? (
          <div className="p-10 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center animate-bounce">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-emerald-100">ORDER EXECUTED</h3>
            <p className="text-xs text-emerald-600">
              {quantity} qty {side} placed successfully at ₹{price.toFixed(2)}
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Side Switcher (BUY / SELL) */}
            <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-xl border border-emerald-950">
              <button
                onClick={() => setSide("BUY")}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  side === "BUY" ? "bg-emerald-500 text-black shadow-md font-black" : "text-emerald-600 hover:text-emerald-200"
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setSide("SELL")}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  side === "SELL" ? "bg-rose-600 text-white shadow-md font-black" : "text-emerald-600 hover:text-emerald-200"
                }`}
              >
                SELL
              </button>
            </div>

            {/* Product Type (Intraday MIS vs Delivery CNC) */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: "INTRADAY" as const, label: "Intraday (5x)", desc: "MIS" },
                { id: "DELIVERY" as const, label: "Delivery (1x)", desc: "CNC" },
                { id: "OPTIONS_NRML" as const, label: "Options", desc: "NRML" }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProductType(p.id)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    productType === p.id 
                      ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-400 font-bold" 
                      : "bg-black border-emerald-950 text-emerald-600 hover:text-emerald-200"
                  }`}
                >
                  <div className="text-[11px]">{p.label}</div>
                  <div className="text-[9px] text-emerald-600/70">{p.desc}</div>
                </button>
              ))}
            </div>

            {/* Order Type & Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-emerald-600 uppercase font-bold">Quantity (Shares)</label>
                <div className="flex items-center space-x-1 bg-black border border-emerald-950 rounded-lg p-1">
                  <input
                    type="number"
                    value={quantity}
                    min={1}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-transparent px-2 py-1 text-sm font-bold text-emerald-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-emerald-600 uppercase font-bold">Order Type</label>
                <div className="flex bg-black border border-emerald-950 rounded-lg p-1">
                  {(["MARKET", "LIMIT"] as const).map((ot) => (
                    <button
                      key={ot}
                      onClick={() => setOrderType(ot)}
                      className={`flex-1 py-1 rounded text-xs font-bold ${
                        orderType === ot ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "text-emerald-600 hover:text-emerald-300"
                      }`}
                    >
                      {ot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Limit Price Input if LIMIT */}
            {orderType === "LIMIT" && (
              <div className="space-y-1">
                <label className="text-[10px] text-emerald-600 uppercase font-bold">Limit Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(Number(e.target.value))}
                  className="w-full bg-black border border-emerald-950 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Bracket Order (SL & Target) Toggle */}
            <div className="bg-black border border-emerald-950 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-200 font-bold">Bracket Target & Stop Loss</span>
                <input
                  type="checkbox"
                  checked={hasBracketSL}
                  onChange={(e) => setHasBracketSL(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-500"
                />
              </div>

              {hasBracketSL && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-emerald-600 block">Stop Loss (₹)</span>
                    <input
                      type="number"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(Number(e.target.value))}
                      className="w-full bg-[#040805] border border-emerald-950 rounded px-2 py-1 text-xs text-rose-400 font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 block">Target (₹)</span>
                    <input
                      type="number"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(Number(e.target.value))}
                      className="w-full bg-[#040805] border border-emerald-950 rounded px-2 py-1 text-xs text-emerald-400 font-bold focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Groww Charges & Margin Breakdown */}
            <div className="bg-black border border-emerald-950 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-emerald-300 font-bold">
                <span>Margin Required:</span>
                <span className="text-sm font-extrabold text-emerald-400">₹{marginRequired.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-emerald-600 pt-1 border-t border-emerald-950">
                <span>Est. Charges (Brokerage + STT + GST):</span>
                <span className="text-emerald-300">₹{totalCharges}</span>
              </div>
            </div>

            {/* Submit Execution Button */}
            <button
              onClick={handleExecuteOrder}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2 ${
                side === "BUY"
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                  : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
              }`}
            >
              <span>{side} {quantity} {symbol} @ ₹{price.toFixed(2)}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
