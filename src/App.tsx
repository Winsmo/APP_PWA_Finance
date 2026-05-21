import { useState, useEffect, useCallback } from "react";
import { SummaryCards } from "./components/SummaryCards";
import { PortfolioCharts } from "./components/PortfolioCharts";
import { PositionTable } from "./components/PositionTable";
import { FileUpload } from "./components/FileUpload";
import { AssetsView } from "./components/AssetsView";
import { HistoryView } from "./components/HistoryView";
import { DividendsView } from "./components/DividendsView";
import { NewsView } from "./components/NewsView";
import { parseCSV, calculatePortfolio, TICKER_MAP, deduplicateTransactions, getTicker } from "./lib/portfolio-utils";
import { Position, PortfolioSummary, Transaction, Quote } from "./types";
import { fetchRiskData, AssetRiskInfo } from "./services/riskService";
import { LayoutDashboard, Coins, History, Landmark, TrendingUp, Database, ShieldAlert, ShieldCheck, Home, Settings, Search, RefreshCw, Download } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "./lib/utils";
import { HomeView } from "./components/HomeView";
import { SettingsView } from "./components/SettingsView";
import { MarketView } from "./components/MarketView";
import { CashflowView } from "./components/CashflowView";
import { FireSimulatorView } from "./components/FireSimulatorView";
import { RealEstateSimulatorView } from "./components/RealEstateSimulatorView";
import { BacktestAllocation } from "./components/BacktestAllocation";
import { PWAInstallOverlay } from "./components/PWAInstallOverlay";

