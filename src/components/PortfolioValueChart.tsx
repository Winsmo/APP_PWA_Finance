import React, { useState, useEffect, useMemo } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Transaction, Position } from "../types";
import { TICKER_MAP, getTicker } from "../lib/portfolio-utils";
import { cn } from "../lib/utils";
import { Info } from "lucide-react";

type Range = "1d" | "5d" | "10d" | "1mo" | "3mo" | "6mo" | "1y" | "5y" | "10y" | "max";

interface HistoryItem {
  time: number;
  price: number;
}

export function PortfolioValueChart({ positions, transactions }: { positions: Position[], transactions: Transaction[] }) {
  const [range, setRange] = useState<Range>("1mo");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [failedTickers, setFailedTickers] = useState<string[]>([]);

  const parseDate = (d: string) => {
    const [day, month, year] = d.split("/").map(Number);
    return new Date(year, month - 1, day).getTime() / 1000;
  };

  const fetchHistoricalData = async (symbol: string, range: Range) => {
    let interval = "1d";
    if (range === "1d") interval = "15m";
    else if (range === "5d" || range === "10d") interval = "1h";
    else if (range === "1mo" || range === "3mo" || range === "6mo" || range === "1y") interval = "1d";
    else if (range === "5y" || range === "10y" || range === "max") interval = "1wk";

    try {
      const response = await fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`);
      if (!response.ok) {
        if (interval !== "1d") {
          const secondTry = await fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=1d`);
          if (secondTry.ok) return await secondTry.json() as HistoryItem[];
        }
        return null;
      }
      return await response.json() as HistoryItem[];
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (positions.length === 0 || !transactions.length) {
      setChartData([]);
      setFailedTickers([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setFailedTickers([]);
      try {
        // 1. Fetch historical prices for all assets currently or previously held
        const uniqueTickers = Array.from(new Set([
          ...positions.map(p => p.ticker),
          ...transactions.map(t => getTicker(t.label)).filter(t => t !== "UNKNOWN")
        ]));

        const histories: { ticker: string, data: HistoryItem[] }[] = [];
        for (const ticker of uniqueTickers) {
          const data = await fetchHistoricalData(ticker, range);
          if (!data || data.length === 0) {
            setFailedTickers(prev => Array.from(new Set([...prev, ticker])));
            histories.push({ ticker, data: [] });
          } else {
            histories.push({ ticker, data });
          }
          // Small staggered delay to avoid burst
          await new Promise(r => setTimeout(r, 80));
        }

        // 2. Identify all relevant timestamps
        const allTimestamps = new Set<number>();
        histories.forEach(h => h.data.forEach(d => {
          if (d.time) allTimestamps.add(d.time);
        }));
        const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

        if (sortedTimestamps.length === 0) {
          throw new Error("No historical data found");
        }

        // 3. Pre-process transactions into a handy format
        const txByTicker: Record<string, { time: number, qtyChange: number }[]> = {};
        transactions.forEach(tx => {
          const tkr = getTicker(tx.label);
          if (tkr === "UNKNOWN") return;
          
          if (!txByTicker[tkr]) txByTicker[tkr] = [];
          
          let qtyChange = 0;
          const op = tx.operation.toLowerCase();
          if (op.includes("achat")) qtyChange = tx.quantity;
          if (op.includes("vente")) qtyChange = -tx.quantity;
          
          if (qtyChange !== 0) {
            txByTicker[tkr].push({ time: parseDate(tx.date), qtyChange });
          }
        });

        // 4. Aggregate value and performance at each timestamp
        const txByLabel = transactions.reduce((acc, tx) => {
          if (!acc[tx.label]) acc[tx.label] = [];
          acc[tx.label].push(tx);
          return acc;
        }, {} as Record<string, Transaction[]>);

        const allLabels = Object.keys(txByLabel);

        const aggregated = sortedTimestamps.map(ts => {
          let totalValue = 0;
          let totalCostBasis = 0;
          let realizedPL = 0;
          let dividends = 0;
          let fees = 0;
          
          allLabels.forEach(label => {
            const tickerTransactions = txByLabel[label].filter(tx => parseDate(tx.date) <= ts);
            if (tickerTransactions.length === 0) return;

            const ticker = getTicker(label);
            let currentQty = 0;
            let currentCost = 0;
            let lastPru = 0;
            
            tickerTransactions.forEach(tx => {
              const op = tx.operation.toLowerCase();
              if (op.includes("achat")) {
                currentQty += tx.quantity;
                currentCost += Math.abs(tx.netAmount);
                if (currentQty > 0) lastPru = currentCost / currentQty;
              } else if (op.includes("vente")) {
                const pru = currentQty > 0 ? currentCost / currentQty : lastPru;
                realizedPL += (tx.netAmount - (pru * tx.quantity));
                currentQty -= tx.quantity;
                currentCost = currentQty * pru;
                if (currentQty <= 0) currentCost = 0;
                if (currentQty > 0) lastPru = currentCost / currentQty;
              } else if (op.includes("coupon") || op.includes("dividende")) {
                dividends += tx.netAmount;
              } else if (op.includes("frais") || op.includes("taxe")) {
                fees += Math.abs(tx.netAmount);
              }
            });

            if (currentQty > 0) {
              const h = histories.find(hist => hist.ticker === ticker);
              let price = 0;
              if (h && h.data.length > 0) {
                const match = h.data.find(d => d.time === ts);
                if (match && !isNaN(match.price)) {
                  price = match.price;
                } else {
                  const last = h.data.slice().reverse().find(d => d.time <= ts);
                  if (last && !isNaN(last.price)) price = last.price;
                }
              }
              if (price === 0) price = currentCost / currentQty;
              totalValue += price * currentQty;
              totalCostBasis += currentCost;
            }
          });

          const latentPL = totalValue - totalCostBasis;
          const totalPerformanceValue = latentPL + realizedPL + dividends - fees;

          return {
            displayTime: formatDate(ts),
            valeur: Number(totalValue.toFixed(2)),
            latentPL: Number(latentPL.toFixed(2)),
            totalPerformanceValue: Number(totalPerformanceValue.toFixed(2)),
          };
        }).filter(d => d.valeur > 0 || Math.abs(d.totalPerformanceValue) > 0.01);

        setChartData(aggregated);
      } catch (e) {
        console.error("Failed to load historical portfolio value", e);
        // Fallback or keep empty
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [transactions.length, range]); // Only reload if transactions count changes (new import) or range changes

  const ranges: { key: Range; label: string }[] = [
    { key: "1d", label: "1J" },
    { key: "5d", label: "5J" },
    { key: "1mo", label: "1M" },
    { key: "3mo", label: "3M" },
    { key: "6mo", label: "6M" },
    { key: "1y", label: "1A" },
    { key: "5y", label: "5A" },
    { key: "10y", label: "10A" },
    { key: "max", label: "MAX" }
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  const formatDate = (ts: number) => {
    const date = new Date(ts * 1000);
    if (range === "1d" || range === "5d" || range === "10d") {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    if (range === "1mo" || range === "3mo" || range === "6mo") {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
    if (range === "1y" || range === "5y" || range === "10y") {
      return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { year: 'numeric' });
  };

  const statsValue = useMemo(() => {
    if (chartData.length < 2) return null;
    const start = chartData[0].valeur;
    const end = chartData[chartData.length - 1].valeur;
    const diff = end - start;
    const percent = start !== 0 ? (diff / start) * 100 : 0;
    return { diff, percent };
  }, [chartData]);

  const statsPL = useMemo(() => {
    if (chartData.length < 2) return null;
    const start = chartData[0].latentPL;
    const end = chartData[chartData.length - 1].latentPL;
    const diff = end - start;
    const percent = start !== 0 ? (diff / Math.abs(start)) * 100 : 0;
    return { current: end, diff, percent };
  }, [chartData]);

  const statsTotal = useMemo(() => {
    if (chartData.length < 2) return null;
    const start = chartData[0].totalPerformanceValue;
    const end = chartData[chartData.length - 1].totalPerformanceValue;
    const diff = end - start;
    const percent = start !== 0 ? (diff / Math.abs(start)) * 100 : 0;
    return { current: end, diff, percent };
  }, [chartData]);

  const RangeSelector = () => (
    <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar">
      {ranges.map((r) => (
        <button
          key={r.key}
          onClick={() => setRange(r.key)}
          className={cn(
            "px-3 py-1 rounded-md text-[10px] font-black transition-all",
            range === r.key 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* CARD 1: MARKET VALUE */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm flex flex-col min-h-[400px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest mb-1 flex items-center gap-2">
              Évolution Valeur Marché
              {chartData.some(d => d.isMock) && (
                <span className="text-[10px] text-slate-400 font-normal italic lowercase">(Données estimées)</span>
              )}
            </h4>
            {statsValue && (
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-bold", statsValue.diff >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {statsValue.diff >= 0 ? "+" : ""}{formatCurrency(statsValue.diff)}
                </span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded font-black", statsValue.diff >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                  {statsValue.diff >= 0 ? "+" : ""}{statsValue.percent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <RangeSelector />
        </div>

        <div className="flex-1 w-full relative min-h-[300px] mt-4">
          {loading && (
            <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {chartData.length === 0 && !loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-medium italic">
              Aucune donnée trouvée.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayTime" fontSize={9} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={60} />
                <YAxis fontSize={9} tick={{ fill: '#cbd5e1' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(1)}k€`} domain={['auto', 'auto']} width={40} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Valeur Totale"]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }} />
                <Line type="monotone" dataKey="valeur" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* CARD 2: LATENT P&L */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm flex flex-col min-h-[400px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest mb-1 flex items-center gap-2">
              Historique +/- Value Latente
            </h4>
            {statsPL && (
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-bold", statsPL.current >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {statsPL.current >= 0 ? "+" : ""}{formatCurrency(statsPL.current)}
                </span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-black",
                  statsPL.diff >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {statsPL.diff >= 0 ? "+" : ""}{formatCurrency(statsPL.diff)} ({statsPL.diff >= 0 ? "+" : ""}{statsPL.percent.toFixed(2)}%) sur la période
                </span>
              </div>
            )}
          </div>
          <RangeSelector />
        </div>

        <div className="flex-1 w-full relative min-h-[300px] mt-4">
          {loading && (
            <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {chartData.length === 0 && !loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-medium italic">
              Données insuffisantes.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayTime" fontSize={9} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={60} />
                <YAxis fontSize={9} tick={{ fill: '#cbd5e1' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(0)}€`} domain={['auto', 'auto']} width={45} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "+/- Latente"]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }} />
                <Line type="monotone" dataKey="latentPL" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} animationDuration={1200} />
                <Line dataKey={() => 0} stroke="#cbd5e1" strokeDasharray="3 3" dot={false} strokeWidth={1} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {failedTickers.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-50 pt-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Info size={10} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase tracking-tighter">Historiques partiels :</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {failedTickers.map(t => (
                  <span key={t} className="text-[8px] font-black px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded border border-slate-100 italic">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CARD 3: TOTAL PERFORMANCE */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm flex flex-col min-h-[400px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest mb-1 flex items-center gap-2">
              Performance Totale (L + V + D - F)
            </h4>
            {statsTotal && (
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-bold", statsTotal.current >= 0 ? "text-indigo-600" : "text-rose-600")}>
                  {statsTotal.current >= 0 ? "+" : ""}{formatCurrency(statsTotal.current)}
                </span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-black",
                  statsTotal.diff >= 0 ? "bg-indigo-50 text-indigo-600" : "bg-rose-50 text-rose-600"
                )}>
                  {statsTotal.diff >= 0 ? "+" : ""}{formatCurrency(statsTotal.diff)} ({statsTotal.diff >= 0 ? "+" : ""}{statsTotal.percent.toFixed(2)}%) sur la période
                </span>
              </div>
            )}
          </div>
          <RangeSelector />
        </div>

        <div className="flex-1 w-full relative min-h-[300px] mt-4">
          {loading && (
            <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {chartData.length === 0 && !loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-medium italic">
              Données insuffisantes.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayTime" fontSize={9} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={60} />
                <YAxis fontSize={9} tick={{ fill: '#cbd5e1' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(0)}€`} domain={['auto', 'auto']} width={45} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Perf. Totale"]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }} />
                <Line type="monotone" dataKey="totalPerformanceValue" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} animationDuration={1500} />
                <Line dataKey={() => 0} stroke="#cbd5e1" strokeDasharray="3 3" dot={false} strokeWidth={1} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {failedTickers.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-50 pt-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Info size={10} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase tracking-tighter">Historiques partiels :</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {failedTickers.map(t => (
                  <span key={t} className="text-[8px] font-black px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded border border-slate-100 italic">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
