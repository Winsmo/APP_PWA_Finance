import { Transaction } from "../types";
import { Trash2, Edit2, Check, X, Save } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

interface Props {
  transactions: Transaction[];
  onUpdate: (index: number, tx: Transaction) => void;
  onDelete: (index: number) => void;
}

export function TransactionList({ transactions, onUpdate, onDelete }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Transaction | null>(null);

  const startEdit = (index: number, tx: Transaction) => {
    setEditingIndex(index);
    setFormData({ ...tx });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setFormData(null);
  };

  const saveEdit = () => {
    if (editingIndex !== null && formData) {
      onUpdate(editingIndex, formData);
      cancelEdit();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Historique des Transactions</h3>
        <span className="text-[10px] font-bold text-slate-400">{transactions.length} LIGNES</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-100">
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instrument</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opération</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Quantité</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Prix</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Net</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.map((tx, index) => {
              const isEditing = editingIndex === index;
              return (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 text-xs text-slate-600">
                    {isEditing ? (
                      <input 
                        className="w-24 border rounded p-1 text-xs" 
                        value={formData?.date} 
                        onChange={e => setFormData({ ...formData!, date: e.target.value })} 
                      />
                    ) : tx.date}
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-900">
                    {isEditing ? (
                      <input 
                        className="w-32 border rounded p-1 text-xs" 
                        value={formData?.label} 
                        onChange={e => setFormData({ ...formData!, label: e.target.value })} 
                      />
                    ) : tx.label}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">{tx.operation}</td>
                  <td className="px-4 py-4 text-xs text-right font-medium">
                    {isEditing ? (
                      <input 
                        type="number" 
                        className="w-16 border rounded p-1 text-xs text-right" 
                        value={formData?.quantity} 
                        onChange={e => setFormData({ ...formData!, quantity: parseFloat(e.target.value) })} 
                      />
                    ) : tx.quantity}
                  </td>
                  <td className="px-4 py-4 text-xs text-right">
                    {isEditing ? (
                      <input 
                        type="number" 
                        className="w-20 border rounded p-1 text-xs text-right" 
                        value={formData?.price} 
                        onChange={e => setFormData({ ...formData!, price: parseFloat(e.target.value) })} 
                      />
                    ) : tx.price.toFixed(2) + " €"}
                  </td>
                  <td className="px-4 py-4 text-xs text-right font-bold text-slate-700">
                    {isEditing ? (
                       <input 
                        type="number" 
                        className="w-24 border rounded p-1 text-xs text-right" 
                        value={formData?.netAmount} 
                        onChange={e => setFormData({ ...formData!, netAmount: parseFloat(e.target.value) })} 
                      />
                    ) : tx.netAmount.toFixed(2) + " €"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={saveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEdit} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(index, tx)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => onDelete(index)} className="p-1 text-rose-600 hover:bg-rose-50 rounded">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
