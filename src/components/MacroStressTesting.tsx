import React, { useState } from "react";
import { Position } from "../types";
import { ShieldAlert, Info, TrendingUp, TrendingDown, RefreshCw, Sparkles, Sliders } from "lucide-react";
import { cn } from "../lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

interface Props {
  positions: Position[];
  theme: "investiscope" | "forest" | "cyber" | "minimal";
}

type ShockScenario = "bce_rate" | "oil_inflation" | "geopolitical";

export function MacroStressTesting({ positions, theme }: Props) {
  const [activeScenario, setActiveScenario] = useState<ShockScenario>("bce_rate");
  const isDark = theme === "cyber";

  const totalCurrentValue = positions.reduce((sum, p) => sum + p.currentValue, 0);

  // Define how each position is impacted under each scenario
  const getImpactDetails = (pos: Position, scenario: ShockScenario) => {
    let changePercent = 0;
    const sectorLower = (pos.sector || "").toLowerCase();
    const labelLower = (pos.label || "").toLowerCase();
    
    // Fallback to normal beta calculation based on riskScore
    const normalizedRisk = pos.riskScore || 5;

    switch (scenario) {
      case "bce_rate":
        // Rates impact real estate and tech heavily. Finance benefits.
        if (sectorLower.includes("real estate") || sectorLower.includes("immobilier") || labelLower.includes("reit")) {
          changePercent = -15.0;
        } else if (sectorLower.includes("tech") || sectorLower.includes("technology") || sectorLower.includes("communication")) {
          // Tech is growth, heavily discounted by rate hikes
          changePercent = -10.0 * (normalizedRisk / 5);
        } else if (sectorLower.includes("financial") || sectorLower.includes("finance") || sectorLower.includes("bank") || sectorLower.includes("banque")) {
          // Banks/Finance benefit from net interest margins expansion
          changePercent = +5.0;
        } else if (sectorLower.includes("healthcare") || sectorLower.includes("santé") || sectorLower.includes("defensive")) {
          changePercent = +2.0;
        } else {
          changePercent = -5.0 * (normalizedRisk / 5);
        }
        break;

      case "oil_inflation":
        // Inflation benefits energy/commodities, harms high multiples tech & consumer discretionary
        if (sectorLower.includes("energy") || sectorLower.includes("énergie") || sectorLower.includes("oil") || labelLower.includes("total")) {
          changePercent = +20.0;
        } else if (sectorLower.includes("materials") || sectorLower.includes("matières") || sectorLower.includes("commodities")) {
          changePercent = +12.0;
        } else if (sectorLower.includes("utilities") || sectorLower.includes("services publics")) {
          changePercent = +5.0;
        } else if (sectorLower.includes("tech") || sectorLower.includes("technology")) {
          changePercent = -12.0;
        } else {
          changePercent = -6.0 * (normalizedRisk / 5);
        }
        break;

      case "geopolitical":
        // Heavy risk off shock. Higher beta drop harder. Gold is safe.
        if (labelLower.includes("gold") || labelLower.includes("or") || sectorLower.includes("precious metals") || pos.ticker === "GLDA" || pos.ticker === "GOLD.PA") {
          changePercent = +8.0; // Geopolitical flight to safety in Gold
        } else if (pos.riskScore <= 2) {
          changePercent = -3.5; // Very defensive cash/bond like assets
        } else {
          // Speculative assets sell off sharply
          changePercent = -20.0 * (normalizedRisk / 5);
        }
        break;
    }

    // Calculated fields
    const newPrice = pos.currentPrice * (1 + changePercent / 100);
    const newValue = pos.currentValue * (1 + changePercent / 100);
    const plDelta = newValue - pos.currentValue;

    return {
      changePercent,
      newValue,
      plDelta
    };
  };

  // Compile global portfolio impact
  const detailedPositionsImpact = positions.map(pos => {
    const { changePercent, newValue, plDelta } = getImpactDetails(pos, activeScenario);
    return {
      ...pos,
      changePercent,
      newValue,
      plDelta
    };
  });

  const totalStressedValue = detailedPositionsImpact.reduce((sum, p) => sum + p.newValue, 0);
  const totalDifference = totalStressedValue - totalCurrentValue;
  const portfolioPerformance = totalCurrentValue !== 0 ? (totalDifference / totalCurrentValue) * 100 : 0;

  // Scenario descriptions and metrics
  const scenarioExplanations = {
    bce_rate: {
      title: "Choc de Taux Directeurs BCE (+100 bps)",
      description: "Simulation d'une hausse brutale des taux de la Banque Centrale Européenne de +100 points de base pour contrer l'inflation. Ce scénario pénalise lourdement l'immobilier en impactant directement les conditions de crédit et les taux de capitalisation des SCPI/SIIC, ainsi que la tech à haute croissance en augmentant le taux d'actualisation appliqué aux bénéfices futurs. À l'inverse, le secteur financier en bénéficie via une hausse des marges d'intérêts nettes.",
      riskLevel: "Modéré à Fort",
      colorClass: "bg-amber-500/10 border-amber-500/20 text-amber-500"
    },
    oil_inflation: {
      title: "Choc Pétrolier & Inflation Persistante (+5%)",
      description: "Simulation d'un baril de pétrole Brent qui grimpe au-delà de 110$ suite à des restrictions de production mondiales, entraînant une inflation durable de plus de 5%. Ce choc compresse les marges d'exploitation de la technologie et des biens de consommation à cause d'un bond des coûts énergétiques et de transport. Cependant, les producteurs d'énergie fossile et d'électricité (Engie, TotalEnergies, ETFs Matières Premières) enregistrent des performances exceptionnelles.",
      riskLevel: "Asymétrique",
      colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
    },
    geopolitical: {
      title: "Crise Géopolitique Majeure (Bear Market -20%)",
      description: "Simulation d'une escalade majeure d'un conflit international entraînant un 'flight to safety' global (fuite vers la sécurité). Les investisseurs coupent le risque massivement, ce qui provoque une correction systémique globale des marchés actions d'environ -20%. Les actifs les plus spéculatifs subissent la plus forte purge, tandis que l'Or physique et les valeurs refuges historiques (SCPI sécurisées, obligations souveraines haut de gamme) préservent le capital.",
      riskLevel: "Systémique / Critique",
      colorClass: "bg-rose-500/10 border-rose-500/20 text-rose-500"
    }
  };

  const currentScenario = scenarioExplanations[activeScenario];

  const chartData = [
    { name: "Actuel (Avant Choc)", value: Math.round(totalCurrentValue) },
    { name: "Stressé (Après Choc)", value: Math.round(totalStressedValue) }
  ];

  return (
    <div className={cn(
      "rounded-2xl border p-5 flex flex-col gap-6",
      isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
    )}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-rose-100 text-rose-600 p-2 rounded-xl">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Stress-Testing Macroéconomique Indépendant
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Résistance tactique aux crises et chocs de marché</p>
          </div>
        </div>

        {/* Buttons Selector */}
        <div className="flex flex-wrap gap-2">
          {(["bce_rate", "oil_inflation", "geopolitical"] as ShockScenario[]).map(sc => (
            <button
              key={sc}
              onClick={() => setActiveScenario(sc)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all",
                activeScenario === sc 
                  ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100 dark:shadow-none"
                  : (isDark ? "bg-slate-850 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100")
              )}
            >
              {sc === "bce_rate" ? "Taux BCE +100 bps" : sc === "oil_inflation" ? "Choc Pétrole + Inflation" : "Crise / Bear Market"}
            </button>
          ))}
        </div>
      </div>

      {/* Explanatory Scenario Banner */}
      <div className={cn("p-4 rounded-xl border flex flex-col gap-2 leading-relaxed transition-all", currentScenario.colorClass)}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider">{currentScenario.title}</span>
          <span className="text-[9px] font-black uppercase bg-white/20 px-2 py-0.5 rounded">
            Risque Global : {currentScenario.riskLevel}
          </span>
        </div>
        <p className="text-[11px] font-medium leading-relaxed dark:text-slate-300 text-slate-600">
          {currentScenario.description}
        </p>
      </div>

      {/* Numerical Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Statistics Cards */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Valorisation d'Origine</span>
            <p className="text-lg font-black text-slate-800 dark:text-slate-100">
              {totalCurrentValue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Estimation après Impact</span>
            <p className="text-lg font-black text-slate-800 dark:text-slate-100">
              {totalStressedValue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
          </div>

          <div className={cn(
            "p-4 rounded-xl border flex flex-col justify-center",
            portfolioPerformance >= 0 ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-600" : "bg-rose-500/5 border-rose-500/10 text-rose-500"
          )}>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Impact Scénarisé Net</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black">
                {portfolioPerformance >= 0 ? "+" : ""}{portfolioPerformance.toFixed(2)} %
              </span>
              <span className="text-xs font-bold">
                ({totalDifference >= 0 ? "+" : ""}{totalDifference.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })})
              </span>
            </div>
          </div>
        </div>

        {/* Responsive Recharts Bar Chart */}
        <div className="md:col-span-8 h-[200px] bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#f1f5f9"} />
              <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} />
              <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} />
              <Tooltip formatter={(value: any) => `${value.toLocaleString()} EUR`} />
              <Bar dataKey="value" barSize={55} radius={[6, 6, 0, 0]}>
                <Cell fill={isDark ? "#38bdf8" : "#2563eb"} />
                <Cell fill={portfolioPerformance >= 0 ? "#10b981" : "#ef4444"} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Specific Positions Delta Drilldown */}
      <div className="mt-2">
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 pl-1">Impact par Ligne Individuelle</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
          {detailedPositionsImpact.map(pos => {
            const isUp = pos.changePercent >= 0;
            return (
              <div 
                key={pos.ticker}
                className={cn(
                  "p-3 rounded-lg border flex items-center justify-between text-xs transition-colors",
                  isDark ? "bg-slate-850 border-slate-800" : "bg-slate-50 border-slate-100"
                )}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{pos.label}</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                     Secteur : {pos.sector} • Score Risque : {pos.riskScore}
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <span className={cn(
                    "font-extrabold",
                    isUp ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {isUp ? "+" : ""}{pos.changePercent.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {pos.plDelta >= 0 ? "+" : ""}{pos.plDelta.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Actionability Callout */}
      <div className="flex gap-3 bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-150 dark:border-indigo-950/40">
        <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-[10px] font-bold text-indigo-700/80 leading-snug uppercase">
          Conseil Tactique : {portfolioPerformance < -10 
             ? "Votre allocation présente une vulnérabilité significative à ce scénario. Envisagez d'incorporer des valeurs défensives à beta faible (santé, or ou obligations) pour augmenter la robustesse et réduire le score de risque moyen." 
             : "Félicitations ! Votre allocation fait preuve d'une excellente résilience avec une perte maîtrisée sous la limite d'amortissement de -10%."}
        </p>
      </div>
    </div>
  );
}
