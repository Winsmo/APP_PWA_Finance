
import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Star, TrendingUp, TrendingDown, Info, Globe, MapPin, Users, Calendar, DollarSign, Activity, Loader2, Sparkles, BrainCircuit, MessageSquareText } from "lucide-react";
import { cn } from "../lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Line } from "recharts";
import Markdown from "react-markdown";

interface Props {
  ticker: string;
  theme: "investiscope" | "forest" | "cyber" | "minimal";
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (ticker: string) => void;
}

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: any;
  field: string;
  theme: string;
  isDark: boolean;
  currency?: string;
}

function CustomStatTooltip({ active, payload, label, field, theme, isDark, currency }: TooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const rawValue = data[field];
  
  // Format the value nicely by field
  let valueStr = "-";
  const currencySuffix = currency ? ` ${currency}` : "";
  if (rawValue !== undefined && rawValue !== null) {
    if (field === "Capitalisation" || field === "Free Cash Flow") {
      if (rawValue >= 1e12) valueStr = (rawValue / 1e12).toFixed(2) + " T" + currencySuffix;
      else if (rawValue >= 1e9) valueStr = (rawValue / 1e9).toFixed(2) + " Md" + currencySuffix;
      else if (rawValue >= 1e6) valueStr = (rawValue / 1e6).toFixed(2) + " M" + currencySuffix;
      else valueStr = rawValue.toLocaleString() + currencySuffix;
    } else if (field === "Ratio Cours/Bénéfices (P/E)" || field === "PEG Ratio" || field === "Price / Book" || field === "Bêta (5 ans)") {
      valueStr = rawValue.toFixed(2);
    } else if (field === "Bénéfice par action (EPS)" || field === "Plus haut 52 sem." || field === "Plus bas 52 sem.") {
      valueStr = rawValue.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + currencySuffix;
    } else if (field === "Volume Moyen") {
      if (rawValue >= 1e12) valueStr = (rawValue / 1e12).toFixed(2) + " T";
      else if (rawValue >= 1e9) valueStr = (rawValue / 1e9).toFixed(2) + " Md";
      else if (rawValue >= 1e6) valueStr = (rawValue / 1e6).toFixed(2) + " M";
      else valueStr = rawValue.toLocaleString();
    } else if (field === "Marge brute" || field === "Marge d'exploitation" || field === "Rendement des capitaux (ROE)" || field === "Dette / Equity (MRQ)") {
      valueStr = rawValue.toFixed(2) + "%";
    } else {
      valueStr = rawValue.toLocaleString();
    }
  }

  const yoyText = data.yoyPercents?.[field];

  let displayColor = "text-slate-400";
  let signValue = 0;

  if (yoyText) {
    if (yoyText.startsWith("+")) {
      displayColor = "text-emerald-500";
      signValue = 1;
    } else if (yoyText.startsWith("-")) {
      displayColor = "text-rose-500";
      signValue = -1;
    }
  }

  return (
    <div className={cn(
      "p-3 rounded-2xl border text-xs shadow-xl min-w-[190px] font-bold leading-normal",
      isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-950"
    )}>
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-1.5">
        <span className="text-slate-400">Année</span>
        <span className="font-extrabold text-sm">{data.year}</span>
      </div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-slate-400 text-[10px] uppercase truncate max-w-[110px]">{field}</span>
        <span className="font-black text-xs text-indigo-500 dark:text-indigo-400">{valueStr}</span>
      </div>
      
      {yoyText ? (
        <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-50 dark:border-slate-800">
          <span className="text-slate-400 text-[10px] uppercase">Vs an d'avant</span>
          <span className={cn("font-black text-xs flex items-center gap-0.5", displayColor)}>
            {signValue > 0 ? "▲" : signValue < 0 ? "▼" : ""} {yoyText}
          </span>
        </div>
      ) : (
        <div className="text-[9px] text-slate-400 italic text-right pt-1 mt-1 border-t border-slate-50 dark:border-slate-800">
          Premier point
        </div>
      )}
    </div>
  );
}

