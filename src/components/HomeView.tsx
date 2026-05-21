import React from "react";
import { Wallet, Search, TrendingUp, ArrowRight, Zap, Globe, BarChart3, ShieldCheck, PiggyBank, Rocket, Home } from "lucide-react";
import { motion } from "motion/react";
import { PortfolioSummary } from "../types";
import { cn } from "../lib/utils";

interface HomeViewProps {
  summary: PortfolioSummary | null;
  onNavigateModule: (module: "portfolio" | "market" | "cashflow" | "fire" | "realestate") => void;
  theme: "investiscope" | "forest" | "cyber" | "minimal";
}

export const HomeView: React.FC<HomeViewProps> = ({ summary, onNavigateModule, theme }) => {
  const isDark = theme === "cyber" || theme === "forest";

  return (
    <div className={cn("max-w-6xl mx-auto w-full px-4 pt-12 pb-24 transition-colors", theme === "minimal" ? "bg-white" : "")}>
      {/* Global Hero */}
      <div className="text-center mb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-xl",
            theme === "cyber" ? "bg-amber-500 text-black shadow-amber-500/20" : 
            theme === "forest" ? "bg-emerald-900 text-emerald-100 shadow-emerald-900/20" :
            "bg-slate-900 text-white shadow-slate-200"
          )}
        >
          <Globe size={12} className={theme === "investiscope" ? "text-blue-400" : "text-current"} />
          InvestiScope Ecosystem v1.1
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.85] tracking-tighter mb-8"
        >
          Votre centre de <br />
          <span className={cn(
            theme === "investiscope" ? "text-blue-600" :
            theme === "forest" ? "text-emerald-700" :
            theme === "cyber" ? "text-amber-500" :
            "text-zinc-600"
          )}>Commandement Financier</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed"
        >
          Analysez vos investissements personnels ou explorez les marchés mondiaux avec des outils de qualité professionnelle.
        </motion.p>
      </div>

      {/* Module Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Module 1: Patrimoine Financier */}
        <motion.button
          whileHover={{ y: -8, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigateModule("portfolio")}
          className={cn(
            "group relative p-8 md:p-12 rounded-[2.5rem] border shadow-2xl text-left overflow-hidden transition-all",
            theme === "cyber" ? "bg-slate-900 border-amber-500/20 shadow-amber-500/5" : 
            theme === "forest" ? "bg-emerald-50 border-emerald-100 shadow-emerald-900/5" :
            "bg-white border-slate-200 shadow-slate-100"
          )}
        >
          <div className={cn(
            "absolute top-0 right-0 p-12 opacity-[0.03] scale-[4] rotate-12 group-hover:rotate-45 transition-transform duration-700",
            theme === "cyber" ? "text-amber-500" : "text-blue-600"
          )}>
            <Wallet size={100} />
          </div>

          <div className="relative z-10">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl transition-colors",
              theme === "investiscope" ? "bg-blue-600 text-white shadow-blue-200" : 
              theme === "forest" ? "bg-emerald-700 text-white shadow-emerald-700/20" :
              theme === "cyber" ? "bg-amber-500 text-black shadow-amber-500/20" :
              "bg-zinc-800 text-white shadow-zinc-200"
            )}>
              <TrendingUp size={32} />
            </div>
            <h2 className={cn("text-2xl font-black tracking-tighter mb-4", theme === "cyber" ? "text-white" : "text-slate-900")}>Patrimoine Financier</h2>
            <p className={cn("text-base mb-8 leading-relaxed font-medium", theme === "cyber" ? "text-slate-400" : "text-slate-500")}>
              Suivi consolidé de vos portefeuilles (Bourse Direct, Revolut). Analyses de performance et risques.
            </p>
            
            <div className="flex items-center justify-between mt-auto">
              {summary ? (
                <div className={cn("text-sm font-black px-4 py-2 rounded-xl", theme === "cyber" ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-400")}>
                  Valeur : <span className={cn(theme === "cyber" ? "text-amber-500" : "text-blue-600")}>{summary.totalValue.toLocaleString('fr-FR')}€</span>
                </div>
              ) : (
                <div className={cn("text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl", theme === "cyber" ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-400")}>
                  Prêt pour l'import
                </div>
              )}
              <div className={cn(
                "flex items-center gap-2 font-black uppercase text-xs tracking-widest group-hover:gap-4 transition-all",
                theme === "cyber" ? "text-amber-500" : 
                theme === "forest" ? "text-emerald-700" :
                "text-blue-600"
              )}>
                Accéder <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </motion.button>

        {/* Module 2: Bourse & Recherche */}
        <motion.button
          whileHover={{ y: -8, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigateModule("market")}
          className="group relative bg-slate-950 p-8 md:p-12 rounded-[2.5rem] border border-slate-800 shadow-2xl shadow-slate-900 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.05] scale-[4] text-amber-500 -rotate-12 group-hover:-rotate-45 transition-transform duration-700">
            <Search size={100} />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-amber-500 text-black rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-amber-500/20">
              <BarChart3 size={32} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 border border-amber-500/20">
               Stock Intelligence
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter mb-4">Recherche Bourse</h2>
            <p className="text-slate-400 text-base mb-8 leading-relaxed font-medium">
              Consultez n'importe quel actif mondial. Données fondamentales et rapport IA stratégique.
            </p>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="text-[10px] items-center gap-2 flex font-black text-slate-500 uppercase tracking-widest">
                <Zap size={14} className="text-amber-500" /> Yahoo Finance
              </div>
              <div className="flex items-center gap-2 text-white font-black uppercase text-xs tracking-widest group-hover:gap-4 transition-all">
                Explorer <ArrowRight size={16} className="text-amber-500" />
              </div>
            </div>
          </div>
        </motion.button>

        {/* Module 3: Cashflow Management */}
        <motion.button
          whileHover={{ y: -8, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigateModule("cashflow")}
          className={cn(
            "group relative p-8 md:p-12 rounded-[2.5rem] border shadow-2xl text-left overflow-hidden transition-all",
            theme === "cyber" ? "bg-slate-900 border-blue-500/20 shadow-blue-500/5" : 
            theme === "forest" ? "bg-blue-50 border-blue-100 shadow-blue-900/5" :
            "bg-blue-50 border-blue-100 shadow-blue-100"
          )}
        >
          <div className={cn(
            "absolute top-0 right-0 p-12 opacity-[0.03] scale-[4] rotate-12 group-hover:rotate-45 transition-transform duration-700",
            "text-blue-600"
          )}>
            <PiggyBank size={100} />
          </div>

          <div className="relative z-10">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl transition-colors bg-blue-600 text-white shadow-blue-200"
            )}>
              <PiggyBank size={32} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/10 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 border border-blue-600/20">
               Budget & Cashflow
            </div>
            <h2 className={cn("text-2xl font-black tracking-tighter mb-4", theme === "cyber" ? "text-white" : "text-slate-900")}>Gestion de Cashflow</h2>
            <p className={cn("text-base mb-8 leading-relaxed font-medium", theme === "cyber" ? "text-slate-400" : "text-slate-500")}>
              Visualisez vos entrées, sorties et votre budget mensuel avec un diagramme de Sankey interactif.
            </p>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="text-[10px] items-center gap-2 flex font-black text-slate-500 uppercase tracking-widest">
                Planification Financière
              </div>
              <div className={cn(
                "flex items-center gap-2 font-black uppercase text-xs tracking-widest group-hover:gap-4 transition-all text-blue-600"
              )}>
                Lancer <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </motion.button>

        {/* Module 4: FIRE Simulator */}
        <motion.button
          whileHover={{ y: -8, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigateModule("fire")}
          className={cn(
            "group relative p-8 md:p-12 rounded-[2.5rem] border shadow-2xl text-left overflow-hidden transition-all",
            theme === "cyber" ? "bg-slate-900 border-amber-500/20 shadow-amber-500/5" : 
            "bg-amber-50/50 border-amber-100 shadow-amber-100/20"
          )}
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-[4] rotate-12 group-hover:rotate-45 transition-transform duration-700 text-amber-600">
            <Rocket size={100} />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-amber-500 text-black rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-amber-500/20">
              <Rocket size={32} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 border border-amber-500/20">
               Projection FIRE
            </div>
            <h2 className={cn("text-2xl font-black tracking-tighter mb-4", theme === "cyber" ? "text-white" : "text-slate-900")}>Liberté Financière</h2>
            <p className={cn("text-base mb-8 leading-relaxed font-medium", theme === "cyber" ? "text-slate-400" : "text-slate-500")}>
              Simulez quand vous atteindrez votre indépendance financière en fonction de votre épargne.
            </p>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="text-[10px] items-center gap-2 flex font-black text-slate-500 uppercase tracking-widest">
                Objectif Retraite
              </div>
              <div className="flex items-center gap-2 text-amber-600 font-black uppercase text-xs tracking-widest group-hover:gap-4 transition-all">
                Calculer <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </motion.button>

        {/* Module 5: Real Estate Simulator */}
        <motion.button
          whileHover={{ y: -8, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigateModule("realestate")}
          className={cn(
            "group relative p-8 md:p-12 rounded-[2.5rem] border shadow-2xl text-left overflow-hidden transition-all",
            theme === "cyber" ? "bg-slate-900 border-emerald-500/20 shadow-emerald-500/5" : 
            "bg-emerald-50/50 border-emerald-100 shadow-emerald-100/20"
          )}
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-[4] rotate-12 group-hover:rotate-45 transition-transform duration-700 text-emerald-600">
            <Home size={100} />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-600/20">
              <Home size={32} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 border border-emerald-500/20">
               Investissement Locatif
            </div>
            <h2 className={cn("text-2xl font-black tracking-tighter mb-4", theme === "cyber" ? "text-white" : "text-slate-900")}>Achat Immobilier</h2>
            <p className={cn("text-base mb-8 leading-relaxed font-medium", theme === "cyber" ? "text-slate-400" : "text-slate-500")}>
              Simulez l'impact d'un crédit immobilier et d'un investissement sur votre patrimoine global.
            </p>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="text-[10px] items-center gap-2 flex font-black text-slate-500 uppercase tracking-widest">
                Scénario Immobilier
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-xs tracking-widest group-hover:gap-4 transition-all">
                Simuler <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Trust Badges */}
      <div className="mt-24 flex flex-wrap justify-center gap-12 grayscale opacity-40">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldCheck size={20} />
          Zero-Data Collection
        </div>
        <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-widest text-xs">
          Open Source Logic
        </div>
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Globe size={20} />
          Universal Support
        </div>
      </div>
    </div>
  );
};


