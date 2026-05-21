import { Position } from "../types";
import { ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import React, { useState, useMemo } from "react";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type SortKey = keyof Position | "totalPL" | "latentPLPercent";

export function PositionTable({ positions, theme, onNavigateToMarket }: { 
  positions: Position[], 
  theme: "investiscope" | "forest" | "cyber" | "minimal",
  onNavigateToMarket?: (ticker: string) => void
}) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "currentValue",
    direction: "desc",
  });

  const isDark = theme === "cyber";
  const accentColor = theme === "cyber" ? "text-amber-500" : theme === "forest" ? "text-emerald-700" : "text-blue-600";

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(val);

  const sortedPositions = useMemo(() => {
    const sortable = [...positions];
    sortable.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof Position] ?? 0;
      const bVal = b[sortConfig.key as keyof Position] ?? 0;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortConfig.direction === "asc" 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (sortConfig.direction === "asc") {
        return (aVal as number) - (bVal as number);
      }
      return (bVal as number) - (aVal as number);
    });
    return sortable;
  }, [positions, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={10} className="ml-1 opacity-20" />;
    return sortConfig.direction === "asc" ? <ChevronUp size={10} className={cn("ml-1", accentColor)} /> : <ChevronDown size={10} className={cn("ml-1", accentColor)} />;
  };

  return (
    <div className={cn(
      "rounded-xl border shadow-sm overflow-hidden mb-8 transition-colors",
      isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
    )}>
      <div className={cn(
        "p-4 border-b flex items-center justify-between transition-colors",
        isDark ? "border-slate-800 bg-slate-800/50" : "border-slate-100 bg-slate-50/50"
      )}>
        <h3 className={cn("text-sm font-bold uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-700")}>Détails des Positions</h3>
        <div className={cn(
            "px-2 py-0.5 rounded border text-[10px] font-bold",
            isDark ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-white border-slate-200 text-slate-500"
        )}>
          {positions.length} ACTIFS
        </div>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={cn("border-b transition-colors", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
              <th 
                className={cn("px-6 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors", isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")}
                onClick={() => requestSort("label")}
              >
                <div className="flex items-center">Instrument <SortIcon columnKey="label" /></div>
              </th>
              <th 
                className={cn("px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-right cursor-pointer transition-colors", isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")}
                onClick={() => requestSort("quantity")}
              >
                <div className="flex items-center justify-end">Qté / PRU <SortIcon columnKey="quantity" /></div>
              </th>
              <th 
                className={cn("px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-right cursor-pointer transition-colors", isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")}
                onClick={() => requestSort("currentPrice")}
              >
                <div className="flex items-center justify-end">Cours <SortIcon columnKey="currentPrice" /></div>
              </th>
              <th 
                className={cn("px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-right cursor-pointer transition-colors", isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")}
                onClick={() => requestSort("currentValue")}
              >
                <div className="flex items-center justify-end">Valeur <SortIcon columnKey="currentValue" /></div>
              </th>
              <th 
                className={cn("px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-right cursor-pointer transition-colors", isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")}
                onClick={() => requestSort("latentPLPercent")}
              >
                <div className="flex items-center justify-end">+/- Latente <SortIcon columnKey="latentPLPercent" /></div>
              </th>
              <th 
                className={cn("px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-right cursor-pointer transition-colors", isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")}
                onClick={() => requestSort("totalPL")}
              >
                <div className="flex items-center justify-end">P&L Total <SortIcon columnKey="totalPL" /></div>
              </th>
            </tr>
          </thead>
          <tbody className={cn("divide-y transition-colors", isDark ? "divide-slate-800" : "divide-slate-50")}>
            {sortedPositions.map((pos) => (
              <tr key={pos.label} className={cn("transition-colors group", isDark ? "hover:bg-slate-800" : "hover:bg-slate-50")}>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span 
                      onClick={(e) => {
                        if (onNavigateToMarket) {
                          e.stopPropagation();
                          onNavigateToMarket(pos.ticker);
                        }
                      }}
                      className={cn(
                        "text-xs font-bold line-clamp-1 cursor-pointer transition-colors hover:underline", 
                        isDark ? "text-white" : "text-slate-900",
                        "hover:text-blue-500"
                      )}
                    >
                      {pos.label}
                    </span>
                    <span className={cn("text-[10px] font-mono font-bold mt-0.5 uppercase", accentColor)}>{pos.ticker}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col">
                    <span className={cn("text-xs font-medium", isDark ? "text-slate-300" : "text-slate-700")}>{pos.quantity}</span>
                    <span className="text-[10px] text-slate-400">{formatCurrency(pos.averageCost)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "text-xs font-bold",
                      pos.isLivePrice ? (isDark ? "text-white" : "text-slate-900") : "text-slate-400"
                    )}>
                      {formatCurrency(pos.currentPrice)}
                    </span>
                    {!pos.isLivePrice && (
                      <span className="text-[8px] text-amber-500 font-bold uppercase">PRU Fallback</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                    <span className={cn("text-xs font-bold", isDark ? "text-white" : "text-slate-900")}>{formatCurrency(pos.currentValue)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={cn(
                    "text-xs font-bold",
                    pos.latentPL >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {pos.latentPL >= 0 ? "+" : ""}{pos.latentPLPercent.toFixed(2)}%
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-xs font-bold",
                      pos.totalPL >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {formatCurrency(pos.totalPL)}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Réal: {formatCurrency(pos.realizedPL)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={cn("md:hidden divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
        <div className={cn("p-2 flex gap-2 overflow-x-auto no-scrollbar", isDark ? "bg-slate-800/50" : "bg-slate-50")}>
           {[
             { key: "currentValue", label: "Valeur" },
             { key: "latentPLPercent", label: "Perf" },
             { key: "totalPL", label: "P&L" },
             { key: "quantity", label: "Qté" },
             { key: "label", label: "Nom" }
           ].map((btn) => (
             <button 
               key={btn.key}
               onClick={() => requestSort(btn.key as SortKey)}
               className={cn(
                 "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all",
                 sortConfig.key === btn.key 
                  ? (theme === "cyber" ? "bg-amber-500 border-amber-500 text-black" : theme === "forest" ? "bg-emerald-700 border-emerald-700 text-white" : "bg-blue-600 border-blue-600 text-white") 
                  : (isDark ? "bg-slate-900 border-slate-700 text-slate-500" : "bg-white border-slate-200 text-slate-500")
               )}
             >
               {btn.label} {sortConfig.key === btn.key && (sortConfig.direction === "asc" ? "↑" : "↓")}
             </button>
           ))}
        </div>
        {sortedPositions.map((pos) => {
          const posIndicatorColor = pos.latentPL >= 0 ? "text-emerald-500" : "text-rose-500";
          return (
            <div key={pos.label} className={cn("p-4 flex flex-col gap-3 transition-colors", isDark ? "bg-slate-900" : "bg-white")}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 
                    onClick={(e) => {
                      if (onNavigateToMarket) {
                        e.stopPropagation();
                        onNavigateToMarket(pos.ticker);
                      }
                    }}
                    className={cn("text-sm font-bold leading-tight cursor-pointer active:text-blue-500", isDark ? "text-white" : "text-slate-900")}
                  >
                    {pos.label}
                  </h4>
                  <span className={cn("text-[10px] font-mono font-bold uppercase", accentColor)}>{pos.ticker}</span>
                </div>
                <div className="text-right">
                  <div className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-900")}>{formatCurrency(pos.currentValue)}</div>
                  <div className={cn("text-[10px] font-bold", posIndicatorColor)}>
                    {pos.latentPL >= 0 ? "+" : ""}{pos.latentPLPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
              
              <div className={cn(
                "grid grid-cols-3 gap-2 p-2.5 rounded-lg border transition-colors",
                isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"
              )}>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase text-slate-500 font-bold">Qté / PRU</span>
                  <span className={cn("text-[10px] font-medium", isDark ? "text-slate-300" : "text-slate-700")}>{pos.quantity} @ {pos.averageCost.toFixed(2)}€</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase text-slate-500 font-bold">Cours Actuel</span>
                  <span className={cn("text-[10px] font-bold", accentColor)}>{pos.currentPrice.toFixed(2)}€</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[8px] uppercase text-slate-500 font-bold">Profit Total</span>
                  <span className={cn("text-[10px] font-bold", posIndicatorColor)}>
                    {formatCurrency(pos.totalPL)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