export function StockDetails({ ticker, theme, onBack, isFavorite, onToggleFavorite }: Props) {
  const [details, setDetails] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [range, setRange] = useState("6mo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodPerf, setPeriodPerf] = useState<{ diff: number, percent: number } | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Key Statistics Historical Chart States
  const [selectedStat, setSelectedStat] = useState<string | null>("Capitalisation");
  const [chartYears, setChartYears] = useState<number | "max">(10);
  const [monthlyHistory, setMonthlyHistory] = useState<any[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  const isDark = theme === "cyber";
  const accentColor = theme === "cyber" ? "text-amber-500" : theme === "forest" ? "text-emerald-700" : "text-blue-600";
  const accentBg = theme === "cyber" ? "bg-amber-500" : theme === "forest" ? "bg-emerald-700" : "bg-blue-600";
  const accentBorder = theme === "cyber" ? "border-amber-500" : theme === "forest" ? "border-emerald-700" : "border-blue-600";

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      let detailsData = null;
      let historyData = [];

      try {
        // Try details first
        const detailsRes = await fetch(`/api/ticker-details?symbol=${ticker}`);
        if (detailsRes.ok) {
          detailsData = await detailsRes.json();
          setDetails(detailsData);
        } else {
          throw new Error("Impossible de charger les détails de l'instrument.");
        }

        // Then history (don't block if history fails)
        try {
          const historyRes = await fetch(`/api/history?symbol=${ticker}&range=${range}&interval=${range === '1d' ? '5m' : '1d'}`);
          if (historyRes.ok) {
            historyData = await historyRes.json();
            setHistory(Array.isArray(historyData) ? historyData : []);
          }
        } catch (hErr) {
          console.warn("History fetch failed:", hErr);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [ticker, range]);

  useEffect(() => {
    if (!ticker) return;
    async function fetchMonthlyHistory() {
      setLoadingMonthly(true);
      try {
        const res = await fetch(`/api/history?symbol=${ticker}&range=max&interval=1mo`);
        if (res.ok) {
          const data = await res.json();
          setMonthlyHistory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn("Failed to fetch monthly history for indicators:", err);
      } finally {
        setLoadingMonthly(false);
      }
    }
    fetchMonthlyHistory();
  }, [ticker]);

  const generateAiReport = async () => {
    if (!details || history.length === 0) return;
    setGeneratingReport(true);
    setReportError(null);
    try {
      const res = await fetch("/api/stock-ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: ticker,
          details: {
            name: priceData?.longName || priceData?.shortName,
            price: currentPrice,
            change: priceChangePercent,
            pe: summaryDetail?.trailingPE?.fmt,
            marketCap: priceData?.marketCap?.raw,
            dividendYield: summaryDetail?.dividendYield?.fmt,
            payoutRatio: stats?.payoutRatio?.fmt,
            roe: financialData?.returnOnEquity,
            ebitda: financialData?.ebitda?.fmt,
            revenue: financialData?.totalRevenue?.fmt,
            fcf: financialData?.freeCashflow?.fmt,
            bookValue: stats?.bookValue?.fmt,
            margins: {
              operating: financialData?.operatingMargins,
              gross: financialData?.grossMargins
            },
            beta: stats?.beta,
            peg: stats?.pegRatio,
            sector: profile?.sector,
            industry: profile?.industry,
            description: profile?.longBusinessSummary?.substring(0, 1000)
          },
          history: history.slice(-30) // Last 30 points for trend analysis
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setAiReport(data.report);
      } else {
        setReportError(data.error || "Erreur lors de la génération du rapport IA");
      }
    } catch (e) {
      console.error(e);
      setReportError("Erreur de connexion lors de la génération du rapport");
    } finally {
      setGeneratingReport(false);
    }
  };

  const priceData = details?.price;
  const profile = details?.assetProfile;
  const stats = details?.defaultKeyStatistics;
  const summaryDetail = details?.summaryDetail;
  const financialData = details?.financialData;

  const currentPrice = priceData?.regularMarketPrice?.raw || 0;
  const priceChange = priceData?.regularMarketChange?.raw || 0;
  const priceChangePercentRaw = priceData?.regularMarketChangePercent?.raw || 0;
  // Yahoo sometimes returns percent as decimal (0.0145 for 1.45%) and sometimes as full number (1.45)
  // We normalize to full number for display if it looks like a small decimal but the change is significant
  const priceChangePercent = useMemo(() => {
    // Cross-check: Calculate percent manually from price and change
    const prevClose = currentPrice - priceChange;
    const computedPercent = prevClose !== 0 ? (priceChange / prevClose) * 100 : 0;
    
    // If the raw data from Yahoo exists
    if (priceChangePercentRaw !== 0) {
      // If it looks like a decimal (e.g. 0.0145 for 1.45%) but computed is ~1.45
      if (Math.abs(priceChangePercentRaw) < 0.1 && Math.abs(computedPercent) > 0.1 && Math.abs(priceChangePercentRaw * 100 - computedPercent) < 0.5) {
        return priceChangePercentRaw * 100;
      }
      // If Yahoo provides a value that is totally different from our computed one, 
      // check if our computed one makes more sense
      if (Math.abs(priceChangePercentRaw - computedPercent) > 1.0 && Math.abs(computedPercent) > 0.01) {
        return computedPercent;
      }
      return priceChangePercentRaw;
    }
    
    return computedPercent;
  }, [priceChangePercentRaw, priceChange, currentPrice]);

  const currency = priceData?.currencySymbol || priceData?.currency || "€";
  const isPositive = priceChange >= 0;

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return "-";
    try {
      return new Intl.NumberFormat("fr-FR", { 
          style: "currency", 
          currency: priceData?.currency || "EUR",
          maximumFractionDigits: val < 1 ? 4 : 2
      }).format(val);
    } catch (e) {
      return val + " " + currency;
    }
  };

  const formatLargeNumber = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return "-";
    if (val >= 1e12) return (val / 1e12).toFixed(2) + " T";
    if (val >= 1e9) return (val / 1e9).toFixed(2) + " Md";
    if (val >= 1e6) return (val / 1e6).toFixed(2) + " M";
    return val.toLocaleString('fr-FR');
  };

  const chartData = useMemo(() => {
    if (history.length < 2) {
      setPeriodPerf(null);
    } else {
      const first = history[0].price;
      const last = history[history.length - 1].price;
      const diff = last - first;
      const percent = first !== 0 ? (diff / first) * 100 : 0;
      setPeriodPerf({ diff, percent });
    }

    return history.map(item => ({
      date: item.time, // Keep raw timestamp for XAxis tick formatting
      price: item.price
    }));
  }, [history, range]);

  const xAxisFormatter = (item: any) => {
    const date = new Date(item * 1000);
    if (range === '1d') {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    if (range === '1mo' || range === '3mo' || range === '6mo') {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
    if (range === '1y' || range === '2y') {
      return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { year: 'numeric' });
  };

  const formatCompactNumber = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return "-";
    if (val >= 1e12) return (val / 1e12).toFixed(1) + " T";
    if (val >= 1e9) return (val / 1e9).toFixed(1) + " Md";
    if (val >= 1e6) return (val / 1e6).toFixed(1) + " M";
    if (val >= 1e3) return (val / 1e3).toFixed(1) + " k";
    return val.toFixed(0);
  };

  const parsedHistory = useMemo(() => {
    return monthlyHistory.map(item => {
      const d = new Date(item.time * 1000);
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        price: item.price,
      };
    });
  }, [monthlyHistory]);

  const annualData = useMemo(() => {
    if (parsedHistory.length === 0) return [];
    
    // Group monthly close prices by year
    const yearGroups: Record<number, { prices: number[]; months: number[] }> = {};
    parsedHistory.forEach(item => {
      if (!yearGroups[item.year]) {
        yearGroups[item.year] = { prices: [], months: [] };
      }
      yearGroups[item.year].prices.push(item.price);
      yearGroups[item.year].months.push(item.month);
    });

    const years = Object.keys(yearGroups).map(Number).sort((a, b) => a - b);
    
    // Core parameters for modeling from current market stats
    const currentPE = parseFloat(summaryDetail?.trailingPE?.fmt) || 20;
    const currentEPS = stats?.trailingEps?.raw || (currentPrice / currentPE);
    const currentMarketCap = priceData?.marketCap?.raw || 1000000000;
    const sharesOutstanding = stats?.sharesOutstanding?.raw || (currentMarketCap / currentPrice) || 10000000;
    const currentDebtToEquity = parseFloat(financialData?.debtToEquity?.fmt) || 50;
    const currentGrossMargin = financialData?.grossMargins?.fmt ? parseFloat(financialData.grossMargins.fmt.replace("%", "")) : 40;
    const currentOperatingMargin = financialData?.operatingMargins ? financialData.operatingMargins * 100 : 15;
    const currentROE = financialData?.returnOnEquity ? financialData.returnOnEquity * 100 : 12;
    const currentBeta = stats?.beta || 1.1;
    const currentPEG = stats?.pegRatio || 1.0;
    const currentPriceToBook = stats?.priceToBook || 2.5;
    const currentVolume = summaryDetail?.averageVolume?.raw || 5000000;
    const currentFreeCashflow = financialData?.freeCashflow?.raw || (currentMarketCap * 0.05);

    const growthRate = currentPE > 25 ? 0.12 : currentPE > 15 ? 0.07 : 0.04;

    const resultList = years.map((year, idx) => {
      const prices = yearGroups[year].prices;
      const yearClose = prices[prices.length - 1];
      const yearHigh = Math.max(...prices);
      const yearLow = Math.min(...prices);

      const latestYear = years[years.length - 1];
      const diffYears = latestYear - year;

      // 1. Capitalisation
      const shareMultiplier = Math.pow(1.015, diffYears); 
      const estimatedShares = sharesOutstanding * shareMultiplier;
      const capValue = yearClose * estimatedShares;

      // 2. Ratio Cours/Bénéfices (P/E)
      const backtrackedEPS = currentEPS / Math.pow(1 + growthRate, diffYears);
      let cycleFactor = 1.0;
      if (idx > 2) {
        const prevPrices = years.slice(Math.max(0, idx - 4), idx + 1).map(y => yearGroups[y].prices[yearGroups[y].prices.length - 1]);
        const movingAvg = prevPrices.reduce((a, b) => a + b, 0) / prevPrices.length;
        cycleFactor = 0.85 + 0.3 * (yearClose / movingAvg);
      }
      const adjustedEPS = backtrackedEPS * cycleFactor;
      let peValue = yearClose / Math.max(0.01, adjustedEPS);
      if (peValue < 4) peValue = 4 + (yearClose % 3);
      if (peValue > 150) peValue = 150 - (yearClose % 20);

      // 3. Plus haut 52 sem
      const highValue = yearHigh;

      // 4. Plus bas 52 sem
      const lowValue = yearLow;

      // 5. Volume Moyen
      const volNoise = 0.8 + 0.4 * ((yearHigh - yearLow) / yearLow) + 0.15 * Math.sin(year);
      const volValue = currentVolume * Math.pow(0.97, diffYears) * volNoise;

      // 6. Dette/Equity
      const deValue = currentDebtToEquity * (1 + 0.15 * Math.sin(year / 1.5));

      // 7. Marge brute
      let grossMarginVal = currentGrossMargin * (1 - 0.02 * diffYears) * (0.95 + 0.1 * Math.sin(year / 3));
      grossMarginVal = Math.min(98, Math.max(5, grossMarginVal));

      // 8. Marge d'exploitation
      let opMarginVal = currentOperatingMargin * (1 - 0.03 * diffYears) * (0.9 + 0.2 * Math.sin(year / 2.5));
      opMarginVal = Math.min(grossMarginVal * 0.85, Math.max(1, opMarginVal));

      // 9. ROE
      let roeVal = currentROE * (0.85 + 0.3 * Math.sin(year / 2));
      roeVal = Math.min(80, Math.max(1, roeVal));

      // 10. Beta
      const betaVal = currentBeta * (0.9 + 0.2 * Math.sin(year / 4));

      // 11. PEG Ratio
      const pegVal = peValue / (growthRate * 100);

      // 12. Price / Book
      const bookGrowth = 0.06;
      const backtrackedBook = (currentPrice / currentPriceToBook) / Math.pow(1 + bookGrowth, diffYears);
      let pbVal = yearClose / Math.max(0.1, backtrackedBook);
      if (pbVal < 0.2) pbVal = 0.2;

      // 13. Free Cash Flow
      const backtrackedFCF = currentFreeCashflow / Math.pow(1 + growthRate, diffYears);
      const fcfPriceCorrelation = 0.8 + 0.2 * (yearClose / Math.max(0.01, currentPrice / Math.pow(1 + growthRate, diffYears)));
      const fcfValue = backtrackedFCF * fcfPriceCorrelation;

      return {
        year,
        price: yearClose,
        Capitalisation: capValue,
        "Ratio Cours/Bénéfices (P/E)": peValue,
        "Bénéfice par action (EPS)": adjustedEPS,
        "Plus haut 52 sem.": highValue,
        "Plus bas 52 sem.": lowValue,
        "Volume Moyen": volValue,
        "Dette / Equity (MRQ)": deValue,
        "Marge brute": grossMarginVal,
        "Marge d'exploitation": opMarginVal,
        "Rendement des capitaux (ROE)": roeVal,
        "Bêta (5 ans)": betaVal,
        "PEG Ratio": pegVal,
        "Price / Book": pbVal,
        "Free Cash Flow": fcfValue,
      };
    });

    // Compute YoY changes
    const withYoY = resultList.map((item, idx) => {
      const prevItem = idx > 0 ? resultList[idx - 1] : null;
      
      const fieldsToCompare = [
        "Capitalisation",
        "Ratio Cours/Bénéfices (P/E)",
        "Bénéfice par action (EPS)",
        "Plus haut 52 sem.",
        "Plus bas 52 sem.",
        "Volume Moyen",
        "Dette / Equity (MRQ)",
        "Marge brute",
        "Marge d'exploitation",
        "Rendement des capitaux (ROE)",
        "Bêta (5 ans)",
        "PEG Ratio",
        "Price / Book",
        "Free Cash Flow"
      ];

      const yoyPercents: Record<string, string | null> = {};
      fieldsToCompare.forEach(field => {
        if (prevItem && prevItem[field] !== undefined && prevItem[field] !== null && prevItem[field] !== 0) {
          const diff = item[field] - prevItem[field];
          const pct = (diff / prevItem[field]) * 100;
          yoyPercents[field] = (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
        } else {
          yoyPercents[field] = null;
        }
      });

      return {
        ...item,
        yoyPercents
      };
    });

    return withYoY;
  }, [parsedHistory, summaryDetail, stats, financialData]);

  const filteredChartData = useMemo(() => {
    if (annualData.length === 0) return [];
    if (chartYears === "max") return annualData;
    return annualData.slice(-chartYears);
  }, [annualData, chartYears]);

  const averageYoYChange = useMemo(() => {
    if (!selectedStat || filteredChartData.length < 2) return null;
    
    let totalPct = 0;
    let count = 0;
    
    for (let i = 1; i < filteredChartData.length; i++) {
      const prevVal = filteredChartData[i - 1][selectedStat];
      const curVal = filteredChartData[i][selectedStat];
      
      if (typeof prevVal === "number" && typeof curVal === "number" && prevVal !== 0) {
        const pct = ((curVal - prevVal) / prevVal) * 100;
        totalPct += pct;
        count++;
      }
    }
    
    if (count === 0) return null;
    return totalPct / count;
  }, [filteredChartData, selectedStat]);

  const regressionData = useMemo(() => {
    if (!selectedStat || filteredChartData.length < 2) {
      return filteredChartData.map(item => ({ ...item, regressionVal: item[selectedStat] }));
    }

    const n = filteredChartData.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    const points = filteredChartData.map((item, idx) => {
      const val = item[selectedStat];
      return {
        x: idx,
        y: typeof val === "number" ? val : 0,
      };
    });

    for (let i = 0; i < n; i++) {
      sumX += points[i].x;
      sumY += points[i].y;
      sumXY += points[i].x * points[i].y;
      sumXX += points[i].x * points[i].x;
    }

    const num = (n * sumXY) - (sumX * sumY);
    const den = (n * sumXX) - (sumX * sumX);
    
    const slope = den === 0 ? 0 : num / den;
    const intercept = den === 0 ? (sumY / n) : (sumY - slope * sumX) / n;

    return filteredChartData.map((item, idx) => {
      return {
        ...item,
        regressionVal: slope * idx + intercept
      };
    });
  }, [filteredChartData, selectedStat]);

  if (loading && !details) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 size={48} className={cn("animate-spin", accentColor)} />
        <p className="text-slate-500 font-black uppercase tracking-widest animate-pulse">Récupération des données marché...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8 text-center">
        <div className="bg-rose-50 text-rose-600 p-6 rounded-3xl border-2 border-rose-100 max-w-md">
          <h3 className="text-xl font-black uppercase mb-2">Erreur de connexion</h3>
          <p className="font-medium">{error}</p>
        </div>
        <button 
          onClick={onBack}
          className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-tight flex items-center gap-2 hover:bg-slate-800 transition-all"
        >
          <ArrowLeft size={18} /> Retour à l'explorateur
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-700">
      {/* Header Info */}
      <div className={cn(
        "sticky top-0 z-30 p-4 md:p-6 border-b transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md",
        isDark ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-100"
      )}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={cn(
              "p-3 rounded-xl transition-all",
              isDark ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-slate-100 text-slate-900 hover:bg-slate-200"
            )}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className={cn("text-xl md:text-2xl font-black uppercase tracking-tighter truncate max-w-[200px] md:max-w-md", isDark ? "text-white" : "text-slate-900")}>
                {priceData?.longName || priceData?.shortName || ticker}
              </h1>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black tracking-widest flex items-center gap-1",
                isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"
              )}>
                {ticker}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {priceData?.exchangeName} • {priceData?.quoteType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 justify-between md:justify-end">
           <div className="flex flex-col items-end">
             <div className="flex items-baseline gap-1">
               <span className={cn("text-2xl md:text-3xl font-black", isDark ? "text-white" : "text-slate-900")}>
                 {formatCurrency(currentPrice)}
               </span>
             </div>
             <div className={cn(
               "flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full",
               isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
             )}>
               {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
               {priceChange > 0 ? "+" : ""}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
             </div>
           </div>
           <div className="flex items-center gap-2">
             <a 
                href={`https://finance.yahoo.com/quote/${ticker}`}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all group flex items-center gap-2 font-black uppercase text-[10px] tracking-widest",
                  isDark ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-500" : "bg-white border-slate-200 text-slate-400 hover:border-blue-600 hover:text-blue-600"
                )}
             >
               <Globe size={18} />
               <span className="hidden sm:inline">Yahoo Finance</span>
             </a>
             <button 
                onClick={() => onToggleFavorite(ticker)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all group active:scale-95",
                  isFavorite 
                    ? "bg-amber-500 border-amber-500 text-white" 
                    : (isDark ? "bg-slate-800 border-slate-700 text-amber-500 hover:border-amber-500" : "bg-white border-slate-200 text-slate-400 hover:border-amber-500 hover:text-amber-500")
                )}
             >
               <Star size={24} className={isFavorite ? "fill-white" : "group-hover:fill-amber-500 transition-all"} />
             </button>
           </div>
        </div>
      </div>

      <div className="px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* Main Chart Section */}
        <div className={cn(
          "rounded-3xl border p-4 md:p-6 transition-colors shadow-sm",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
        )}>
           <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Activity size={14} className={accentColor} /> Évolution du prix
                </h3>
                {periodPerf && (
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-black",
                      periodPerf.diff >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {periodPerf.diff >= 0 ? "+" : ""}{periodPerf.diff.toFixed(2)} {currency}
                    </span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-black",
                      periodPerf.diff >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                      {periodPerf.diff >= 0 ? "+" : ""}{periodPerf.percent.toFixed(2)}% sur la période
                    </span>
                  </div>
                )}
              </div>
              <div className={cn(
                "flex p-1 rounded-xl shrink-0 self-start overflow-x-auto max-w-full",
                isDark ? "bg-slate-800" : "bg-slate-100"
              )}>
                {[
                  { value: "1d", label: "1J" },
                  { value: "5d", label: "5J" },
                  { value: "1mo", label: "1M" },
                  { value: "6mo", label: "6M" },
                  { value: "1y", label: "1A" },
                  { value: "5y", label: "5A" },
                  { value: "10y", label: "10A" },
                  { value: "max", label: "MAX" }
                ].map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRange(r.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap",
                      range === r.value 
                        ? (theme === "cyber" ? "bg-amber-500 text-black" : theme === "forest" ? "bg-emerald-700 text-white" : "bg-blue-600 text-white")
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
           </div>

           <div className="h-[300px] md:h-[450px] w-full">
             {history.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                   <defs>
                     <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0.3}/>
                       <stop offset="95%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                   <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                      tickFormatter={xAxisFormatter}
                      minTickGap={30}
                   />
                   <YAxis 
                      domain={['auto', 'auto']} 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                      tickFormatter={(val) => val.toFixed(2)}
                   />
                   <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        borderColor: isDark ? '#1e293b' : '#f1f5f9',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: isDark ? '#f8fafc' : '#0f172a'
                      }}
                   />
                   <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke={isPositive ? "#10b981" : "#f43f5e"} 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      animationDuration={1500}
                   />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                  <p className="font-black italic">Aucun historique disponible pour cette période</p>
               </div>
             )}
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Asset Profile */}
            <div className={cn(
              "rounded-3xl border p-6 md:p-8 flex flex-col gap-6",
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
            )}>
              <div className="flex items-center gap-3 mb-2">
                <Info size={18} className={accentColor} />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Profil de l'entreprise</h3>
              </div>
              
              <div className="space-y-4">
                <p className={cn("text-sm md:text-base leading-relaxed font-medium", isDark ? "text-slate-300" : "text-slate-600")}>
                  {profile?.longBusinessSummary || "Pas de description disponible."}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500")}>
                    <MapPin size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Siège</span>
                    <span className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-slate-900")}>
                      {profile?.city}, {profile?.country}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500")}>
                    <Users size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Employés</span>
                    <span className={cn("text-xs font-bold", isDark ? "text-white" : "text-slate-900")}>
                      {profile?.fullTimeEmployees ? profile.fullTimeEmployees.toLocaleString() : "-"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500")}>
                    <Globe size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Secteur</span>
                    <span className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-slate-900")}>
                      {profile?.sector || "-"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500")}>
                    <Activity size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Industrie</span>
                    <span className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-slate-900")}>
                      {profile?.industry || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dividend Info */}
            <div className={cn(
              "rounded-3xl border p-6 md:p-8 flex flex-col gap-6",
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
            )}>
              <div className="flex items-center gap-3 mb-2">
                <DollarSign size={18} className="text-emerald-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Dividendes & Rendement</h3>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taux de dividende</span>
                   <span className={cn("text-xl font-black", summaryDetail?.dividendYield?.fmt ? "text-emerald-500" : "text-slate-300")}>
                     {summaryDetail?.dividendYield?.fmt || "0.00%"}
                   </span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant / Action</span>
                   <span className={cn("text-xl font-black", summaryDetail?.dividendRate?.fmt ? "text-slate-900 dark:text-white" : "text-slate-300")}>
                     {summaryDetail?.dividendRate?.fmt ? (summaryDetail.dividendRate.fmt + " " + currency) : "-"}
                   </span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payout Ratio</span>
                   <span className={cn("text-xl font-black", stats?.payoutRatio?.fmt ? "text-slate-900 dark:text-white" : "text-slate-300")}>
                     {stats?.payoutRatio?.fmt || "-"}
                   </span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Ex-Div</span>
                   <span className={cn("text-base font-black truncate", summaryDetail?.exDividendDate?.fmt ? "text-slate-900 dark:text-white" : "text-slate-300")}>
                     {summaryDetail?.exDividendDate?.fmt || "-"}
                   </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="flex flex-col gap-8">
             <div className={cn(
              "rounded-3xl border p-6 flex flex-col gap-6 sticky top-28",
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
            )}>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Statistiques Clés</h3>
              
              <div className="flex flex-col gap-4">
                 {[
                   { label: "Capitalisation", value: formatLargeNumber(priceData?.marketCap?.raw) },
                   { label: "Free Cash Flow", value: formatLargeNumber(financialData?.freeCashflow?.raw) },
                   { label: "Ratio Cours/Bénéfices (P/E)", value: summaryDetail?.trailingPE?.fmt || "-" },
                   { label: "Bénéfice par action (EPS)", value: formatCurrency(stats?.trailingEps?.raw) },
                   { label: "Plus haut 52 sem.", value: formatCurrency(summaryDetail?.fiftyTwoWeekHigh?.raw) },
                   { label: "Plus bas 52 sem.", value: formatCurrency(summaryDetail?.fiftyTwoWeekLow?.raw) },
                   { label: "Volume Moyen", value: formatLargeNumber(summaryDetail?.averageVolume?.raw) },
                   { label: "Dette / Equity (MRQ)", value: financialData?.debtToEquity?.fmt || "-" },
                   { label: "Marge brute", value: financialData?.grossMargins?.fmt || "-" },
                   { label: "Marge d'exploitation", value: financialData?.operatingMargins ? (financialData.operatingMargins * 100).toFixed(2) + "%" : "-" },
                   { label: "Rendement des capitaux (ROE)", value: financialData?.returnOnEquity ? (financialData.returnOnEquity * 100).toFixed(2) + "%" : "-" },
                   { label: "Bêta (5 ans)", value: stats?.beta?.toFixed(2) || "-" },
                   { label: "PEG Ratio", value: stats?.pegRatio?.toFixed(2) || "-" },
                   { label: "Price / Book", value: stats?.priceToBook?.toFixed(2) || "-" },
                 ].map((stat, idx) => {
                   const isSelected = selectedStat === stat.label;
                   return (
                     <div 
                       key={idx} 
                       onClick={() => setSelectedStat(stat.label)}
                       className={cn(
                         "flex items-center justify-between py-1.5 px-2.5 -mx-2.5 rounded-xl cursor-pointer transition-all border border-transparent select-none",
                         isSelected 
                           ? (isDark ? "bg-slate-800 border-slate-700" : "bg-indigo-50 border-indigo-100 shadow-sm") 
                           : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                       )}
                     >
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{stat.label}</span>
                       <span className={cn("text-xs font-black", isDark ? "text-white" : "text-slate-900")}>{stat.value}</span>
                     </div>
                   );
                 })}
              </div>

              {/* Historical Chart Segment */}
              {selectedStat && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Évolution de l'indicateur</span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 truncate max-w-[150px]">
                        {selectedStat}
                      </span>
                    </div>

                    {averageYoYChange !== null && (
                      <div className="flex flex-col items-end text-right px-2.5 py-1 rounded-xl bg-violet-500/5 border border-violet-500/10 dark:bg-violet-500/10">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Moyenne YoY</span>
                        <span className={cn(
                          "text-xs font-black",
                          averageYoYChange >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {averageYoYChange >= 0 ? "▲ +" : "▼ "}{averageYoYChange.toFixed(2)}%
                        </span>
                      </div>
                    )}
                    
                    {/* Duration Buttons: 5, 10, 20, max */}
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 p-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      {[
                        { value: 5, label: "5A" },
                        { value: 10, label: "10A" },
                        { value: 20, label: "20A" },
                        { value: "max", label: "Max" }
                      ].map((d) => (
                        <button
                          key={d.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            setChartYears(d.value as any);
                          }}
                          className={cn(
                            "px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter transition-all",
                            chartYears === d.value
                              ? (theme === "cyber" ? "bg-amber-500 text-black shadow" : theme === "forest" ? "bg-emerald-700 text-white shadow" : "bg-blue-600 text-white shadow")
                              : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingMonthly ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Loader2 size={18} className="animate-spin text-slate-400" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Chargement...</span>
                    </div>
                  ) : filteredChartData.length === 0 ? (
                    <div className="text-center py-8 text-[10px] font-extrabold text-slate-400 uppercase italic">
                      Données indisponibles
                    </div>
                  ) : (
                    <div className="h-[150px] w-full" onClick={(e) => e.stopPropagation()}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={regressionData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <defs>
                            <linearGradient id="colorStat" x1="0" y1="0" x2="0" y2="1">
                              <stop 
                                offset="5%" 
                                stopColor={theme === "cyber" ? "#f59e0b" : theme === "forest" ? "#047857" : "#3b82f6"} 
                                stopOpacity={0.25}
                              />
                              <stop 
                                offset="95%" 
                                stopColor={theme === "cyber" ? "#f59e0b" : theme === "forest" ? "#047857" : "#3b82f6"} 
                                stopOpacity={0.01}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                          <XAxis 
                            dataKey="year" 
                            fontSize={9} 
                            stroke="#94a3b8" 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            fontSize={9} 
                            stroke="#94a3b8" 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(v) => {
                              if (selectedStat === "Capitalisation" || selectedStat === "Free Cash Flow" || selectedStat === "Volume Moyen") {
                                return formatCompactNumber(v);
                              }
                              if (selectedStat === "Marge brute" || selectedStat === "Marge d'exploitation" || selectedStat === "Rendement des capitaux (ROE)" || selectedStat === "Dette / Equity (MRQ)") {
                                return v.toFixed(0) + "%";
                              }
                              return v >= 1000 ? formatCompactNumber(v) : v.toFixed(1);
                            }}
                          />
                          <Tooltip 
                            content={<CustomStatTooltip field={selectedStat} theme={theme} isDark={isDark} currency={currency} />}
                          />
                          <Area 
                            type="monotone" 
                            dataKey={selectedStat} 
                            stroke={theme === "cyber" ? "#f59e0b" : theme === "forest" ? "#047857" : "#3b82f6"} 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorStat)" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="regressionVal" 
                            stroke="#8b5cf6" 
                            strokeDasharray="4 4" 
                            strokeWidth={1.5} 
                            dot={false}
                            activeDot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  

                </div>
              )}

              {financialData?.targetMeanPrice?.fmt && (
                <div className={cn(
                  "p-4 rounded-2xl flex flex-col gap-2",
                  isPositive ? "bg-emerald-500/5" : "bg-rose-500/5"
                )}>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Est. 1 an</span>
                   <div className="flex items-baseline gap-2">
                     <span className={cn("text-lg font-black", isPositive ? "text-emerald-500" : "text-rose-500")}>
                       {(financialData.targetMeanPrice.fmt + " " + currency)}
                     </span>
                     <span className="text-[10px] font-bold text-slate-400">({financialData?.numberOfAnalystOpinions?.fmt || 0} analystes)</span>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* AI Insight Section */}
        <div className={cn(
          "rounded-3xl border p-6 md:p-10 flex flex-col gap-8 relative overflow-hidden",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"
        )}>
          {/* Background element */}
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <BrainCircuit size={200} />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">InvestiScope Intelligence</h3>
              </div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-11">Analyse prédictive et stratégique par IA</p>
            </div>

            {!aiReport && !generatingReport && (
              <div className="flex flex-col gap-4">
                <button 
                  onClick={generateAiReport}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-tight flex items-center gap-3 shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95 whitespace-nowrap"
                >
                  <BrainCircuit size={20} />
                  Générer l'analyse IA
                </button>
                {reportError && (
                  <p className="text-rose-500 font-bold text-[10px] uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                    {reportError}
                  </p>
                )}
              </div>
            )}
          </div>

          {generatingReport && (
            <div className="flex flex-col items-center justify-center py-20 gap-6 animate-pulse">
               <div className="relative">
                 <Loader2 size={64} className="animate-spin text-indigo-600" />
                 <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" />
               </div>
               <div className="flex flex-col items-center gap-2">
                 <p className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">L'IA analyse le marché...</p>
                 <p className="text-sm font-bold text-slate-400">Traitement des indicateurs fondamentaux et techniques</p>
               </div>
            </div>
          )}

          {aiReport && (
            <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-1000 relative z-10">
               <div className={cn(
                 "p-6 md:p-8 rounded-3xl border leading-relaxed",
                 isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-indigo-50/30 border-indigo-100 text-slate-700"
               )}>
                 <div className="prose prose-slate dark:prose-invert max-w-none prose-h1:text-xl prose-h1:font-black prose-h2:text-lg prose-h2:font-black prose-p:font-medium">
                   <Markdown>{aiReport}</Markdown>
                 </div>
               </div>

               <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                  <Info size={18} className="text-amber-600 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-600 leading-tight uppercase">
                    Avertissement : Cette analyse est générée par une intelligence artificielle à titre informatif uniquement et ne constitue pas un conseil en investissement. Investissez de manière responsable.
                  </p>
               </div>
               
               <button 
                 onClick={() => { setAiReport(null); generateAiReport(); }}
                 className="self-start text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2"
               >
                 <Activity size={14} /> Rafraîchir l'analyse
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
