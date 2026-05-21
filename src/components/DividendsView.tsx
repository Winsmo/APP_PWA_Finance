import { Transaction, Position } from "../types";
import { cn } from "../lib/utils";
import { TrendingUp, Calendar, Landmark, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import React, { useState, useMemo } from "react";

interface Props {
  transactions: Transaction[];
  totalDividends: number;
}

export function DividendsView({ transactions, totalDividends }: Props) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: "asc" | "desc" }>({
    key: "date",
    direction: "desc",
  });

  const dividendTransactions = useMemo(() => 
    transactions.filter(tx => 
      tx.operation.toLowerCase().includes("coupon") || 
      tx.operation.toLowerCase().includes("dividende")
    )
  , [transactions]);

  const sortedTransactions = useMemo(() => {
    const sortable = [...dividendTransactions];
    sortable.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? 0;
      const bVal = b[sortConfig.key] ?? 0;

      if (typeof aVal === "string" && typeof bVal === "string") {
        if (sortConfig.key === "date") {
          // Assuming YYYY-MM-DD or similar sortable date format
          return sortConfig.direction === "asc" 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
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
  }, [dividendTransactions, sortConfig]);

  const requestSort = (key: keyof Transaction) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Transaction }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={10} className="ml-1 opacity-20" />;
    return sortConfig.direction === "asc" ? <ChevronUp size={10} className="ml-1 text-blue-600" /> : <ChevronDown size={10} className="ml-1 text-blue-600" />;
  };

  const formatCurrency = (val: number) => 
    val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  return (
    <div className="flex flex-col gap-6">
      {/* Dividend Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Dividendes Perçus</p>
            <p className="text-2xl font-black text-emerald-600">
              {formatCurrency(totalDividends)}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre de Paiements</p>
            <p className="text-2xl font-black text-slate-900">{dividendTransactions.length}</p>
          </div>
        </div>
      </div>

      {/* Dividends Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Détail des Dividendes</h3>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th 
                  className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => requestSort("date")}
                >
                  <div className="flex items-center">Date <SortIcon columnKey="date" /></div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => requestSort("label")}
                >
                  <div className="flex items-center">Actif <SortIcon columnKey="label" /></div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => requestSort("grossAmount")}
                >
                  <div className="flex items-center justify-end">Montant Brut <SortIcon columnKey="grossAmount" /></div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => requestSort("netAmount")}
                >
                  <div className="flex items-center justify-end">Montant Net <SortIcon columnKey="netAmount" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    Aucun dividende enregistré.
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 text-xs text-slate-600 font-mono">
                      {tx.date}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{tx.label}</span>
                        <span className="text-[10px] text-slate-400 uppercase">DIVIDENDE</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-right text-slate-500">
                      {tx.grossAmount.toFixed(2)} €
                    </td>
                    <td className="px-6 py-5 text-xs text-right font-bold text-emerald-600">
                      +{tx.netAmount.toFixed(2)} €
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          <div className="bg-slate-50 p-2 flex gap-2 overflow-x-auto no-scrollbar">
             {[
               { key: "date", label: "Date" },
               { key: "netAmount", label: "Montant" },
               { key: "label", label: "Nom" }
             ].map((btn) => (
               <button 
                 key={btn.key}
                 onClick={() => requestSort(btn.key as keyof Transaction)}
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
          {sortedTransactions.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 italic text-sm">
              Aucun dividende enregistré.
            </div>
          ) : (
            sortedTransactions.map((tx, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center bg-white">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900">{tx.label}</span>
                  <span className="text-[9px] font-mono text-slate-400">{tx.date}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-emerald-600">+{tx.netAmount.toFixed(2)} €</span>
                  <span className="text-[9px] text-slate-400">Brut: {tx.grossAmount.toFixed(2)}€</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

