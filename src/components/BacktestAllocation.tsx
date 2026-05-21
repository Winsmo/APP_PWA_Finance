import React, { useState, useEffect } from "react";
import { Position } from "../types";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { ShieldCheck, TrendingUp, TrendingDown, Info, Calendar, RefreshCw, BarChart2, Zap } from "lucide-react";
import { cn } from "../lib/utils";

interface Props {
  positions: Position[];
  theme: "investiscope" | "forest" | "cyber" | "minimal";
}

type Timeframe = "5y" | "10y";
type Benchmark = "spy" | "urth";

export function BacktestAllocation({ positions, theme }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>("5y");
  const [benchmark, setBenchmark] = useState<Benchmark>("urth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<{
    portfolioReturn: number;
    benchmarkReturn: number;
    volatility: number;
    sharpe: number;
    alpha: number;
    beta: number;
    maxDrawdown: number;
  } | null>(null);

  const isDark = theme === "cyber";

  useEffect(() => {
    if (positions.length === 0) return;

    async function runBacktest() {
      setLoading(true);
      setError(null);

      try {
        // Find distinct standard tickers to fetch
        const tickers = positions
          .map(p => p.ticker)
          .filter(t => t && t !== "UNKNOWN");

        const benchmarkTicker = benchmark === "spy" ? "^GSPC" : "IWDA.AS"; // S&P 500 or MSCI World
        
        // Fetch benchmark history
        const benchmarkRes = await fetch(`/api/history?symbol=${benchmarkTicker}&range=${timeframe}`);
        if (!benchmarkRes.ok) throw new Error("Impossible de charger les données historiques de l'indice de référence.");
        const rawBenchmarkHistory = await benchmarkRes.json();
        
        if (!Array.isArray(rawBenchmarkHistory) || rawBenchmarkHistory.length === 0) {
          throw new Error("Données de référence invalides ou vides.");
        }

        // Fetch histories for all positions in parallel, with error handling fallback
        const historyPromises = tickers.map(async (ticker) => {
          try {
            const res = await fetch(`/api/history?symbol=${ticker}&range=${timeframe}`);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                return { ticker, history: data };
              }
            }
          } catch (e) {
            console.warn(`Could not load history for ${ticker}, using fallback:`, e);
          }
          return { ticker, history: null };
        });

        const historiesResult = await Promise.all(historyPromises);
        const historiesMap: Record<string, any[]> = {};
        historiesResult.forEach(item => {
          if (item.history) {
            historiesMap[item.ticker] = item.history;
          }
        });

        // Parse and align timestamps
        // We will align histories against the benchmark's dates
        const alignedData: any[] = [];
        const totalAllocationValue = positions.reduce((sum, p) => sum + p.currentValue, 0);

        // Normalize allocation weights
        const weights = positions.map(p => ({
          ticker: p.ticker,
          weight: totalAllocationValue > 0 ? p.currentValue / totalAllocationValue : 1 / positions.length,
          riskScore: p.riskScore || 5
        }));

        // Initial prices (Day 0) to compute relative performance
        const initialPricesMap: Record<string, number> = {};
        const benchmarkInitial = rawBenchmarkHistory[0]?.price || 1;

        // Try to locate first valid price for each ticker
        tickers.forEach(ticker => {
          const hist = historiesMap[ticker];
          if (hist && hist.length > 0) {
            // first price point
            initialPricesMap[ticker] = hist[0].price;
          }
        });

        // Reconstruct daily portfolio values
        rawBenchmarkHistory.forEach((bPoint: any) => {
          const timestamp = bPoint.time;
          const dateStr = new Date(timestamp * 1000).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });

          // Calculate relative performance of benchmark
          const relativeBenchmark = (bPoint.price / benchmarkInitial) * 100;

          // Calculate relative performance of portfolio
          let relativePortfolio = 0;

          weights.forEach(w => {
            const hist = historiesMap[w.ticker];
            let priceFactor = 1.0;

            if (hist) {
              // find closest price point
              const closest = hist.find(h => h.time >= timestamp) || hist[hist.length - 1];
              const currentPrice = closest ? closest.price : 1;
              const initPrice = initialPricesMap[w.ticker] || 1;
              priceFactor = currentPrice / initPrice;
            } else {
              // Fallback for custom or missing assets: estimate based on index and the asset's risk score (beta)
              const assumedBeta = w.riskScore / 5; // e.g. NVDA riskScore 7 is 1.4x beta, Gold is 0.4x beta
              const benchmarkDailyReturn = relativeBenchmark / 100 - 1;
              priceFactor = 1 + (benchmarkDailyReturn * assumedBeta);
            }

            relativePortfolio += w.weight * priceFactor;
          });

          // Portfolio normalized to 100 starting index
          relativePortfolio = relativePortfolio * 100;

          alignedData.push({
            time: timestamp,
            date: dateStr,
            "Mon Portefeuille": parseFloat(relativePortfolio.toFixed(2)),
            "Indice Référence": parseFloat(relativeBenchmark.toFixed(2))
          });
        });

        setChartData(alignedData);

        // Calculate Portfolio & Benchmark Metrics
        if (alignedData.length > 1) {
          const pStart = alignedData[0]["Mon Portefeuille"];
          const pEnd = alignedData[alignedData.length - 1]["Mon Portefeuille"];
          const bStart = alignedData[0]["Indice Référence"];
          const bEnd = alignedData[alignedData.length - 1]["Indice Référence"];

          const portfolioReturn = ((pEnd / pStart) - 1) * 100;
          const benchmarkReturn = ((bEnd / bStart) - 1) * 100;

          // Compute daily returns for volatility, beta, and Sharpe
          const pReturns: number[] = [];
          const bReturns: number[] = [];

          for (let k = 1; k < alignedData.length; k++) {
            const prevP = alignedData[k - 1]["Mon Portefeuille"];
            const currP = alignedData[k]["Mon Portefeuille"];
            const prevB = alignedData[k - 1]["Indice Référence"];
            const currB = alignedData[k]["Indice Référence"];

            if (prevP > 0 && prevB > 0) {
              pReturns.push((currP / prevP) - 1);
              bReturns.push((currB / prevB) - 1);
            }
          }

          // Volatility (annualized standard deviation of returns)
          const pMean = pReturns.reduce((sum, v) => sum + v, 0) / pReturns.length;
          const variance = pReturns.reduce((sum, v) => sum + Math.pow(v - pMean, 2), 0) / (pReturns.length - 1);
          const dailyVol = Math.sqrt(variance);
          const annualizedVolatility = dailyVol * Math.sqrt(252); // 252 trading days/year

          // Beta (Covariance / Variance of Benchmark)
          const bMean = bReturns.reduce((sum, v) => sum + v, 0) / bReturns.length;
          const bVariance = bReturns.reduce((sum, v) => sum + Math.pow(v - bMean, 2), 0) / (bReturns.length - 1);
          
          let covariance = 0;
          for (let m = 0; m < pReturns.length; m++) {
            covariance += (pReturns[m] - pMean) * (bReturns[m] - bMean);
          }
          covariance = covariance / (pReturns.length - 1);

          const beta = bVariance > 0 ? covariance / bVariance : 1.0;

          // Annualized Risk-free rate assumed at 2%
          const riskFreeRate = 0.02;
          const yearsCount = timeframe === "5y" ? 5 : 10;
          const pAnnualizedReturn = Math.pow(pEnd / pStart, 1 / yearsCount) - 1;
          const bAnnualizedReturn = Math.pow(bEnd / bStart, 1 / yearsCount) - 1;

          const sharpe = annualizedVolatility > 0 ? (pAnnualizedReturn - riskFreeRate) / annualizedVolatility : 0;

          // Alpha de Jensen = Annualized Return - [Rf + Beta * (Market Return - Rf)]
          const alpha = pAnnualizedReturn - (riskFreeRate + beta * (bAnnualizedReturn - riskFreeRate));

          // Max Drawdown (Rolling maximum drawdown calculation)
          let maxDrawdown = 0;
          let peak = 0;
          alignedData.forEach(pt => {
            const val = pt["Mon Portefeuille"];
            if (val > peak) peak = val;
            const dd = peak > 0 ? (peak - val) / peak : 0;
            if (dd > maxDrawdown) maxDrawdown = dd;
          });

          setMetrics({
            portfolioReturn,
            benchmarkReturn,
            volatility: annualizedVolatility * 100,
            sharpe,
            beta,
            alpha: alpha * 100,
            maxDrawdown: maxDrawdown * 100
          });
        }
      } catch (err: any) {
        console.error("Backtest failed:", err);
        setError(err.message || "Impossible d'exécuter la simulation financière.");
      } finally {
        setLoading(false);
      }
    }

    runBacktest();
  }, [timeframe, benchmark, positions]);

  if (positions.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 text-center">
        <p className="text-sm font-bold text-slate-400 uppercase">Aucun actif disponible pour le backtesting.</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl border p-5 flex flex-col gap-6",
      isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
    )}>
      {/* Configuration Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
            <BarChart2 size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Backtesting Historique d'Allocation
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Superposition comparative de performance & risque</p>
          </div>
        </div>

        {/* Configuration selectors */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Timeframe */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg">
            {(["5y", "10y"] as Timeframe[]).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all",
                  timeframe === tf
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-500"
                )}
              >
                {tf === "5y" ? "5 ans" : "10 ans"}
              </button>
            ))}
          </div>

          {/* Benchmark Selection */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg">
            {(["urth", "spy"] as Benchmark[]).map(bm => (
              <button
                key={bm}
                onClick={() => setBenchmark(bm)}
                className={cn(
                  "px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all",
                  benchmark === bm
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-500"
                )}
              >
                {bm === "urth" ? "MSCI World" : "S&P 500"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-4 animate-pulse">
          <RefreshCw size={36} className="animate-spin text-blue-600" />
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Calcul du backtest historique...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-600">
          <Info size={16} className="shrink-0 mt-0.5" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Recharts Curve graph on the Left */}
          <div className="lg:col-span-8 flex flex-col gap-3">
             <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-800/10 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor={isDark ? "#fbbf24" : "#2563eb"} stopOpacity={0.2}/>
                       <stop offset="95%" stopColor={isDark ? "#fbbf24" : "#2563eb"} stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15}/>
                       <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#f1f5f9"} />
                   <XAxis dataKey="date" fontSize={9} stroke="#94a3b8" tickLine={false} />
                   <YAxis fontSize={9} stroke="#94a3b8" tickFormatter={(v) => `${v}€`} />
                   <Tooltip formatter={(value: any) => `${value} €`} />
                   <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                   <Area type="monotone" dataKey="Mon Portefeuille" stroke={isDark ? "#fbbf24" : "#2563eb"} strokeWidth={2.5} fillOpacity={1} fill="url(#colorPortfolio)" />
                   <Area type="monotone" dataKey="Indice Référence" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} fillOpacity={1} fill="url(#colorBenchmark)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
             <p className="text-[10px] text-slate-400 font-bold uppercase italic text-center">
               * Performance normalisée à 100€ de capital initial de départ. Les données de trading passées ne préjugent pas des performances futures.
             </p>
          </div>

          {/* Institutional Metrics breakdown on the Right */}
          <div className="lg:col-span-4 flex flex-col gap-4">
             {metrics && (
               <div className="space-y-4">
                 {/* Top Level Comparison Card */}
                 <div className="bg-slate-50 dark:bg-slate-800/10 p-5 rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Surperformance Cumulative</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className={cn(
                        "text-2xl font-black",
                        metrics.portfolioReturn >= metrics.benchmarkReturn ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {metrics.portfolioReturn >= metrics.benchmarkReturn ? "+" : ""}{(metrics.portfolioReturn - metrics.benchmarkReturn).toFixed(1)} %
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">vs Indice</span>
                    </div>
                 </div>

                 {/* Advanced statistics table list */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-4 space-y-3 shadow-inner">
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-2">
                      Ratios Financiers Actuariaires
                    </h5>

                    <div className="space-y-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                      {/* Perf Portefeuille */}
                      <div className="flex items-center justify-between">
                        <span>Performance Portefeuille:</span>
                        <span className="font-extrabold text-slate-950 dark:text-white bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded">
                          +{metrics.portfolioReturn.toFixed(1)}%
                        </span>
                      </div>
                      {/* Perf MSCI/S&P */}
                      <div className="flex items-center justify-between">
                        <span>Performance Indice:</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">
                          +{metrics.benchmarkReturn.toFixed(1)}%
                        </span>
                      </div>
                      {/* Volatility */}
                      <div className="flex items-center justify-between">
                        <span>Volatilité (Ecart-type):</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {metrics.volatility.toFixed(1)}%
                        </span>
                      </div>
                      {/* Sharpe Ratio */}
                      <div className="flex items-center justify-between">
                        <span>Ratio de Sharpe:</span>
                        <span className={cn(
                          "font-extrabold px-1.5 py-0.5 rounded",
                          metrics.sharpe > 1.0 ? "bg-emerald-50 text-emerald-600" : metrics.sharpe > 0.5 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {metrics.sharpe.toFixed(2)}
                        </span>
                      </div>
                      {/* Beta */}
                      <div className="flex items-center justify-between ml-0">
                        <span>Beta (Exposition Marché):</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {metrics.beta.toFixed(2)}
                        </span>
                      </div>
                      {/* Alpha */}
                      <div className="flex items-center justify-between">
                        <span>Alpha de Jensen (Sursortie):</span>
                        <span className={cn("font-extrabold", metrics.alpha >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          {metrics.alpha >= 0 ? "+" : ""}{metrics.alpha.toFixed(2)}%
                        </span>
                      </div>
                      {/* Max Drawdown */}
                      <div className="flex items-center justify-between">
                        <span>Baisse maximale (Drawdown):</span>
                        <span className="font-extrabold text-rose-500">
                          -{metrics.maxDrawdown.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                 </div>

                 {/* Help note on Sharpe */}
                 <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                   <Zap size={15} className="text-blue-600 shrink-0 mt-0.5" />
                   <p className="text-[10px] font-bold text-blue-800 leading-snug uppercase">
                     {metrics.sharpe > 1.0 
                        ? "Excellent ! Ratio de Sharpe supérieur à 1. Votre surperformance compense de manière optimale le niveau de volatilité pris."
                        : "Le niveau de risque absolu est élevé par rapport à l'indice. Une diversification accrue pourrait optimiser le profil rendement/volatilité."}
                   </p>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
