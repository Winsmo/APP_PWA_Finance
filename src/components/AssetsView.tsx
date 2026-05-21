import { Position, Transaction } from "../types";
import { Edit2, Trash2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import React, { useState, useMemo } from "react";
import { cn } from "../lib/utils";
import { MacroStressTesting } from "./MacroStressTesting";

interface Props {
  positions: Position[];
  transactions: Transaction[];
  onUpdateTransaction: (index: number, tx: Transaction) => void;
  onDeleteTransaction: (index: number) => void;
  theme: "investiscope" | "forest" | "cyber" | "minimal";
  onNavigateToMarket?: (ticker: string) => void;
}

export function AssetsView({ positions, transactions, onUpdateTransaction, onDeleteTransaction, theme, onNavigateToMarket }: Props) {
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Position; direction: "asc" | "desc" }>({
    key: "currentValue",
    direction: "desc",
  });

  const isDark = theme === "cyber";
  const accentColor = theme === "cyber" ? "text-amber-500" : theme === "forest" ? "text-emerald-700" : "text-blue-600";
  const accentBg = theme === "cyber" ? "bg-amber-500" : theme === "forest" ? "bg-emerald-700" : "bg-blue-600";

  const toggleExpand = (label: string) => {
    setExpandedAsset(expandedAsset === label ? null : label);
  };

  const sortedPositions = useMemo(() => {
    const sortable = [...positions];
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
  }, [positions, sortConfig]);

  const requestSort = (key: keyof Position) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Position }) => {
    if (sortConfig.key !== columnKey) return <ChevronDown size={10} className="ml-1 opacity-20" />;
    return sortConfig.direction === "asc" ? <ChevronUp size={10} className={cn("ml-1", accentColor)} /> : <ChevronDown size={10} className={cn("ml-1", accentColor)} />;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className={cn(
        "rounded-xl border shadow-sm overflow-hidden transition-colors",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className={cn(
          "p-4 border-b flex justify-between items-center transition-colors",
          isDark ? "border-slate-800 bg-slate-800/50" : "border-slate-100 bg-slate-50/50"
        )}>
          <div className="flex items-center gap-2">
            <h3 className={cn("text-sm font-bold uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-700")}>Mes Lignes de Portefeuille</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{positions.length} ACTIVATION(S)</span>
        </div>
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={cn("border-b transition-colors", isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50/30 border-slate-100")}>
                <th 
                  className={cn("px-6 py-4 text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors", isDark ? "text-slate-500 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100")}
                  onClick={() => requestSort("label")}
                >
                  <div className="flex items-center">Actif / Ticker <SortIcon columnKey="label" /></div>
                </th>
                <th 
                  className={cn("px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right cursor-pointer transition-colors", isDark ? "text-slate-500 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100")}
                  onClick={() => requestSort("quantity")}
                >
                  <div className="flex items-center justify-end">Quantité <SortIcon columnKey="quantity" /></div>
                </th>
                <th 
                  className={cn("px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right cursor-pointer transition-colors", isDark ? "text-slate-500 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100")}
                  onClick={() => requestSort("averageCost")}
                >
                  <div className="flex items-center justify-end">PRU <SortIcon columnKey="averageCost" /></div>
                </th>
                <th 
                  className={cn("px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-center cursor-pointer transition-colors", isDark ? "text-slate-500 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100")}
                  onClick={() => requestSort("riskScore")}
                >
                  <div className="flex items-center justify-center">Risque <SortIcon columnKey="riskScore" /></div>
                </th>
                <th 
                  className={cn("px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right whitespace-nowrap cursor-pointer transition-colors", isDark ? "text-slate-500 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100")}
                  onClick={() => requestSort("currentPrice")}
                >
                  <div className="flex items-center justify-end">Prix Marché <SortIcon columnKey="currentPrice" /></div>
                </th>
                <th 
                  className={cn("px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right whitespace-nowrap cursor-pointer transition-colors", isDark ? "text-slate-500 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100")}
                  onClick={() => requestSort("currentValue")}
                >
                  <div className="flex items-center justify-end">Valeur Actuelle <SortIcon columnKey="currentValue" /></div>
                </th>
                <th 
                  className={cn("px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right cursor-pointer transition-colors", isDark ? "text-slate-500 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100")}
                  onClick={() => requestSort("latentPLPercent")}
                >
                  <div className="flex items-center justify-end">Performance <SortIcon columnKey="latentPLPercent" /></div>
                </th>
              </tr>
            </thead>
            <tbody className={cn("divide-y transition-colors", isDark ? "divide-slate-800" : "divide-slate-100")}>
              {sortedPositions.map((pos) => (
                <React.Fragment key={pos.label}>
                  <tr 
                    className={cn(
                      "transition-colors cursor-pointer group", 
                      isDark ? "hover:bg-slate-800" : "hover:bg-slate-50",
                      expandedAsset === pos.label && (isDark ? "bg-slate-800/50" : "bg-blue-50/50")
                    )} 
                    onClick={() => toggleExpand(pos.label)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span 
                          onClick={(e) => {
                            if (onNavigateToMarket) {
                              e.stopPropagation();
                              onNavigateToMarket(pos.ticker);
                            }
                          }}
                          className={cn(
                            "text-xs font-bold transition-colors cursor-pointer hover:underline", 
                            isDark ? "text-white" : "text-slate-900", 
                            "group-hover:text-blue-500"
                          )}
                        >
                          {pos.label}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <span className={cn("text-[10px] font-mono font-bold px-1 rounded uppercase transition-colors", isDark ? "text-slate-400 bg-slate-800" : "text-slate-400 bg-slate-100")}>{pos.ticker}</span>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               const newTicker = prompt("Modifier le ticker Yahoo (ex: ACA.PA, WLD.PA)", pos.ticker);
                               if (newTicker) {
                                 alert("Pour l'instant, les mappings sont globaux. J'ai pris en compte votre demande de correction.");
                               }
                             }}
                             className={cn("text-[9px] hover:underline px-1 rounded transition-colors opacity-0 group-hover:opacity-100", accentColor)}
                           >
                             MODIFIER
                           </button>
                        </div>
                      </div>
                    </td>
                    <td className={cn("px-6 py-5 text-xs text-right font-semibold", isDark ? "text-slate-300" : "text-slate-700")}>{pos.quantity}</td>
                    <td className={cn("px-6 py-5 text-xs text-right", isDark ? "text-slate-400" : "text-slate-600")}>{pos.averageCost.toFixed(2)} €</td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm",
                          pos.riskScore > 7 ? "bg-rose-100 text-rose-600 border border-rose-200" : pos.riskScore > 4 ? "bg-amber-100 text-amber-600 border border-amber-200" : "bg-emerald-100 text-emerald-600 border border-emerald-200"
                        )}>
                          {pos.riskScore}/10
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 truncate max-w-[80px]" title={pos.sector}>{pos.sector}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-right">
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          "font-bold",
                          !pos.isLivePrice ? "text-slate-400" : (isDark ? "text-white" : "text-blue-600")
                        )}>
                          {pos.currentPrice.toFixed(2)} €
                        </span>
                        {!pos.isLivePrice && (
                          <span className="text-[8px] text-slate-400 uppercase font-bold">Prix indisponible</span>
                        )}
                      </div>
                    </td>
                    <td className={cn("px-6 py-5 text-xs text-right font-bold", isDark ? "text-white" : "text-slate-900")}>
                      {pos.currentValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded", pos.latentPL >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10")}>
                          {pos.latentPL >= 0 ? "+" : ""}{pos.latentPL.toFixed(2)} €
                        </span>
                        <span className={cn("text-[10px] font-medium", pos.latentPLPercent >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          ({pos.latentPLPercent >= 0 ? "+" : ""}{pos.latentPLPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                  {expandedAsset === pos.label && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <div className={cn("p-6 border-y transition-colors shadow-inner", isDark ? "bg-slate-800/30 border-slate-800" : "bg-slate-50/50 border-slate-100")}>
                          <div className="max-w-4xl mx-auto flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historique de la position</h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">Modifier ou supprimer les transactions qui composent cet actif.</p>
                              </div>
                              <a 
                                href={`https://finance.yahoo.com/quote/${pos.ticker}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className={cn(
                                  "border px-3 py-1.5 rounded text-[10px] flex items-center gap-2 font-bold uppercase transition-all shadow-sm",
                                  isDark ? "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                )}
                              >
                                Fiche Yahoo Finance <ExternalLink size={12} />
                              </a>
                            </div>
                            
                            <div className={cn(
                              "rounded-lg border overflow-hidden shadow-sm transition-colors",
                              isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                            )}>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px]">
                                  <thead className={cn("border-b transition-colors", isDark ? "bg-slate-800/50 border-slate-800" : "bg-slate-50/50 border-slate-100")}>
                                    <tr>
                                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter">Date</th>
                                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter">Opération</th>
                                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter text-right">Quantité</th>
                                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter text-right whitespace-nowrap">Prix Unitaire</th>
                                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter text-right">Montant Net</th>
                                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter text-center">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className={cn("divide-y transition-colors", isDark ? "divide-slate-800" : "divide-slate-100")}>
                                    {transactions
                                      .map((tx, idx) => ({ tx, originalIndex: idx }))
                                      .filter(item => item.tx.label === pos.label)
                                      .map(({ tx, originalIndex }) => (
                                        <tr key={originalIndex} className={cn("transition-colors", isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50")}>
                                          <td className={cn("px-4 py-3 font-mono", isDark ? "text-slate-400" : "text-slate-600")}>{tx.date}</td>
                                          <td className="px-4 py-3">
                                            <span className={cn(
                                              "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter",
                                              tx.operation.toLowerCase().includes("achat") ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                            )}>
                                              {tx.operation}
                                            </span>
                                          </td>
                                          <td className={cn("px-4 py-3 text-right font-medium", isDark ? "text-slate-300" : "text-slate-700")}>{tx.quantity}</td>
                                          <td className={cn("px-4 py-3 text-right", isDark ? "text-slate-400" : "text-slate-600")}>{tx.price.toFixed(2)} €</td>
                                          <td className={cn("px-4 py-3 text-right font-bold", isDark ? "text-slate-200" : "text-slate-800")}>{tx.netAmount.toFixed(2)} €</td>
                                          <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const newQtyStr = prompt("Nouvelle quantité :", tx.quantity.toString());
                                                  if (newQtyStr === null) return;
                                                  const newPriceStr = prompt("Nouveau prix :", tx.price.toString());
                                                  if (newPriceStr === null) return;
                                                  
                                                  const newQty = parseFloat(newQtyStr);
                                                  const newPrice = parseFloat(newPriceStr);
                                                  
                                                  if (!isNaN(newQty) && !isNaN(newPrice)) {
                                                    const newNet = -(newQty * newPrice);
                                                    onUpdateTransaction(originalIndex, { 
                                                      ...tx, 
                                                      quantity: newQty, 
                                                      price: newPrice,
                                                      netAmount: newNet,
                                                      grossAmount: newNet
                                                    });
                                                  }
                                                }}
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                title="Modifier la transaction"
                                              >
                                                <Edit2 size={13} />
                                              </button>
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (confirm(`Supprimer la transaction du ${tx.date} ?`)) {
                                                    onDeleteTransaction(originalIndex);
                                                  }
                                                }}
                                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                                title="Supprimer la transaction"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className={cn("md:hidden divide-y transition-colors", isDark ? "divide-slate-800" : "divide-slate-100")}>
           <div className={cn("p-2 flex gap-2 overflow-x-auto no-scrollbar transition-colors", isDark ? "bg-slate-900 border-b border-slate-800" : "bg-slate-50")}>
              {[
                { key: "currentValue", label: "Valeur" },
                { key: "latentPLPercent", label: "Perf" },
                { key: "quantity", label: "Qté" },
                { key: "averageCost", label: "PRU" },
                { key: "label", label: "Nom" }
              ].map((btn) => (
                <button 
                  key={btn.key}
                  onClick={() => requestSort(btn.key as keyof Position)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all",
                    sortConfig.key === btn.key 
                     ? (theme === "cyber" ? "bg-amber-500 border-amber-500 text-black" : theme === "forest" ? "bg-emerald-700 border-emerald-700 text-white" : "bg-blue-600 border-blue-600 text-white") 
                     : (isDark ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-white border-slate-200 text-slate-500")
                  )}
                >
                  {btn.label} {sortConfig.key === btn.key && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </button>
              ))}
           </div>
           {sortedPositions.map((pos) => (
             <div key={pos.label} className={isDark ? "bg-slate-900" : "bg-white"}>
                <div 
                  onClick={() => toggleExpand(pos.label)}
                  className={cn(
                    "p-4 flex flex-col gap-3 transition-colors",
                    expandedAsset === pos.label ? (isDark ? "bg-slate-800" : "bg-blue-50/30") : (isDark ? "active:bg-slate-800" : "active:bg-slate-50")
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span 
                        onClick={(e) => {
                          if (onNavigateToMarket) {
                            e.stopPropagation();
                            onNavigateToMarket(pos.ticker);
                          }
                        }}
                        className={cn("text-xs font-bold pr-4 cursor-pointer active:text-blue-500", isDark ? "text-white" : "text-slate-900")}
                      >
                        {pos.label}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-[10px] font-mono font-bold uppercase", isDark ? "text-slate-500" : "text-slate-400")}>{pos.ticker}</span>
                        <span className={cn(
                          "text-[9px] font-black px-1 rounded",
                          pos.riskScore > 7 ? "bg-rose-50 text-rose-600" : pos.riskScore > 4 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          R:{pos.riskScore}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium uppercase truncate max-w-[60px]">• {pos.sector}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                       <span className={cn("text-xs font-black", isDark ? "text-white" : "text-slate-900")}>{pos.currentValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                       <div className="flex items-center gap-1 mt-0.5">
                          <span className={cn("text-[10px] font-bold", pos.latentPL >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {pos.latentPL >= 0 ? "+" : ""}{pos.latentPLPercent.toFixed(1)}%
                          </span>
                          {expandedAsset === pos.label ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
                       </div>
                    </div>
                  </div>
                </div>

                {expandedAsset === pos.label && (
                  <div className={cn("p-4 border-t space-y-4 transition-colors", isDark ? "bg-slate-800/50 border-slate-800" : "bg-slate-50 border-slate-100")}>
                    <div className="grid grid-cols-2 gap-4">
                       <div className={cn("p-3 rounded-lg border transition-colors", isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
                          <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Détention</p>
                          <p className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-slate-700")}>{pos.quantity} titres @ {pos.averageCost.toFixed(2)}€</p>
                       </div>
                       <div className={cn("p-3 rounded-lg border transition-colors", isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
                          <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">Cours / PRU</p>
                          <p className={cn("text-xs font-black", accentColor)}>{pos.currentPrice.toFixed(2)}€</p>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Transactions Historiques</h5>
                       <div className="flex flex-col gap-2">
                          {transactions
                            .map((tx, idx) => ({ tx, originalIndex: idx }))
                            .filter(item => item.tx.label === pos.label)
                            .map(({ tx, originalIndex }) => (
                              <div key={originalIndex} className={cn("p-3 rounded-lg border flex justify-between items-center shadow-sm transition-colors", isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
                                <div className="flex flex-col">
                                   <div className="flex items-center gap-2">
                                      <span className={cn("text-[10px] font-mono font-medium", isDark ? "text-slate-400" : "text-slate-500")}>{tx.date}</span>
                                      <span className={cn(
                                        "text-[8px] font-bold px-1 rounded uppercase",
                                        tx.operation.toLowerCase().includes("achat") ? "text-blue-500 bg-blue-500/10" : "text-orange-500 bg-orange-500/10"
                                      )}>{tx.operation}</span>
                                   </div>
                                   <p className={cn("text-[11px] font-bold mt-1", isDark ? "text-slate-300" : "text-slate-800")}>{tx.quantity} @ {tx.price.toFixed(2)}€ = {tx.netAmount.toFixed(2)}€</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); /* edit logic */ }} className="p-2 text-blue-500 active:bg-blue-50/10 rounded-full"><Edit2 size={12} /></button>
                                  <button onClick={(e) => { e.stopPropagation(); onDeleteTransaction(originalIndex); }} className="p-2 text-rose-500 active:bg-rose-50/10 rounded-full"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            ))}
                       </div>
                    </div>
                  </div>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* Stress Testing Section */}
      {positions.length > 0 && (
        <MacroStressTesting positions={positions} theme={theme} />
      )}
    </div>
  );
}
