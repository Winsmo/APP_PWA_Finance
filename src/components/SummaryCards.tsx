import React, { useState } from "react";
import { PortfolioSummary, Position } from "../types";
import { cn } from "../lib/utils";
import { Info, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MetricProps {
  label: string;
  value: string;
  colorClass?: string;
  bgWhite?: boolean;
  onClick: () => void;
  isActive: boolean;
  key?: string;
}

const EXPLANATIONS: Record<string, { desc: string, formula: string }> = {
  "Valeur Totale (Actifs)": {
    desc: "Valeur marchande actuelle de l'ensemble de vos positions ouvertes (les actifs que vous possédez encore).",
    formula: "Σ (Quantité détenue × Prix actuel du marché)"
  },
  "+/- Val Latente (Non-réalisée)": {
    desc: "Profit ou perte virtuel calculé sur vos titres en portefeuille. Ce gain n'est encaissé qu'au moment de la vente.",
    formula: "Valeur Actuelle - Prix de Revient Unitaire (Total)"
  },
  "+/- Val Réalisée (Ventes)": {
    desc: "Bénéfices ou pertes cumulés suite à la clôture (vente) de positions. C'est de l'argent réel encaissé.",
    formula: "Σ (Prix de Vente - Prix d'Achat) × Quantité vendue"
  },
  "Dividendes (Perçus)": {
    desc: "Revenus passifs versés directement sur votre compte par les sociétés dont vous êtes actionnaire.",
    formula: "Somme de tous les dividendes nets encaissés"
  },
  "Frais (Gestion)": {
    desc: "Coûts opérationnels prélevés par votre courtier ou liés à la gestion de vos actifs.",
    formula: "Frais de courtage + Frais de garde + Frais de gestion"
  },
  "Total P&L (L+V+D-F)": {
    desc: "La performance finale absolue de votre investissement. C'est l'indicateur de votre richesse réelle créée.",
    formula: "Plus-value Latente + Plus-value Réalisée + Dividendes - Frais"
  },
  "Perf. Latente (Actif)": {
    desc: "Efficacité de vos investissements actuels. Indique en % si vos lignes en cours sont globalement gagnantes.",
    formula: "(Total Latent / Capital Actuellement Investi) × 100"
  },
  "Perf. Globale (Globale)": {
    desc: "Rendement global historique incluant tous les flux (achats, ventes, dividendes, frais).",
    formula: "(Profit Total / Capital Total Déployé Historiquement) × 100"
  },
  "Meilleure Ligne": {
    desc: "L'actif de votre portefeuille actuel qui présente le plus haut taux de rentabilité latente.",
    formula: "Max (Gain Latent % par actif)"
  }
};

function Metric({ label, value, colorClass = "text-slate-900", bgWhite = true, onClick, isActive }: MetricProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-3 md:p-4 flex flex-col border-r border-slate-100 md:border-slate-200 last:border-r-0 text-left transition-all relative group overflow-hidden", 
        bgWhite ? "bg-white hover:bg-slate-50" : "bg-slate-50 hover:bg-slate-100",
        isActive && "ring-2 ring-blue-500 ring-inset z-10"
      )}
    >
      <div className="flex justify-between items-start mb-1 md:mb-1.5">
        <span className={cn("text-[8px] md:text-[10px] uppercase tracking-wider font-extrabold truncate pr-2", (colorClass.includes("blue") || colorClass.includes("emerald") || colorClass.includes("rose")) ? colorClass : "text-slate-400")}>{label}</span>
        <Info size={10} className={cn("shrink-0", isActive ? "text-blue-500 opacity-100" : "text-slate-300 opacity-0 md:group-hover:opacity-100")} />
      </div>
      <span className={cn("text-sm md:text-xl font-black truncate", colorClass)}>{value}</span>
    </button>
  );
}