export default function App() {
  const [showPWAInstallPrompt, setShowPWAInstallPrompt] = useState(false);
  const [currentModule, setCurrentModule] = useState<"home" | "portfolio" | "market" | "cashflow" | "fire" | "realestate">("home");
  const [activeTab, setActiveTab] = useState<"dashboard" | "assets" | "history" | "dividends" | "news" | "input" | "settings">("dashboard");
  const [dashboardView, setDashboardView] = useState<"standard" | "backtest">("standard");
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("investiscope_favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [theme, setTheme] = useState<"investiscope" | "forest" | "cyber" | "minimal">(() => {
    const saved = localStorage.getItem("investiscope_theme");
    return (saved as any) || "investiscope";
  });
  const [selectedMarketTicker, setSelectedMarketTicker] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("investiscope_transactions");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPrices, setCurrentPrices] = useState<Record<string, Quote>>({});
  const [isTickerPaused, setIsTickerPaused] = useState(false);
  const [portfolio, setPortfolio] = useState<{ positions: Position[], closedPositions: Position[], summary: PortfolioSummary } | null>(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = localStorage.getItem("investiscope_refresh_interval");
    return saved ? parseInt(saved) : 30;
  });
  const [riskData, setRiskData] = useState<Record<string, AssetRiskInfo>>(() => {
    const saved = localStorage.getItem("investiscope_risk_data");
    return saved ? JSON.parse(saved) : {};
  });
  const [loadingRisk, setLoadingRisk] = useState(false);

  // Synchroniser les transactions avec le stockage local
  useEffect(() => {
    localStorage.setItem("investiscope_transactions", JSON.stringify(transactions));
  }, [transactions]);

  const fetchPrices = useCallback(async (tickers: string[]) => {
    if (tickers.length === 0) return;
    setLoadingPrices(true);
    try {
      const response = await fetch(`/api/quotes?symbols=${tickers.join(",")}`);
      if (!response.ok) throw new Error("API limit or error");
      const data = await response.json();
      setCurrentPrices(prev => ({ ...prev, ...data }));
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch prices", e);
    } finally {
      setLoadingPrices(false);
    }
  }, []);

  // Auto-refresh prices every refreshInterval seconds
  useEffect(() => {
    const getTickersForRefresh = () => {
      const usedTickers = transactions.map(tx => tx.ticker || getTicker(tx.label)).filter(t => t !== "UNKNOWN");
      return Array.from(new Set([...usedTickers]));
    };

    const allTickers = getTickersForRefresh();
    if (allTickers.length > 0) {
      fetchPrices(allTickers);
    }

    const interval = setInterval(() => {
      if (document.hidden || isTickerPaused) return;
      const tickers = getTickersForRefresh();
      if (tickers.length > 0) {
        fetchPrices(tickers);
      }
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [transactions, fetchPrices, refreshInterval, isTickerPaused]);

  useEffect(() => {
    const result = calculatePortfolio(transactions, currentPrices, riskData);
    setPortfolio(result);
  }, [transactions, currentPrices, riskData]);

  // Fetch Risk Data when new tickers are detected
  useEffect(() => {
    const tickers = Array.from(new Set(
      transactions.map(tx => tx.ticker || getTicker(tx.label))
    )).filter(t => t && t !== "UNKNOWN" && !riskData[t]) as string[];

    if (tickers.length > 0 && !loadingRisk) {
      const fetchRisk = async () => {
        setLoadingRisk(true);
        try {
          // Fetch only new tickers
          const data = await fetchRiskData(tickers);
          if (Object.keys(data).length > 0) {
            setRiskData(prev => {
              const next = { ...prev, ...data };
              localStorage.setItem("investiscope_risk_data", JSON.stringify(next));
              return next;
            });
          } else {
             // If no data returned, avoid immediate retry by marking them as "tried" 
             // but for now we'll just stop loading
          }
        } catch (e) {
          console.error("Failed to fetch risk data", e);
        } finally {
          setLoadingRisk(false);
        }
      };
      
      // Add a small delay to debounce
      const timer = setTimeout(fetchRisk, 1000);
      return () => clearTimeout(timer);
    }
  }, [transactions, riskData, loadingRisk]);

  const handleFileUpload = (data: string) => {
    const newTx = parseCSV(data);
    // Deduplicate against existing transactions based on date, label, qty and operation
    setTransactions(prev => deduplicateTransactions([...prev, ...newTx]));
    const tickers = newTx.map(tx => tx.ticker || getTicker(tx.label)).filter(t => t !== "UNKNOWN");
    fetchPrices(tickers);
    setActiveTab("dashboard");
    setCurrentModule("portfolio");
  };

  const handleManualAdd = (csvLine: string) => {
    const header = "libellé;Opération;Place;Date;Qté;Prix d'éxé;Montant brut;Courtage/Prélèvement;Montant net;Devise;\n";
    const transactionsFromCSV = parseCSV(header + csvLine);
    if (transactionsFromCSV.length > 0) {
      setTransactions(prev => [...prev, ...transactionsFromCSV]);
    }
  };

  const updateTransaction = (index: number, updatedTx: Transaction) => {
    setTransactions(prev => {
      const next = [...prev];
      next[index] = updatedTx;
      return next;
    });
  };

  const deleteTransaction = (index: number) => {
    setTransactions(prev => prev.filter((_, i) => i !== index));
  };

  const handleResetData = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer TOUTES les données (transactions, historique, dividendes) ? Cette action est irréversible.")) {
      setTransactions([]);
      localStorage.removeItem("investiscope_transactions"); 
    }
  };

  const handleRefreshIntervalChange = (val: number) => {
    setRefreshInterval(val);
    localStorage.setItem("investiscope_refresh_interval", val.toString());
  };

  const handleThemeChange = (newTheme: "investiscope" | "forest" | "cyber" | "minimal") => {
    setTheme(newTheme);
    localStorage.setItem("investiscope_theme", newTheme);
  };

  const handleToggleFavorite = (ticker: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(ticker);
      const next = isFav ? prev.filter(t => t !== ticker) : [...prev, ticker];
      localStorage.setItem("investiscope_favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleNavigateToMarketAsset = (ticker: string) => {
    setSelectedMarketTicker(ticker);
    setCurrentModule("market");
  };

  // Theme-aware styles mapping
  const themeStyles = {
    investiscope: {
      primary: "bg-slate-900",
      primaryText: "text-slate-900",
      accent: "bg-blue-600",
      accentText: "text-blue-600",
      accentBg: "bg-blue-50",
      accentBorder: "border-blue-100",
      headerIcon: "bg-slate-900 text-white",
      sidebarActive: "bg-blue-50 text-blue-700 shadow-sm",
      button: "bg-slate-900 hover:bg-blue-600",
      footer: "bg-slate-900"
    },
    forest: {
      primary: "bg-emerald-950",
      primaryText: "text-emerald-950",
      accent: "bg-emerald-600",
      accentText: "text-emerald-600",
      accentBg: "bg-emerald-50",
      accentBorder: "border-emerald-100",
      headerIcon: "bg-emerald-950 text-white",
      sidebarActive: "bg-emerald-50 text-emerald-700 shadow-sm",
      button: "bg-emerald-900 hover:bg-emerald-600",
      footer: "bg-emerald-950"
    },
    cyber: {
      primary: "bg-slate-950",
      primaryText: "text-slate-950",
      accent: "bg-amber-500",
      accentText: "text-amber-500",
      accentBg: "bg-amber-500/10",
      accentBorder: "border-amber-500/20",
      headerIcon: "bg-amber-500 text-slate-950",
      sidebarActive: "bg-amber-500/10 text-amber-500 shadow-sm",
      button: "bg-slate-900 hover:bg-amber-500 group-hover:text-black",
      footer: "bg-slate-950"
    },
    minimal: {
      primary: "bg-zinc-100",
      primaryText: "text-zinc-800",
      accent: "bg-zinc-800",
      accentText: "text-zinc-800",
      accentBg: "bg-zinc-100",
      accentBorder: "border-zinc-200",
      headerIcon: "bg-zinc-800 text-white",
      sidebarActive: "bg-zinc-200 text-zinc-900 shadow-sm",
      button: "bg-zinc-800 hover:bg-zinc-600",
      footer: "bg-zinc-100 text-zinc-600"
    }
  };

  const s = themeStyles[theme];

  return (
    <div className={cn("h-[100dvh] flex flex-col overflow-hidden relative pb-16 md:pb-0", theme === "minimal" ? "bg-white" : "bg-slate-50")}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentModule("home")}
            className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity"
          >
            <div className={cn("w-7 h-7 md:w-8 md:h-8 rounded flex items-center justify-center font-black text-sm md:text-base italic shadow-lg", s.headerIcon)}>P</div>
            <h1 className="text-lg md:text-xl font-black tracking-tighter text-slate-800">
              InvestiScope <span className={cn("hidden sm:inline text-[10px] font-black ml-1 uppercase tracking-widest italic px-1.5 py-0.5 rounded", s.accentText, s.accentBg)}>Pro</span>
            </h1>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          <button 
            onClick={() => setCurrentModule("home")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all group hidden sm:flex",
              currentModule === "home" ? cn(s.primary, "text-white shadow-xl shadow-slate-200") : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Home size={14} className={cn("transition-transform group-hover:scale-110", currentModule === "home" ? (theme === "cyber" ? "text-amber-400" : "text-blue-400") : "")} />
            <span className="uppercase tracking-tighter">Accueil</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {loadingPrices && (
            <div className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-lg text-[9px] font-black animate-pulse border hidden sm:flex",
              theme === "cyber" ? "text-amber-500 bg-amber-500/5 border-amber-500/20" : "text-blue-600 bg-blue-50 border-blue-100"
            )}>
              <RefreshCw size={10} className="animate-spin" />
              <span className="uppercase tracking-tighter">Sync</span>
            </div>
          )}
          <button 
            onClick={() => {
              setCurrentModule("portfolio");
              setActiveTab("settings");
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all group hidden sm:flex",
              activeTab === "settings" ? cn(s.primary, "text-white shadow-xl shadow-slate-200") : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Settings size={14} className={cn("transition-transform group-hover:rotate-90", activeTab === "settings" ? (theme === "cyber" ? "text-amber-400" : "text-blue-400") : "text-slate-400")} />
            <span className="uppercase tracking-tighter">Paramètres</span>
          </button>
        </div>
      </header>

      {/* Market Ticker beneath Header - Only in Portfolio, now placed under the Header to prevent viewport occlusion on mobile */}
      {currentModule === "portfolio" && portfolio && portfolio.positions.length > 0 && (
        <div 
          className={cn("text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[10px] h-8 flex items-center shrink-0 overflow-hidden relative cursor-pointer group", s.footer)}
          onClick={() => setIsTickerPaused(!isTickerPaused)}
        >
          <div className={cn("absolute inset-y-0 left-0 w-12 bg-gradient-to-r z-20", theme === "cyber" ? "from-black to-transparent" : "from-slate-900 to-transparent")} />
          <div className={cn("absolute inset-y-0 right-0 w-12 bg-gradient-to-l z-20", theme === "cyber" ? "from-black to-transparent" : "from-slate-900 to-transparent")} />
          
          <div className={cn("flex items-center gap-1.5 absolute left-4 z-30 pr-3 pointer-events-none", s.footer)}>
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]", theme === "cyber" ? "bg-amber-500 shadow-amber-500/50" : "bg-blue-500")}></span>
            <span className={cn("text-[8px] font-black uppercase tracking-tighter", theme === "cyber" ? "text-amber-500" : "text-blue-400")}>Live</span>
          </div>

          <motion.div 
            className="flex items-center whitespace-nowrap min-w-full"
            animate={{
              x: isTickerPaused ? undefined : ["0%", "-50%"],
            }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[1, 2].map((iteration) => (
              <div key={`track-${iteration}`} className="flex items-center gap-10 pr-10">
                {portfolio?.positions
                  .filter(p => currentPrices[p.ticker])
                  .map((pos) => {
                    const quote = currentPrices[pos.ticker] as Quote;
                    const change = quote.price - quote.prevClose;
                    const changePercent = (change / quote.prevClose) * 100;
                    const isUp = change >= 0;
                    const dailyGainValue = pos.quantity * change;

                    return (
                      <div key={`${iteration}-${pos.ticker}`} className="flex items-center gap-2">
                        <span className="text-white font-black tracking-tight">{pos.ticker}</span> 
                        <span className="text-slate-300 font-mono tracking-tighter">{quote.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className={cn(
                          "font-black px-1 rounded-[2px] text-[9px]", 
                          isUp ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {isUp ? "+" : ""}{changePercent.toFixed(2)}%
                          <span className="ml-1.5 opacity-60 font-medium">
                            ({isUp ? "+" : ""}{dailyGainValue.toFixed(2)}€)
                          </span>
                        </span>
                      </div>
                    );
                  })}
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="text-[9px] font-bold uppercase tracking-widest">{isTickerPaused ? "[ CLIQUEZ POUR LIRE ]" : "[ CLIQUEZ POUR FIGER ]"}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Global Metrics Bar - Only in Portfolio */}
      <div className="overflow-x-auto no-scrollbar bg-white border-b border-slate-100 shrink-0">
        {currentModule === "portfolio" && portfolio && portfolio.positions.length > 0 && <SummaryCards summary={portfolio.summary} positions={portfolio.positions} theme={theme} />}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar - Desktop - Only in Portfolio */}
        {currentModule === "portfolio" && (
          <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 p-5 flex-col shrink-0">
          <nav className="flex flex-col gap-1 mb-6">
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === "dashboard" ? s.sidebarActive : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <LayoutDashboard size={16} />
              Analyses
            </button>
            <button 
              onClick={() => setActiveTab("assets")}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === "assets" ? s.sidebarActive : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Coins size={16} />
              Mes Actifs
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === "history" ? s.sidebarActive : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <History size={16} />
              Historique
            </button>
            <button 
              onClick={() => setActiveTab("dividends")}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === "dividends" ? (theme === "forest" ? "bg-emerald-100 text-emerald-800" : "bg-emerald-50 text-emerald-700 shadow-sm") : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <TrendingUp size={16} />
              Dividendes
            </button>
            <button 
              onClick={() => setActiveTab("news")}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === "news" ? (theme === "cyber" ? "bg-amber-100 text-amber-900" : "bg-amber-50 text-amber-700 shadow-sm") : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <TrendingUp size={16} className="rotate-90" />
              Actualités & Événements
            </button>
            <button 
              onClick={() => setActiveTab("input")}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === "input" ? s.sidebarActive : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Database size={16} />
              Insérer données
            </button>
          </nav>

          <section className="mt-auto">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-[10px] text-blue-700 font-semibold uppercase tracking-wider">Note</p>
              <p className="text-[11px] text-blue-900 mt-1 leading-relaxed">
                Les prix sont récupérés via Yahoo Finance.
              </p>
            </div>
          </section>
        </aside>
      )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-100 pb-24 md:pb-6 scroll-smooth">
          {currentModule === "home" ? (
            <HomeView 
              summary={portfolio?.summary || null} 
              onNavigateModule={(mod) => setCurrentModule(mod)} 
              theme={theme}
            />
          ) : currentModule === "fire" ? (
             <FireSimulatorView 
               summary={portfolio?.summary || null} 
               theme={theme} 
               onBack={() => setCurrentModule("home")} 
             />
          ) : currentModule === "realestate" ? (
             <RealEstateSimulatorView 
               theme={theme} 
               onBack={() => setCurrentModule("home")} 
             />
          ) : currentModule === "cashflow" ? (
             <CashflowView theme={theme} />
          ) : currentModule === "market" ? (
            <MarketView 
              theme={theme} 
              favorites={favorites} 
              onToggleFavorite={handleToggleFavorite} 
              preSelectedTicker={selectedMarketTicker}
              onClearSelection={() => setSelectedMarketTicker(null)}
            />
          ) : activeTab === "settings" ? (
            <SettingsView 
              refreshInterval={refreshInterval}
              onRefreshIntervalChange={handleRefreshIntervalChange}
              onResetData={handleResetData}
              theme={theme}
              onThemeChange={handleThemeChange}
              onInstallClick={() => setShowPWAInstallPrompt(true)}
            />
          ) : (!portfolio || (portfolio.positions.length === 0 && transactions.length === 0)) && activeTab !== "input" ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border border-slate-200">
              <div className="bg-slate-50 p-6 rounded-full mb-6">
                <Landmark size={48} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-sans">Portefeuille Vide</h3>
              <p className="text-slate-500 mt-2 max-w-sm text-sm">
                Importez votre CSV Bourse Direct ou ajoutez des transactions manuellement pour commencer l'analyse.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
              {/* Mobile sub-tabs for portfolio module (scrollable) */}
              {currentModule === "portfolio" && portfolio && (
                <div className="md:hidden flex overflow-x-auto no-scrollbar gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60 scroll-smooth">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap border shrink-0 transition-all cursor-pointer",
                      activeTab === "dashboard"
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-500"
                        : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                    )}
                  >
                    Analyses
                  </button>
                  <button
                    onClick={() => setActiveTab("assets")}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap border shrink-0 transition-all cursor-pointer",
                      activeTab === "assets"
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-500"
                        : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                    )}
                  >
                    Actifs
                  </button>
                  <button
                    onClick={() => setActiveTab("history")}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap border shrink-0 transition-all cursor-pointer",
                      activeTab === "history"
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-500"
                        : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                    )}
                  >
                    Historique
                  </button>
                  <button
                    onClick={() => setActiveTab("dividends")}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap border shrink-0 transition-all cursor-pointer",
                      activeTab === "dividends"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                    )}
                  >
                    Dividendes
                  </button>
                  <button
                    onClick={() => setActiveTab("news")}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap border shrink-0 transition-all cursor-pointer",
                      activeTab === "news"
                        ? "bg-amber-500 text-slate-950 border-amber-500"
                        : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                    )}
                  >
                    Actualités
                  </button>
                  <button
                    onClick={() => setActiveTab("input")}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap border shrink-0 transition-all cursor-pointer",
                      activeTab === "input"
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-500"
                        : "bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                    )}
                  >
                    Saisie
                  </button>
                </div>
              )}
              {activeTab === "dashboard" ? (
                <div className="flex flex-col gap-6">
                  {/* Tab menu */}
                  <div className="flex border-b border-slate-200 gap-4 mb-1">
                    <button
                      onClick={() => setDashboardView("standard")}
                      className={cn(
                        "pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all",
                        dashboardView === "standard"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-500 hover:text-slate-755"
                      )}
                    >
                      Allocation d'Actifs
                    </button>
                    <button
                      onClick={() => setDashboardView("backtest")}
                      className={cn(
                        "pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all",
                        dashboardView === "backtest"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-500 hover:text-slate-755"
                      )}
                    >
                      Backtesting d'Allocation (Alpha / Sharpe)
                    </button>
                  </div>

                  {dashboardView === "standard" ? (
                    <>
                      <PortfolioCharts positions={portfolio.positions} transactions={transactions} />
                      <PositionTable 
                        positions={portfolio.positions} 
                        theme={theme} 
                        onNavigateToMarket={handleNavigateToMarketAsset}
                      />
                    </>
                  ) : (
                    <BacktestAllocation positions={portfolio.positions} theme={theme} />
                  )}
                </div>
              ) : activeTab === "assets" ? (
                <AssetsView 
                  positions={portfolio.positions}
                  transactions={deduplicateTransactions(transactions)} 
                  onUpdateTransaction={updateTransaction}
                  onDeleteTransaction={deleteTransaction}
                  theme={theme}
                  onNavigateToMarket={handleNavigateToMarketAsset}
                />
              ) : activeTab === "history" ? (
                <HistoryView 
                  closedPositions={portfolio.closedPositions}
                  totalRealizedPL={portfolio.summary.totalRealizedPL}
                  totalFees={portfolio.summary.totalFees}
                  onNavigateToMarket={handleNavigateToMarketAsset}
                />
              ) : activeTab === "dividends" ? (
                <DividendsView 
                  transactions={deduplicateTransactions(transactions)}
                  totalDividends={portfolio.summary.totalDividends}
                />
              ) : activeTab === "news" ? (
                <NewsView positions={portfolio.positions} activeTab={activeTab} />
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm max-w-2xl mx-auto w-full">
                  <div className="mb-8">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-2">Ajouter des Données</h2>
                    <p className="text-slate-500 text-sm">Choisissez l'import CSV ou l'ajout manuel pour mettre à jour votre portefeuille.</p>
                  </div>
                  <FileUpload 
                    onDataLoaded={handleFileUpload} 
                    onManualAdd={handleManualAdd} 
                    onReset={handleResetData}
                  />
                </div>
              )}
            </div>
          )}
        </main>

        {/* Unified Mobile Navigation Bar - Global for All Modules (No longer floats at 32px, fits beautifully at the absolute bottom) */}
        <nav className={cn(
          "md:hidden fixed bottom-0 inset-x-0 border-t flex items-center justify-around h-16 px-2 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-colors pb-safe",
          theme === "cyber" ? "bg-slate-950 border-slate-900" : "bg-white border-slate-200"
        )}>
          <button 
            onClick={() => setCurrentModule("home")}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 py-1 transition-all",
              currentModule === "home" ? s.accentText : "text-slate-400"
            )}
          >
            <Home size={18} />
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Accueil</span>
          </button>
          <button 
            onClick={() => {
              setCurrentModule("portfolio");
              if (activeTab === "settings") setActiveTab("dashboard");
            }}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 py-1 transition-all",
              (currentModule === "portfolio" && activeTab !== "settings") ? s.accentText : "text-slate-400"
            )}
          >
            <Coins size={18} />
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Portefeuille</span>
          </button>
          <button 
            onClick={() => setCurrentModule("market")}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 py-1 transition-all",
              currentModule === "market" ? "text-amber-500" : "text-slate-400"
            )}
          >
            <Search size={18} />
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Bourse</span>
          </button>
          <button 
            onClick={() => {
              setCurrentModule("fire");
            }}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 py-1 transition-all",
              (currentModule === "fire" || currentModule === "realestate" || currentModule === "cashflow") ? "text-emerald-500" : "text-slate-400"
            )}
          >
            <TrendingUp size={18} />
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Simulations</span>
          </button>
          <button 
            onClick={() => {
              setCurrentModule("portfolio");
              setActiveTab("settings");
            }}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 py-1 transition-all",
              (currentModule === "portfolio" && activeTab === "settings") ? s.accentText : "text-slate-400"
            )}
          >
            <Settings size={18} />
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Réglages</span>
          </button>
        </nav>
      </div>

      {/* PWA Direct Installation Guides/Prompt for Smartphones */}
      <PWAInstallOverlay 
        theme={theme} 
        forceShow={showPWAInstallPrompt} 
        onDismiss={() => setShowPWAInstallPrompt(false)} 
      />
    </div>
  );
}

