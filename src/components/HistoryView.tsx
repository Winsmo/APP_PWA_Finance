import { Position } from "../types";
import { cn } from "../lib/utils";
import { History, Landmark, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import React, { useState, useMemo } from "react";

interface Props {
  closedPositions: Position[];
  totalRealizedPL: number;
  totalFees: number;
  onNavigateToMarket?: (ticker: string) => void;
}

export function HistoryView({ closedPositions, totalFees, onNavigateToMarket }: Props) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Position; direction: "asc" | "desc" }>({
    key: "realizedPL",
    direction: "desc",
  });

  const formatCurrency = (val: number) => 
    val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  // Filter out positions that only have dividends and no trading action
  const tradingPositions = useMemo(() => 
    closedPositions.filter(p => Math.abs(p.realizedPL) > 0.01)
  , [closedPositions]);

  const totalTradingPL = useMemo(() => 
    tradingPositions.reduce((acc, p) => acc + p.realizedPL, 0)
  , [tradingPositions]);

  const sortedPositions = useMemo(() => {
    const sortable = [...tradingPositions];
    sortable.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? 0;
      const bVal = b[sortConfig.key] ?? 0;

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
  }, [tradingPositions, sortConfig]);

  const requestSort = (key: keyof Position) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Position }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={10} className="ml-1 opacity-20" />;
    return sortConfig.direction === "asc" ? <ChevronUp size={10} className="ml-1 text-blue-600" /> : <ChevronDown size={10} className="ml-1 text-blue-600" />;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Realized Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            totalTradingPL >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            <History size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total +/- PV Réalisée</p>
            <p className={cn("text-2xl font-black", totalTradingPL >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {formatCurrency(totalTradingPL)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold italic">Ventes Seule (Hors Dividendes / Frais)</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <Landmark size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Frais de Gestion</p>
            <p className="text-2xl font-black text-rose-600">
              {formatCurrency(totalFees)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold italic">Frais de compte / gestion</p>
          </div>
        </div>
      </div>

      {/* Gains/Pertes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Gains & Pertes réalisés (Ventes)</h3>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th 
                  className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => requestSort("label")}
                >
                  <div className="flex items-center">Actif <SortIcon columnKey="label" /></div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => requestSort("averageCost")}
                >
                  <div className="flex items-center justify-end">PRU Sortie <SortIcon columnKey="averageCost" /></div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => requestSort("realizedPL")}
                >
                  <div className="flex items-center justify-end">PV/MV Réalisée <SortIcon columnKey="realizedPL" /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPositions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    Aucune plus-value ou moins-value réalisée pour le moment.
                  </td>
                </tr>
              ) : (
                sortedPositions.map((pos) => {
                  return (
                    <tr key={pos.label} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span 
                            onClick={(e) => {
                              if (onNavigateToMarket) {
                                e.stopPropagation();
                                onNavigateToMarket(pos.ticker);
                              }
                            }}
                            className="text-xs font-bold text-slate-900 cursor-pointer hover:text-blue-500 hover:underline transition-colors"
                          >
                            {pos.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{pos.ticker}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs text-right text-slate-600">
                        {pos.averageCost > 0 ? pos.averageCost.toFixed(2) + " €" : "N/A"}
                      </td>
                      <td className="px-6 py-5 text-xs text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn(
                            "font-bold px-2 py-0.5 rounded",
                            pos.realizedPL >= 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                          )}>
                            {pos.realizedPL >= 0 ? "+" : ""}{pos.realizedPL.toFixed(2)} €
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider",
                          pos.quantity === 0 ? "bg-slate-100 text-slate-400" : "bg-blue-100 text-blue-600"
                        )}>
                          {pos.quantity === 0 ? "SOLDÉ" : "ACTIF"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          <div className="bg-slate-50 p-2 flex gap-2 overflow-x-auto no-scrollbar">
             {[
               { key: "realizedPL", label: "Profit" },
               { key: "averageCost", label: "Prix" },
               { key: "label", label: "Nom" }
             ].map((btn) => (
               <button 
                 key={btn.key}
                 onClick={() => requestSort(btn.key as keyof Position)}
                 className={cn(
                   "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all",
                   sortConfig.key === btn.key 
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white border-slate-200 text-slate-500"
                 )}
               >
                 {btn.label} {sortConfig.key === btn.key && (sortConfig.direction === "asc" ? "↑" : "↓")}
               </button>
             ))}
          </div>
          {sortedPositions.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 italic text-sm">
              Aucune plus-value ou moins-value réalisée pour le moment.
            </div>
          ) : (
            sortedPositions.map((pos) => (
              <div key={pos.label} className="p-4 flex justify-between items-center bg-white">
                <div className="flex flex-col">
                  <span 
                    onClick={(e) => {
                      if (onNavigateToMarket) {
                        e.stopPropagation();
                        onNavigateToMarket(pos.ticker);
                      }
                    }}
                    className="text-xs font-bold text-slate-900 active:text-blue-500"
                  >
                    {pos.label}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">{pos.ticker}</span>
                  <span className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Sortie: {pos.averageCost.toFixed(2)}€</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <span className={cn(
                     "text-xs font-black px-2 py-1 rounded",
                     pos.realizedPL >= 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                   )}>
                     {pos.realizedPL >= 0 ? "+" : ""}{pos.realizedPL.toFixed(2)} €
                   </span>
                   <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest",
                      pos.quantity === 0 ? "text-slate-400" : "text-blue-500"
                    )}>
                      {pos.quantity === 0 ? "Position Soldée" : "Position Active"}
                    </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