export function SummaryCards({ summary, positions, theme }: { summary: PortfolioSummary, positions: Position[], theme: "investiscope" | "forest" | "cyber" | "minimal" }) {
  const [activeInfo, setActiveInfo] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const isDark = theme === "cyber";
  const accentColor = theme === "cyber" ? "text-amber-500" : theme === "forest" ? "text-emerald-700" : "text-blue-600";
  const accentBg = theme === "cyber" ? "bg-amber-500" : theme === "forest" ? "bg-emerald-700" : "bg-blue-600";
  const accentRing = theme === "cyber" ? "ring-amber-500" : theme === "forest" ? "ring-emerald-500" : "ring-blue-500";

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(val);

  const bestLine = [...positions].sort((a, b) => b.latentPLPercent - a.latentPLPercent)[0];

  const metrics = [
    { label: "Valeur Totale (Actifs)", value: formatCurrency(summary.totalValue) },
    { label: "+/- Val Latente (Non-réalisée)", value: formatCurrency(summary.totalLatentPL), colorClass: summary.totalLatentPL >= 0 ? "text-emerald-500" : "text-rose-500" },
    { label: "+/- Val Réalisée (Ventes)", value: formatCurrency(summary.totalRealizedPL), colorClass: isDark ? "text-slate-400" : "text-slate-600" },
    { label: "Dividendes (Perçus)", value: formatCurrency(summary.totalDividends), colorClass: "text-emerald-500" },
    { label: "Frais (Gestion)", value: formatCurrency(-summary.totalFees), colorClass: "text-rose-500" },
    { label: "Total P&L (L+V+D-F)", value: formatCurrency(summary.totalPL), colorClass: summary.totalPL >= 0 ? "text-emerald-500" : "text-rose-500" },
    { label: "Perf. Latente (Actif)", value: `${summary.latentPerformance.toFixed(2)}%`, colorClass: summary.latentPerformance >= 0 ? "text-emerald-500" : "text-rose-500" },
    { label: "Perf. Globale (Globale)", value: `${summary.globalPerformance.toFixed(2)}%`, colorClass: cn("font-black", accentColor) }
  ];

  const bestLineLabel = "Meilleure Ligne";
  const bestLineValue = bestLine ? `${bestLine.label} (+${bestLine.latentPLPercent.toFixed(1)}%)` : "--";

  function Metric({ label, value, colorClass = isDark ? "text-white" : "text-slate-900", bgWhite = true, onClick, isActive }: MetricProps) {
    return (
      <button 
        onClick={onClick}
        className={cn(
          "p-3 md:p-4 flex flex-col border-r last:border-r-0 text-left transition-all relative group overflow-hidden", 
          isDark 
            ? (bgWhite ? "bg-slate-900 hover:bg-slate-800 border-slate-800" : "bg-slate-800 hover:bg-slate-700 border-slate-700")
            : (bgWhite ? "bg-white hover:bg-slate-50 border-slate-100" : "bg-slate-50 hover:bg-slate-100 border-slate-200"),
          isActive && cn("ring-2 ring-inset z-10", accentRing)
        )}
      >
        <div className="flex justify-between items-start mb-1 md:mb-1.5">
          <span className={cn("text-[8px] md:text-[10px] uppercase tracking-wider font-extrabold truncate pr-2", (colorClass.includes("blue") || colorClass.includes("emerald") || colorClass.includes("rose") || colorClass.includes("amber")) ? colorClass : "text-slate-400")}>{label}</span>
          <Info size={10} className={cn("shrink-0", isActive ? (isDark ? accentColor : accentColor) : "text-slate-300 opacity-0 md:group-hover:opacity-100")} />
        </div>
        <span className={cn("text-sm md:text-xl font-black truncate", colorClass)}>{value}</span>
      </button>
    );
  }

  return (
    <div className={cn("flex flex-col shrink-0 select-none transition-colors", isDark ? "bg-slate-800" : "bg-slate-200")}>
      {/* Mobile Bar View (visible on mobile, hidden on desktop) */}
      <div className={cn("md:hidden flex flex-col border-b transition-colors", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn("flex items-center justify-between p-3 cursor-pointer transition-colors", isDark ? "active:bg-slate-800" : "active:bg-slate-50")}
        >
          <div className="flex gap-4">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Valeur Totale</span>
                <span className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-900")}>{formatCurrency(summary.totalValue)}</span>
             </div>
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total P&L</span>
                <span className={cn("text-sm font-black", summary.totalPL >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {formatCurrency(summary.totalPL)}
                </span>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <span className={cn("text-[9px] font-bold uppercase tracking-widest", accentColor)}>{isExpanded ? "Réduire" : "Détails"}</span>
             {isExpanded ? <ChevronUp size={16} className={accentColor} /> : <ChevronDown size={16} className={accentColor} />}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn("overflow-hidden border-t", isDark ? "bg-slate-800 border-slate-800" : "bg-slate-50 border-slate-100")}
            >
              <div className="grid grid-cols-2">
                {metrics.slice(1).map((m) => (
                  <Metric 
                    key={m.label} 
                    label={m.label} 
                    value={m.value} 
                    colorClass={m.colorClass} 
                    isActive={activeInfo === m.label}
                    onClick={() => setActiveInfo(activeInfo === m.label ? null : m.label)}
                  />
                ))}
                <Metric 
                  label={bestLineLabel} 
                  value={bestLineValue} 
                  colorClass={accentColor} 
                  bgWhite={false} 
                  isActive={activeInfo === bestLineLabel}
                  onClick={() => setActiveInfo(activeInfo === bestLineLabel ? null : bestLineLabel)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop View (visible on desktop) */}
      <div className={cn("hidden md:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 border-b transition-colors", isDark ? "border-slate-800" : "border-slate-200")}>
        {metrics.map((m) => (
          <Metric 
            key={m.label} 
            label={m.label} 
            value={m.value} 
            colorClass={m.colorClass} 
            isActive={activeInfo === m.label}
            onClick={() => setActiveInfo(activeInfo === m.label ? null : m.label)}
          />
        ))}
        <Metric 
          label={bestLineLabel} 
          value={bestLineValue} 
          colorClass={accentColor} 
          bgWhite={false} 
          isActive={activeInfo === bestLineLabel}
          onClick={() => setActiveInfo(activeInfo === bestLineLabel ? null : bestLineLabel)}
        />
      </div>

      <AnimatePresence>
        {activeInfo && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn("text-white overflow-hidden transition-colors", accentBg)}
          >
            <div className="p-4 md:p-6 flex justify-between items-start">
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Info size={14} />
                  {activeInfo}
                </h4>
                <p className="text-sm font-medium mb-3 max-w-2xl text-blue-50 leading-relaxed italic">
                  "{EXPLANATIONS[activeInfo]?.desc}"
                </p>
                <div className="bg-black/20 rounded-lg p-3 inline-block">
                  <span className="text-[10px] uppercase font-bold text-white/60 block mb-1">Formule de calcul</span>
                  <code className="text-xs font-mono font-bold text-white tracking-wide">
                    {EXPLANATIONS[activeInfo]?.formula}
                  </code>
                </div>
              </div>
              <button 
                onClick={() => setActiveInfo(null)}
                className="p-1 hover:bg-black/20 rounded-full transition-colors"
                title="Fermer"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
