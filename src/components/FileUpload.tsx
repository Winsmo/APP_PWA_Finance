import React, { useState, useRef } from "react";
import { Upload, Send, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface Props {
  onDataLoaded: (csv: string) => void;
  onManualAdd: (tx: string) => void;
  onReset: () => void;
}

export function FileUpload({ onDataLoaded, onManualAdd, onReset }: Props) {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    ticker: "",
    quantity: "",
    price: "",
    type: "Achat" as "Achat" | "Vente" | "Dividende" | "Frais"
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          onDataLoaded(text);
        } catch (error) {
          console.error("CSV Error", error);
          alert("Erreur lors de la lecture du CSV. Vérifiez le format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { label, ticker, quantity, price, type } = formData;
    if (label && (type === "Dividende" || type === "Frais" || (ticker && quantity && price))) {
      const date = new Date().toLocaleDateString('fr-FR');
      let q = parseFloat(quantity || "0");
      let p = parseFloat(price || "0");
      let op = "";
      let net = 0;

      if (type === "Achat") {
        op = "Achat Comptant";
        net = -(q * p);
      } else if (type === "Vente") {
        op = "Vente Comptant";
        net = (q * p);
      } else if (type === "Dividende") {
        op = "Coupon / Dividende";
        net = p;
        q = 1;
      } else {
        op = "Frais de gestion";
        net = -p; // Fees are negative
        q = 1;
      }
      
      const csvLine = `${label};${op};Manual;${date};${q};${p};${net};0;${net};EUR`;
      onManualAdd(csvLine);
      setFormData({ label: "", ticker: "", quantity: "", price: "", type: "Achat" });
      setIsManualOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <Upload size={16} className="text-blue-600" />
          <label className="text-[11px] text-slate-900 font-black uppercase tracking-widest">1. Import Automatique (Bourse Direct)</label>
        </div>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 cursor-pointer transition-all bg-slate-50 group hover:bg-blue-50/30"
        >
          <Upload size={24} className="mx-auto mb-3 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:-translate-y-1" />
          <p className="text-xs text-slate-600 font-bold mb-1">Cliquer pour sélectionner votre fichier CSV</p>
          <p className="text-[10px] text-slate-400 font-medium">Le format attendu est celui de l'historique Bourse Direct</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <Send size={16} className="text-blue-600" />
          <label className="text-[11px] text-slate-900 font-black uppercase tracking-widest">2. Ajout Manuel d'opération</label>
        </div>
        
        <form onSubmit={handleManualSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
               type="button"
               onClick={() => setFormData({...formData, type: "Achat"})}
               className={cn(
                 "flex-1 py-2 text-[10px] font-bold uppercase rounded-md transition-all",
                 formData.type === "Achat" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
               )}
             >
               Achat
             </button>
             <button 
               type="button"
               onClick={() => setFormData({...formData, type: "Vente"})}
               className={cn(
                 "flex-1 py-2 text-[10px] font-bold uppercase rounded-md transition-all",
                 formData.type === "Vente" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"
               )}
             >
               Vente
             </button>
             <button 
               type="button"
               onClick={() => setFormData({...formData, type: "Dividende"})}
               className={cn(
                 "flex-1 py-2 text-[10px] font-bold uppercase rounded-md transition-all",
                 formData.type === "Dividende" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
               )}
             >
               Dividende
             </button>
             <button 
               type="button"
               onClick={() => setFormData({...formData, type: "Frais"})}
               className={cn(
                 "flex-1 py-2 text-[10px] font-bold uppercase rounded-md transition-all",
                 formData.type === "Frais" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500"
               )}
             >
               Frais
             </button>
           </div>

           <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Nom de l'action / ETF</label>
              <div className="flex flex-col gap-3">
                <input 
                  type="text"
                  required
                  value={formData.label}
                  onChange={e => setFormData({...formData, label: e.target.value})}
                  placeholder="ex: Apple Inc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase mr-1">Raccourcis :</span>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, label: "BITCOIN", ticker: "BTC-EUR"})}
                    className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-black hover:bg-amber-100 transition-colors"
                  >
                    BITCOIN
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, label: "OR", ticker: "GC=F"})}
                    className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded text-[9px] font-black hover:bg-yellow-100 transition-colors"
                  >
                    OR (GOLD)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, type: "Frais", label: "TAXE TRANSAC FINAN"})}
                    className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-black hover:bg-rose-100 transition-colors"
                  >
                    TAXE
                  </button>
                </div>
              </div>
           </div>
           
           {formData.type !== "Dividende" && formData.type !== "Frais" && (
             <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Ticker (Symbole Yahoo Finance)</label>
                <input 
                  type="text"
                  required
                  value={formData.ticker}
                  onChange={e => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
                  placeholder="ex: AAPL"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono transition-all focus:bg-white"
                />
             </div>
           )}

           <div className={cn("grid gap-4", (formData.type === "Dividende" || formData.type === "Frais") ? "grid-cols-1" : "grid-cols-2")}>
             {formData.type !== "Dividende" && formData.type !== "Frais" ? (
               <>
                <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Quantité</label>
                    <input 
                      type="number"
                      step="any"
                      required
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Prix Unitaire (€)</label>
                    <input 
                      type="number"
                      step="any"
                      required
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all focus:bg-white"
                    />
                </div>
               </>
             ) : formData.type === "Dividende" ? (
                <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Montant Net reçu (€)</label>
                    <input 
                      type="number"
                      step="any"
                      required
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none transition-all focus:bg-white text-emerald-600 font-bold"
                    />
                </div>
             ) : (
                <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Montant des Frais (€)</label>
                    <input 
                      type="number"
                      step="any"
                      required
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-rose-500 outline-none transition-all focus:bg-white text-rose-600 font-bold"
                    />
                </div>
             )}
           </div>
          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all text-sm font-bold uppercase tracking-widest mt-4"
          >
            <Send size={14} />
            Ajouter au portefeuille
          </button>
        </form>
      </div>

      <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <Trash2 size={16} className="text-rose-600" />
          <label className="text-[11px] text-slate-900 font-black uppercase tracking-widest">3. Zone de Danger</label>
        </div>
        <p className="text-[10px] text-slate-500 px-1 font-medium mb-1">
          Supprime définitivement toutes les données de transactions, dividendes et frais.
        </p>
        <button 
          onClick={onReset}
          className="flex items-center justify-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 py-3 rounded-lg hover:bg-rose-100 transition-all text-[11px] font-black uppercase tracking-widest"
        >
          <Trash2 size={14} />
          Réinitialiser toutes les données
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".csv" 
        className="hidden" 
      />
    </div>
  );
}
