import React, { useEffect, useState, useMemo, useRef } from "react";
import { Position } from "../types";
import { TICKER_MAP } from "../lib/portfolio-utils";
import { 
  Loader2, 
  Calendar, 
  Newspaper, 
  ExternalLink, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  ChevronRight 
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface Event {
  ticker: string;
  type: "Dividend" | "Earnings" | "AGM" | "Other";
  date: string;
  description: string;
  source?: string;
}

interface NewsArticle {
  ticker: string;
  title: string;
  snippet: string;
  date: string;
  link: string;
  source: string;
}

interface NewsData {
  events: Event[];
  articles: NewsArticle[];
}

export function NewsView({ positions, activeTab }: { positions: Position[], activeTab: string }) {
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const lastFetchedTickers = useRef<string>("");

  const tickers = useMemo(() => {
    return Array.from(new Set(positions.map(p => {
      // Prioritize TICKER_MAP
      if (TICKER_MAP[p.label]) return TICKER_MAP[p.label];
      // If ticker is provided and not UNKNOWN, use it
      if (p.ticker && p.ticker !== "UNKNOWN") return p.ticker;
      // If label looks like a ticker, use it
      if (p.label.includes(".") || (p.label.length <= 5 && !p.label.includes(" "))) return p.label.toUpperCase();
      return "UNKNOWN";
    }))).filter(t => t !== "UNKNOWN");
  }, [positions]);

  const fetchArticles = async (force = false) => {
    if (!force && articles.length > 0) return;
    setLoadingArticles(true);
    try {
      const response = await fetch(`/api/news?symbols=${tickers.join(",")}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles || []);
      }
    } catch (e) {
      console.error("Articles fetch error", e);
    } finally {
      setLoadingArticles(false);
    }
  };

  const fetchEvents = async (force = false) => {
    if (!force && events.length > 0) return;
    setLoadingEvents(true);
    setError(null);
    try {
      const response = await fetch(`/api/calendar?symbols=${tickers.join(",")}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        throw new Error("Erreur serveur calendrier");
      }
    } catch (e) {
      console.error("Events fetch error", e);
      setError("Impossible de charger les événements financiers. Réessayez plus tard.");
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    // Only fetch when on the News tab
    if (activeTab !== "news") return;
    
    // Only fetch if tickers have actually changed content since last fetch
    const tickerStr = tickers.join(",");
    if (tickerStr === lastFetchedTickers.current && articles.length > 0) {
      setLoadingArticles(false);
      setLoadingEvents(false);
      return;
    }

    if (tickers.length === 0) {
      setLoadingArticles(false);
      setLoadingEvents(false);
      return;
    }

    lastFetchedTickers.current = tickers.join(",");
    fetchArticles();
    fetchEvents();
  }, [tickers, activeTab]);

  const handleRefresh = () => {
    fetchArticles(true);
    fetchEvents(true);
  };

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
  };

  if (selectedArticle) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[600px] flex flex-col"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <button 
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-black uppercase text-[10px] tracking-widest"
          >
            <ArrowLeft size={16} />
            Retour aux actualités
          </button>
          <a 
            href={selectedArticle.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-[10px] uppercase tracking-widest"
          >
            Lien Source <ExternalLink size={12} />
          </a>
        </div>

        <div className="p-6 md:p-10 flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-black text-xs uppercase tracking-widest">
                {selectedArticle.ticker}
              </span>
              <span className="text-slate-400 font-bold text-xs uppercase italic">
                {selectedArticle.source} • {new Date(selectedArticle.date).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-8">
              {selectedArticle.title}
            </h1>

            <div className="mb-10 p-8 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-700 font-medium leading-relaxed text-lg italic">
                "{selectedArticle.snippet}"
              </p>
            </div>

            <div className="flex flex-col items-center justify-center py-12 px-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <ExternalLink size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-slate-900 font-bold mb-1 italic">Consultez l'article complet sur {selectedArticle.source}</p>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">L'actualité complète est disponible directement sur le site de l'éditeur pour une information exhaustive.</p>
              </div>
              <a 
                href={selectedArticle.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
              >
                Ouvrir l'article source <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (tickers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Newspaper className="mx-auto text-slate-300 mb-4" size={48} />
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Aucune position active</h3>
        <p className="text-slate-500 text-sm mt-2">Ajoutez des actions pour voir leurs actualités et événements.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Newspaper size={18} className="text-blue-600" />
          Veille Concurrentielle & Finanças
        </h3>
        <button 
          onClick={handleRefresh}
          disabled={loadingArticles || loadingEvents}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loadingArticles || loadingEvents ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
          Rafraîchir les flux
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* EVENTS SECTION */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              Prochains Événements
            </h4>
          </div>

          <div className="flex flex-col gap-3 min-h-[400px]">
            {loadingEvents ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 text-center gap-3">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Recherche d'événements...</span>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 text-center gap-3">
                <AlertCircle className="text-rose-500" size={32} />
                <p className="text-[10px] font-bold text-slate-500 uppercase px-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 text-[9px] font-black text-blue-600 uppercase underline underline-offset-2"
                >
                  Réessayer
                </button>
              </div>
            ) : events.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 text-center">
                <Calendar size={32} className="text-slate-200 mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Aucun événement identifié</p>
                <p className="text-[9px] text-slate-400 mt-1 italic">Vérifiez vos tickers ou réessayez</p>
              </div>
            ) : (
              events.map((event, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={i} 
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black text-slate-600 rounded-md uppercase tracking-tight">
                      {event.ticker}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                      event.type === "Dividend" ? "bg-emerald-100 text-emerald-700" :
                      event.type === "Earnings" ? "bg-blue-100 text-blue-700" :
                      event.type === "AGM" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {event.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-xs font-black text-slate-900">{event.date}</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 leading-normal">{event.description}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* ARTICLES SECTION */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Newspaper size={16} className="text-blue-600" />
              Actualités Récentes
            </h4>
          </div>

          <div className="flex flex-col gap-4 min-h-[400px]">
            {loadingArticles ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 text-center gap-3">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Consultation des articles...</span>
              </div>
            ) : articles.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 text-center">
                <Newspaper size={32} className="text-slate-200 mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Aucun article récent trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map((article, i) => (
                  <motion.div
                    onClick={() => handleArticleClick(article)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 + 0.2 }}
                    key={i}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group flex flex-col h-full cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-[10px] font-black text-blue-600 rounded-md uppercase tracking-tight">
                        {article.ticker}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase italic">
                        {article.source}
                      </span>
                    </div>
                    <h5 className="text-sm font-black text-slate-800 leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {article.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-3 mb-4 font-medium leading-relaxed">
                      {article.snippet}
                    </p>
                    <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {new Date(article.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        Lire <ChevronRight size={12} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
