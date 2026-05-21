import { Settings, RefreshCw, Clock, Trash2, ShieldAlert, Palette, Check, Download, Smartphone } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface SettingsViewProps {
  refreshInterval: number;
  onRefreshIntervalChange: (value: number) => void;
  onResetData: () => void;
  theme: "investiscope" | "forest" | "cyber" | "minimal";
  onThemeChange: (theme: "investiscope" | "forest" | "cyber" | "minimal") => void;
  onInstallClick?: () => void;
}

const THEMES = [
  { id: "investiscope", name: "InvestiScope", colors: ["#0f172a", "#2563eb"], desc: "Deep Slate & Blue (Défaut)" },
  { id: "forest", name: "Forest", colors: ["#022c22", "#059669"], desc: "Émeraude & Nature" },
  { id: "cyber", name: "Cyberpunk", colors: ["#020617", "#f59e0b"], desc: "Néon & Contraste" },
  { id: "minimal", name: "Minimalist", colors: ["#f4f4f5", "#18181b"], desc: "Épuré & Clair" },
] as const;

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  refreshInterval, 
  onRefreshIntervalChange,
  onResetData,
  theme,
  onThemeChange,
  onInstallClick
}) => {
  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className={cn("p-3 text-white rounded-xl shadow-lg transition-colors", 
          theme === "investiscope" ? "bg-slate-900" : 
          theme === "forest" ? "bg-emerald-950" : 
          theme === "cyber" ? "bg-amber-500 text-slate-950" : "bg-zinc-800")}>
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Paramètres</h1>
          <p className="text-slate-500 font-medium">Personnalisez votre expérience InvestiScope</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2"
        >
          <div className="flex items-center gap-2 mb-6 text-slate-900">
            <Palette size={20} className="text-blue-600" />
            <h2 className="font-bold text-lg uppercase tracking-tight">Thème de l'application</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                className={cn(
                  "relative flex flex-col p-4 rounded-xl border-2 transition-all text-left group",
                  theme === t.id ? "border-blue-600 bg-blue-50/30" : "border-slate-100 hover:border-slate-300 bg-white"
                )}
              >
                {theme === t.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md">
                    <Check size={12} />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                   <div className="flex -space-x-2">
                     {t.colors.map((c, i) => (
                       <div key={i} className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
                     ))}
                   </div>
                   <span className="text-sm font-black text-slate-900">{t.name}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Refresh Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4 text-blue-600">
            <RefreshCw size={20} className="animate-spin-slow" />
            <h2 className="font-bold text-lg uppercase tracking-tight">Rafraîchissement</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Clock size={14} />
                  Fréquence d'actualisation (secondes)
                </span>
                <span className="text-blue-600 font-black text-lg">{refreshInterval}s</span>
              </label>
              <input 
                type="range" 
                min="5" 
                max="300" 
                step="5"
                value={refreshInterval}
                onChange={(e) => onRefreshIntervalChange(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Rapide (5s)</span>
                <span>Lent (5m)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* PWA Mobile Installation Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4 text-slate-900">
            <Smartphone size={20} className="text-blue-600" />
            <h2 className="font-bold text-lg uppercase tracking-tight">Application Mobile (PWA)</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs text-slate-500 leading-normal">
              Ajoutez l'application sur l'écran d'accueil de votre téléphone pour de meilleures performances, une navigation sans distraction et un démarrage rapide en plein écran.
            </p>
            
            <button 
              onClick={onInstallClick}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer border",
                theme === "cyber" ? "bg-amber-500 text-slate-950 border-amber-500 hover:bg-amber-450" : 
                theme === "forest" ? "bg-emerald-700 hover:bg-emerald-600 border-emerald-700" :
                "bg-blue-600 hover:bg-blue-500 border-blue-600"
              )}
            >
              <Download size={14} className="animate-bounce" />
              Installer sur mon mobile
            </button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4 text-rose-600">
            <ShieldAlert size={20} />
            <h2 className="font-bold text-lg uppercase tracking-tight">Zone de Danger</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Ces actions sont irréversibles. Soyez prudent avant de continuer.
            </p>
            
            <button 
              onClick={onResetData}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold hover:bg-rose-600 hover:text-white transition-all group"
            >
              <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
              Réinitialiser les données
            </button>
          </div>
        </motion.div>
      </div>

      <div className="mt-12 flex justify-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
          InvestiScope Pro High Performance • Version 2.5.0
        </p>
      </div>
    </div>
  );
};
