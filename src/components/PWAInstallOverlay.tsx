import React, { useState, useEffect } from "react";
import { Download, Smartphone, Compass, Share, CheckCircle2, X, Sparkles, ArrowDown, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface PWAInstallOverlayProps {
  theme: "investiscope" | "forest" | "cyber" | "minimal";
  onDismiss: () => void;
  forceShow?: boolean;
}

export const PWAInstallOverlay: React.FC<PWAInstallOverlayProps> = ({ theme, onDismiss, forceShow }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
    }
  }, [forceShow]);

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    } else {
      setPlatform("other");
    }

    // Detect if running as standalone PWA
    const checkPWA = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
      
      // Auto-show only on mobile when not standalone, and not dismissed in this session
      const dismissed = sessionStorage.getItem("pwa_install_dismissed");
      const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
      if (!isStandaloneMode && isMobile && !dismissed) {
        setIsVisible(true);
      }
    };

    checkPWA();

    // Catch the standard Chrome/Android install prompt
    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Auto-show if Android to provide interactive direct button
      const dismissed = sessionStorage.getItem("pwa_install_dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforePrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforePrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
      setDeferredPrompt(null);
      handleClose();
    }
  };

  const handleClose = () => {
    sessionStorage.setItem("pwa_install_dismissed", "true");
    setIsVisible(false);
    onDismiss();
  };

  // Skip rendering if already standalone or dismissed
  if (!isVisible || isStandalone) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center items-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className={cn(
            "w-full max-w-md rounded-[2rem] border overflow-hidden shadow-2xl flex flex-col relative my-auto",
            theme === "cyber" ? "bg-slate-900 border-amber-500/30 text-white" :
            theme === "forest" ? "bg-emerald-950 border-emerald-800 text-emerald-50" :
            "bg-white border-slate-200 text-slate-800"
          )}
        >
          {/* Close trigger */}
          <button 
            onClick={handleClose} 
            className={cn(
              "absolute top-5 right-5 p-2 rounded-full transition-colors z-20",
              theme === "cyber" ? "hover:bg-amber-500/10 text-slate-400 hover:text-white" :
              theme === "forest" ? "hover:bg-emerald-900 text-emerald-300" :
              "hover:bg-slate-100 text-slate-400 hover:text-slate-800"
            )}
          >
            <X size={18} />
          </button>

          {/* Core Content */}
          <div className="p-8 flex flex-col items-center text-center">
            {/* Minimal App Icon Mockup */}
            <div className="relative mb-6 mt-2">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-violet-600 to-emerald-500 p-[3px] shadow-2xl flex items-center justify-center">
                <div className="w-full h-full rounded-[13px] bg-slate-950 flex items-center justify-center font-black text-2xl text-white italic">
                  I
                </div>
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md animate-bounce",
                theme === "cyber" ? "bg-amber-500 text-black" : "bg-blue-600"
              )}>
                <Sparkles size={12} />
              </div>
            </div>

            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3",
              theme === "cyber" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
              theme === "forest" ? "bg-emerald-800/50 text-emerald-300" :
              "bg-blue-50 text-blue-600 border border-blue-100"
            )}>
              Application Mobile InvestiScope
            </span>

            <h3 className={cn(
              "text-2xl md:text-3xl font-black tracking-tight leading-tight mb-3 px-2",
              theme === "cyber" ? "text-white" : theme === "forest" ? "text-emerald-50" : "text-slate-900"
            )}>
              Installer sur l'écran d'accueil
            </h3>
            
            <p className="text-sm text-slate-400 dark:text-emerald-300/60 max-w-xs mb-8">
              Ajoutez InvestiScope sur votre téléphone comme une véritable application mobile PWA. Lancement rapide, plein écran et navigation optimisée.
            </p>

            {/* Platform Instructions */}
            <div className={cn(
              "w-full rounded-2xl p-5 mb-6 text-left border",
              theme === "cyber" ? "bg-slate-950/60 border-slate-800" :
              theme === "forest" ? "bg-emerald-900/40 border-emerald-900" :
              "bg-slate-50 border-slate-100"
            )}>
              {platform === "ios" ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-800/80 p-1.5 rounded-lg text-white">
                      <Share size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-emerald-300/40">Étape 1</h4>
                      <p className="text-xs font-medium text-slate-400 dark:text-emerald-100/80 mt-0.5">
                        Appuyez sur le bouton de <span className="font-extrabold text-blue-500">Partage</span> (icône carrée avec flèche vers le haut au bas de Safari).
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-800/80 p-1.5 rounded-lg text-white">
                      <span className="text-xs font-extrabold">+</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-emerald-300/40">Étape 2</h4>
                      <p className="text-xs font-medium text-slate-400 dark:text-emerald-100/80 mt-0.5">
                        Faites défiler vers le bas et sélectionnez <span className="font-extrabold text-white dark:text-emerald-100">"Sur l'écran d'accueil"</span>.
                      </p>
                    </div>
                  </div>
                </div>
              ) : platform === "android" && deferredPrompt ? (
                <div className="space-y-4 text-center py-2">
                  <p className="text-xs font-bold text-slate-400 dark:text-emerald-100/80">
                    Installez directement en un clic grâce au bouton ci-dessous !
                  </p>
                  <button 
                    onClick={handleInstallClick}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer",
                      theme === "cyber" ? "bg-amber-500 text-black shadow-amber-500/20" :
                      theme === "forest" ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20" :
                      "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-200"
                    )}
                  >
                    <Download size={14} />
                    Installer Maintenant
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-800/80 p-1.5 rounded-lg text-white">
                      <Compass size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-emerald-300/40">Installation Chrome / Safari</h4>
                      <p className="text-xs font-medium text-slate-400 dark:text-emerald-100/80 mt-0.5">
                        Ouvrez le menu de votre navigateur (les trois points verticaux ou l'icône de partage) puis cliquez sur <span className="font-extrabold">"Installer l'application"</span> ou <span className="font-extrabold">"Ajouter à l'écran d'accueil"</span>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Back options */}
            <div className="flex flex-col gap-3 w-full">
              {platform === "android" && !deferredPrompt && (
                <p className="text-[10px] text-slate-400 dark:text-emerald-300/40 italic mb-2">
                  Si le bouton de téléchargement ne s'affiche pas, ouvrez les réglages de votre navigateur pour l'ajouter manuellement.
                </p>
              )}
              <button
                onClick={handleClose}
                className={cn(
                  "w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border",
                  theme === "cyber" ? "border-slate-855 text-slate-400 hover:text-white hover:bg-slate-800/30" :
                  theme === "forest" ? "border-emerald-800 text-emerald-300 hover:bg-emerald-900/30" :
                  "border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                Continuer en Ligne
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
