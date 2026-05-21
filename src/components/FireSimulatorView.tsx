import React, { useState, useEffect } from "react";
import { Rocket, Target, TrendingUp, Calendar, Info, ArrowLeft, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { PortfolioSummary } from "../types";

interface FireSimulatorViewProps {
  summary: PortfolioSummary | null;
  theme: string;
  onBack: () => void;
}

export const FireSimulatorView: React.FC<FireSimulatorViewProps> = ({ summary, theme, onBack }) => {
  const isDark = theme === "cyber" || theme === "forest";

  // State for simulator parameters
  const [initialCapital, setInitialCapital] = useState<number>(summary?.totalValue || 0);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(1000);
  const [annualReturn, setAnnualReturn] = useState<number>(7);
  const [targetCapital, setTargetCapital] = useState<number>(600000);
  const [inflationRate, setInflationRate] = useState<number>(2);
  const [withdrawalRate, setWithdrawalRate] = useState<number>(4);
  const [taxRate, setTaxRate] = useState<number>(30); // Flat tax in FR
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [marketCrashYear, setMarketCrashYear] = useState<number>(0);
  const [marketCrashImpact, setMarketCrashImpact] = useState<number>(20);

  // Auto-fill from cashflow if available
  useEffect(() => {
    const savedScenarios = localStorage.getItem("investiscope_scenarios");
    if (savedScenarios) {
      try {
        const scenarios = JSON.parse(savedScenarios);
        const activeId = localStorage.getItem("investiscope_active_scenario");
        const active = scenarios.find((s: any) => s.id === activeId) || scenarios[0];
        
        if (active) {
            const totalIncome = active.incomes.reduce((sum: number, i: any) => sum + i.amount, 0);
            const totalExpenses = active.categories.reduce((sum: number, cat: any) => 
                sum + cat.items.reduce((iSum: number, item: any) => iSum + item.amount, 0), 0
            );
            const surplus = totalIncome - totalExpenses;
            if (surplus > 0) setMonthlyContribution(surplus);
            
            // Suggest target based on Withdrawal Rate (SWR)
            if (totalExpenses > 0) {
                setTargetCapital(totalExpenses * 12 * (100 / withdrawalRate));
            }
        }
      } catch (e) {
        console.error("Failed to load cashflow for FIRE simulator", e);
      }
    }
  }, [withdrawalRate]);

  const calculateTimeToFIRE = () => {
    const r = (annualReturn - inflationRate) / 100 / 12; // Monthly real return
    if (r <= 0) return { months: 0, years: 0, projection: [] };

    let current = initialCapital;
    let months = 0;
    const projection: { month: number; value: number }[] = [{ month: 0, value: current }];

    // Limit to 100 years to prevent infinite loop
    while (current < targetCapital && months < 1200) {
      current = current * (1 + r) + monthlyContribution;
      
      // Simulate market crash
      if (marketCrashYear > 0 && Math.floor(months / 12) === marketCrashYear) {
         current = current * (1 - marketCrashImpact / 100);
      }

      months++;
      if (months % 12 === 0) {
         projection.push({ month: months / 12, value: current });
      }
    }

    const netTarget = targetCapital * (1 + taxRate / 100); // Gross target needed to get net target after tax

    return { 
        months, 
        years: Math.floor(months / 12),
        remainingMonths: months % 12,
        finalValue: current,
        projection,
        fireAge: currentAge + Math.floor(months / 12),
        netAnnualIncome: (targetCapital * (withdrawalRate / 100))
    };
  };

  const results = calculateTimeToFIRE();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={onBack}
          className={cn("flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all", isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")}
        >
          <ArrowLeft size={16} /> Retour Accueil
        </button>
        <div className="flex items-center gap-3">
           <div className="bg-amber-500 p-2 rounded-xl text-black shadow-lg shadow-amber-500/20">
              <Rocket size={24} />
           </div>
           <h2 className={cn("text-3xl font-black tracking-tighter uppercase", isDark ? "text-white" : "text-slate-900")}>Simulateur FIRE</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Parameters Column */}
        <div className="space-y-6">
          <div className={cn("p-8 rounded-[2.5rem] border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
            <h3 className={cn("text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
              <RefreshCw size={16} className="text-amber-500" /> Vos Paramètres
            </h3>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Patrimoine Actuel (€)</label>
                <input 
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Number(e.target.value))}
                  className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black transition-all outline-none focus:ring-2", isDark ? "bg-slate-800 border-slate-700 text-white focus:ring-amber-500/20" : "focus:ring-amber-500/10")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Épargne Mensuelle (€)</label>
                <input 
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black transition-all outline-none focus:ring-2", isDark ? "bg-slate-800 border-slate-700 text-white focus:ring-amber-500/20" : "focus:ring-amber-500/10")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Votre Âge Actuel</label>
                    <input 
                      type="number"
                      value={currentAge}
                      onChange={(e) => setCurrentAge(Number(e.target.value))}
                      className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Retrait (SWR) %</label>
                    <input 
                      type="number"
                      value={withdrawalRate}
                      step="0.1"
                      onChange={(e) => setWithdrawalRate(Number(e.target.value))}
                      className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                    />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rendement (%)</label>
                    <input 
                      type="number"
                      value={annualReturn}
                      onChange={(e) => setAnnualReturn(Number(e.target.value))}
                      className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Inflation (%)</label>
                    <input 
                      type="number"
                      value={inflationRate}
                      onChange={(e) => setInflationRate(Number(e.target.value))}
                      className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                    />
                  </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Objectif de Capital (€)</label>
                <input 
                  type="number"
                  value={targetCapital}
                  onChange={(e) => setTargetCapital(Number(e.target.value))}
                  className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black transition-all outline-none focus:ring-2", isDark ? "bg-slate-800 border-slate-700 text-white focus:ring-amber-500/20" : "focus:ring-amber-500/10")}
                />
                <p className="text-[9px] font-bold text-slate-400 px-1 mt-1 italic">
                  Revenu annuel net estimé: {(results.netAnnualIncome).toLocaleString()} €
                </p>
              </div>

              <div className="p-6 rounded-[2rem] bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20">
                <h4 className="text-[9px] font-black uppercase text-rose-600 mb-4 tracking-widest">Stress Test: Krach Boursier</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black text-rose-400 uppercase">Année du krach</label>
                    <input 
                      type="number"
                      value={marketCrashYear}
                      onChange={(e) => setMarketCrashYear(Number(e.target.value))}
                      className={cn("w-full bg-white/50 border border-rose-100 rounded-xl px-3 py-2 font-black text-xs", isDark ? "bg-slate-800 border-rose-900/30 text-white" : "")}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black text-rose-400 uppercase">Impact (%)</label>
                    <input 
                      type="number"
                      value={marketCrashImpact}
                      onChange={(e) => setMarketCrashImpact(Number(e.target.value))}
                      className={cn("w-full bg-white/50 border border-rose-100 rounded-xl px-3 py-2 font-black text-xs", isDark ? "bg-slate-800 border-rose-900/30 text-white" : "")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="space-y-8">
           <div className={cn("p-8 rounded-[2.5rem] border relative overflow-hidden", isDark ? "bg-slate-900 border-amber-500/10" : "bg-amber-50 border-amber-100 shadow-sm")}>
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-2 block">Temps restant estimé</span>
                <div className="flex items-baseline gap-2">
                   <span className={cn("text-6xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>{results.years}</span>
                   <span className="text-xl font-bold text-slate-500">ans</span>
                   {results.remainingMonths > 0 && (
                     <>
                        <span className={cn("text-4xl font-black tracking-tighter ml-2", isDark ? "text-white" : "text-slate-900")}>{results.remainingMonths}</span>
                        <span className="text-lg font-bold text-slate-500">mois</span>
                     </>
                   )}
                </div>
                <div className="mt-6 p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-amber-200/50 dark:border-amber-800/20 flex flex-col gap-2">
                   <div className="flex items-center gap-3">
                     <Target size={20} className="text-amber-600" />
                     <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Liberté Financière vers vos <span className="font-black text-amber-600 underline decoration-amber-500/30 underline-offset-4">{results.fireAge} ans</span></p>
                   </div>
                   <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (initialCapital / targetCapital) * 100)}%` }} />
                   </div>
                   <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Progression: {Math.round((initialCapital / targetCapital) * 100)}% de l'objectif</p>
                </div>
              </div>
              <Rocket size={120} className="absolute -right-8 -bottom-8 text-amber-500/5 rotate-12" />
           </div>

           <div className={cn("p-8 rounded-[2.5rem] border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
              <h4 className={cn("text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                <TrendingUp size={14} className="text-emerald-500" /> Projection de croissance
              </h4>
              <div className="space-y-4">
                {results.projection.filter((_, i) => i === 0 || i % 5 === 0 || i === results.projection.length - 1).map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Horizon</span>
                       <span className={cn("text-sm font-black", isDark ? "text-slate-200" : "text-slate-700")}>{p.month === 0 ? "Aujourd'hui" : `+ ${p.month} ans`}</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estimation</span>
                       <span className={cn("text-sm font-bold", p.value >= targetCapital ? "text-emerald-500" : (isDark ? "text-slate-300" : "text-slate-600"))}>
                        {p.value.toLocaleString()} €
                       </span>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-900/20 flex gap-4">
              <Info className="text-blue-600 shrink-0" size={20} />
              <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase leading-tight tracking-tight">
                Cette simulation utilise des rendements réels (corrigés de l'inflation). Les performances passées ne préjugent pas des performances futures. Investissez prudemment.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
