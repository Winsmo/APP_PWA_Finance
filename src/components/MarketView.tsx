
import React, { useState, useEffect } from "react";
import { Search, Star, TrendingUp, ChevronRight, Loader2, Bookmark, BookmarkCheck, Info } from "lucide-react";
import { cn } from "../lib/utils";
import { StockDetails } from "./StockDetails";

interface SearchResult {
  symbol: string;
  shortname: string;
  exchDisp: string;
  typeDisp: string;
}

interface Props {
  theme: "investiscope" | "forest" | "cyber" | "minimal";
  favorites: string[];
  onToggleFavorite: (ticker: string) => void;
  preSelectedTicker?: string | null;
  onClearSelection?: () => void;
}

export function MarketView({ theme, favorites, onToggleFavorite, preSelectedTicker, onClearSelection }: Props) {
  const [activeView, setActiveView] = useState<"explore" | "favorites">("explore");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(preSelectedTicker || null);

  useEffect(() => {
    if (preSelectedTicker) {
      setSelectedTicker(preSelectedTicker);
    }
  }, [preSelectedTicker]);

  const handleBack = () => {
    setSelectedTicker(null);
    if (onClearSelection) onClearSelection();
  };

  const isDark = theme === "cyber";
  const accentColor = theme === "cyber" ? "text-amber-500" : theme === "forest" ? "text-emerald-700" : "text-blue-600";
  const accentBg = theme === "cyber" ? "bg-amber-500" : theme === "forest" ? "bg-emerald-700" : "bg-blue-600";
  const accentText = theme === "cyber" ? "text-amber-500" : theme === "forest" ? "text-emerald-700" : "text-blue-600";

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 1) {
        setLoading(true);
        setActiveView("explore"); // Switch to explore when searching
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          setResults(data.quotes || []);
        } catch (e) {
          console.error("Search failed:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (selectedTicker) {
    return (
      <StockDetails 
        ticker={selectedTicker} 
        theme={theme} 
        onBack={handleBack} 
        isFavorite={favorites.includes(selectedTicker)}
        onToggleFavorite={onToggleFavorite}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className={cn("text-2xl md:text-4xl font-black uppercase tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
            Explorateur <span className={accentColor}>Bourse</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium max-w-2xl">
            Recherchez n'importe quel actif mondial, analysez les performances, consultez les dividendes et suivez vos favoris.
          </p>
        </div>

        <div className={cn(
          "flex p-1 rounded-2xl border transition-all",
          isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
        )}>
          <button 
            onClick={() => { setActiveView("explore"); setQuery(""); }}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all",
              activeView === "explore" 
                ? (isDark ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-white text-slate-900 shadow-xl") 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <TrendingUp size={14} /> Explorer
          </button>
          <button 
            onClick={() => setActiveView("favorites")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all",
              activeView === "favorites" 
                ? (isDark ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-white text-slate-900 shadow-xl") 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Star size={14} className={favorites.length > 0 ? "fill-amber-400 text-amber-400" : ""} /> Favoris
          </button>
        </div>
      </div>

      {activeView === "explore" && (
        <div className="relative group">
          <div className={cn(
            "absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors",
            loading ? accentColor : "text-slate-400 group-focus-within:text-blue-500"
          )}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          </div>
          <input 
            type="text"
            placeholder="Rechercher une action, un ETF ou un Ticker..."
            className={cn(
              "w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none text-lg font-bold",
              isDark 
                ? "bg-slate-900 border-slate-800 text-white placeholder-slate-600 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10" 
                : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            )}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {query.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Résultats de recherche</h3>
          <div className="grid gap-2">
            {results.length > 0 ? results.map((res) => (
              <button 
                key={res.symbol}
                onClick={() => setSelectedTicker(res.symbol)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                  isDark 
                    ? "bg-slate-900/50 border-slate-800 hover:border-amber-500 hover:bg-slate-800" 
                    : "bg-white border-slate-200 hover:border-blue-600 hover:shadow-md"
                )}
              >
                <div className="flex flex-col">
                  <span className={cn("text-sm font-black uppercase", isDark ? "text-white" : "text-slate-900")}>{res.symbol}</span>
                  <span className="text-xs text-slate-500 font-bold line-clamp-1">{res.shortname}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{res.exchDisp}</span>
                    <span className="text-[10px] font-bold text-slate-500">{res.typeDisp}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-current transition-colors" />
                </div>
              </button>
            )) : (
              !loading && <div className="text-center py-12 text-slate-400 font-bold italic">Aucun instrument trouvé pour "{query}"</div>
            )}
          </div>
        </div>
      ) : activeView === "favorites" ? (
        <div className="flex flex-col gap-6 animate-in slide-in-from-left-4 duration-300">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ma Liste de Surveillance</h3>
              <Star size={12} className="text-amber-400 fill-amber-400" />
            </div>
            {favorites.length > 0 ? (
              <div className="grid gap-2">
                {favorites.map((fav) => (
                  <button 
                    key={fav}
                    onClick={() => setSelectedTicker(fav)}
                    className={cn(
                      "flex items-center justify-between p-6 rounded-2xl border transition-all text-left group",
                      isDark 
                        ? "bg-slate-900 border-slate-800 hover:border-amber-500 hover:bg-slate-800" 
                        : "bg-white border-slate-200 hover:border-blue-600 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", isDark ? "bg-slate-800" : "bg-slate-50")}>
                        <TrendingUp size={18} className={accentText} />
                      </div>
                      <span className={cn("text-lg font-black uppercase", isDark ? "text-white" : "text-slate-900")}>{fav}</span>
                    </div>
                    <ChevronRight size={24} className="text-slate-300 group-hover:text-current transition-colors" />
                  </button>
                ))}
              </div>
            ) : (
              <div className={cn(
                "p-12 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center text-center gap-4",
                isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
              )}>
                <Star size={48} className="text-slate-200" />
                <div>
                  <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Liste vide</p>
                  <p className="text-xs font-bold text-slate-400 max-w-[250px] mx-auto mt-1">Vous n'avez pas encore d'actions favorites. Recherchez des actifs pour les ajouter ici.</p>
                </div>
                <button 
                  onClick={() => setActiveView("explore")}
                  className={cn("mt-4 px-6 py-3 text-white rounded-xl font-black uppercase text-xs transition-all", accentBg)}
                >
                  Découvrir des actions
                </button>
              </div>
            )}
        </div>
      ) : (
        <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
          <div className="flex flex-col gap-4 text-left">
             <div className="flex items-center justify-between px-1">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tendances mondiales</h3>
               <TrendingUp size={12} className="text-emerald-500" />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
               {["AAPL", "TSLA", "NVDA", "MC.PA", "AIR.PA", "MSFT", "GOOGL", "AMZN", "META"].map((ticker) => (
                 <button 
                    key={ticker}
                    onClick={() => setSelectedTicker(ticker)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all group",
                      isDark 
                        ? "bg-slate-900/50 border-slate-800 hover:border-amber-500 hover:bg-slate-800" 
                        : "bg-white border-slate-200 hover:border-blue-600 hover:shadow-md"
                    )}
                  >
                    <span className={cn("text-sm font-black uppercase", isDark ? "text-white" : "text-slate-900")}>{ticker}</span>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-current transition-colors" />
                  </button>
               ))}
             </div>
          </div>

          <div className={cn(
            "p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 border",
            isDark ? "bg-slate-900 border-slate-800" : "bg-blue-50/50 border-blue-100"
          )}>
            <div className={cn("p-4 rounded-2xl", isDark ? "bg-amber-500/10" : "bg-blue-500/10")}>
              <Info size={32} className={accentText} />
            </div>
            <div className="max-w-md">
              <h3 className={cn("text-xl font-black uppercase tracking-tighter mb-2", isDark ? "text-white" : "text-slate-900")}>Besoin d'aide ?</h3>
              <p className="text-sm font-medium text-slate-500">
                L'explorateur utilise les données en temps réel de Yahoo Finance. Si vous ne trouvez pas un ticker, essayez d'ajouter l'extension de place boursière (ex: .PA pour Paris, .DE pour Francfort).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
