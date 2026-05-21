import React, { useState, useEffect, useMemo } from "react";
import { Home, LineChart, Landmark, ArrowLeft, Info, Percent, Euro, Map as MapIcon, Calculator, Search, MapPin, Building, Trees, Car, TrendingUp, Filter, List, ChevronRight, Maximize2, Tag, RefreshCw, History, Target } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, LayersControl } from 'react-leaflet';
import L from 'leaflet';

// Property Types
type PropertyType = "apartment" | "house" | "terrain" | "parking";
type RoomType = "T1" | "T2" | "T3" | "T4" | "T5+";

interface Listing {
  id: string;
  type: PropertyType;
  rooms?: RoomType;
  price: number;
  surface: number;
  address: string;
  lat: number;
  lon: number;
  description: string;
  features: string[];
  url: string;
}

interface DVFRecord {
  id: string;
  date: string;
  price: number;
  surface: number;
  type: string;
  rooms: number;
  lat: number;
  lon: number;
}

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getExternalLink = (listing: Listing) => {
  const city = listing.address.split(',').pop()?.trim() || "France";
  // Create a precise search instead of a direct link which often 404s due to session IDs
  const query = `${listing.type} ${listing.rooms || ""} ${listing.surface}m2 ${city} ${listing.price}€`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}+site:leboncoin.fr+OR+site:seloger.com+OR+site:bienici.com`;
};

interface RealEstateSimulatorViewProps {
  theme: string;
  onBack: () => void;
}

export const RealEstateSimulatorView: React.FC<RealEstateSimulatorViewProps> = ({ theme, onBack }) => {
  const isDark = theme === "cyber" || theme === "forest";
  const [activeTab, setActiveTab] = useState<"simulator" | "map">("simulator");

  // Shared state to allow "Simulate This" from Map
  const [price, setPrice] = useState(250000);
  const [downPayment, setDownPayment] = useState(50000);
  const [rate, setRate] = useState(3.5);
  const [duration, setDuration] = useState(20);
  const [feesPercent, setFeesPercent] = useState(8); 
  const [monthlyCharges, setMonthlyCharges] = useState(150);
  const [propertyTax, setPropertyTax] = useState(1200);
  const [insurancePNO, setInsurancePNO] = useState(150);
  const [managementFeesPercent, setManagementFeesPercent] = useState(0);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [monthlyRent, setMonthlyRent] = useState(1100);
  const [appreciationRate, setAppreciationRate] = useState(1.5);
  const [renovationCosts, setRenovationCosts] = useState(0);

  const handleSimulateListing = (listing: Listing) => {
     setPrice(listing.price);
     setMonthlyRent(Math.round((listing.price * 0.045) / 12));
     setActiveTab("simulator");
  };

  const totalFees = (price * feesPercent) / 100;
  const totalInvestment = price + totalFees + renovationCosts;
  const totalLoan = totalInvestment - downPayment;
  
  const calculateMortgage = () => {
    const monthlyRate = rate / 100 / 12;
    const numPayments = duration * 12;
    if (monthlyRate === 0) return totalLoan / numPayments;
    return (totalLoan * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  const monthlyMortgage = calculateMortgage();
  const effectiveMonthlyRent = monthlyRent * (1 - vacancyRate / 100);
  const monthlyManagementFees = (effectiveMonthlyRent * managementFeesPercent) / 100;
  const monthlyPropertyTax = propertyTax / 12;
  const monthlyInsurance = insurancePNO / 12;

  const netCashflow = effectiveMonthlyRent - monthlyMortgage - monthlyCharges - monthlyManagementFees - monthlyPropertyTax - monthlyInsurance;
  
  const grossYield = (monthlyRent * 12) / price * 100;
  const netYield = ((monthlyRent * 12 * (1 - vacancyRate / 100)) - (monthlyCharges * 12) - propertyTax - insurancePNO - (monthlyRent * 12 * managementFeesPercent / 100)) / totalInvestment * 100;

  const priceAfterDuration = price * Math.pow(1 + appreciationRate / 100, duration);
  const totalCashflowContribution = netCashflow * duration * 12;
  const wealthAtEnd = priceAfterDuration + totalCashflowContribution;
  const totalInterest = (monthlyMortgage * duration * 12) - totalLoan;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className={cn("flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all", isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")}
        >
          <ArrowLeft size={16} /> Retour Accueil
        </button>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
           <button 
             onClick={() => setActiveTab("simulator")}
             className={cn(
               "flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === "simulator" ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
             )}
           >
             <Calculator size={14} /> Simulateur
           </button>
           <button 
             onClick={() => setActiveTab("map")}
             className={cn(
               "flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === "map" ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
             )}
           >
             <MapIcon size={14} /> Carte
           </button>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-600/20">
              <Home size={24} />
           </div>
           <h2 className={cn("text-3xl font-black tracking-tighter uppercase", isDark ? "text-white" : "text-slate-900")}>Immobilier</h2>
        </div>
      </div>

      {activeTab === "simulator" ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs Section */}
        <div className="lg:col-span-1 space-y-6">
           <div className={cn("p-6 rounded-[2.5rem] border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 px-1">Paramètres de l'Achat</h3>
              
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Prix du bien (€)</label>
                  <input 
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Apport Personnel (€)</label>
                  <input 
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Taux (%)</label>
                    <input 
                      type="number"
                      value={rate}
                      step="0.1"
                      onChange={(e) => setRate(Number(e.target.value))}
                      className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Durée (ans)</label>
                    <input 
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Travaux de Rénovation (€)</label>
                  <input 
                    type="number"
                    value={renovationCosts}
                    onChange={(e) => setRenovationCosts(Number(e.target.value))}
                    className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-black text-sm transition-all outline-none focus:ring-2", isDark ? "bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/20" : "focus:ring-emerald-500/10")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Taxe Foncière (An)</label>
                    <input 
                      type="number"
                      value={propertyTax}
                      onChange={(e) => setPropertyTax(Number(e.target.value))}
                      className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Assurance PNO (An)</label>
                    <input 
                      type="number"
                      value={insurancePNO}
                      onChange={(e) => setInsurancePNO(Number(e.target.value))}
                      className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Gestion (%)</label>
                    <input 
                      type="number"
                      value={managementFeesPercent}
                      onChange={(e) => setManagementFeesPercent(Number(e.target.value))}
                      className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Vacance (%)</label>
                    <input 
                      type="number"
                      value={vacancyRate}
                      onChange={(e) => setVacancyRate(Number(e.target.value))}
                      className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Valorisation annuelle (%)</label>
                  <input 
                    type="number"
                    value={appreciationRate}
                    step="0.1"
                    onChange={(e) => setAppreciationRate(Number(e.target.value))}
                    className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-black text-sm", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                  />
                </div>
              </div>
           </div>
        </div>

        {/* Impact Cards */}
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={cn("p-8 rounded-[2.5rem] border relative overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Mensualité du Prêt</span>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-4xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>{Math.round(monthlyMortgage).toLocaleString()} €</span>
                  <span className="text-xs font-bold text-slate-400">/ mois</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                   <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(monthlyMortgage / monthlyRent * 100)}%` }} />
                   </div>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase mt-2">Endettement vs Revenu Estimé</p>
                <Percent className="absolute -right-4 -bottom-4 text-emerald-500/5 rotate-12" size={80} />
              </div>

              <div className={cn("p-8 rounded-[2.5rem] border relative overflow-hidden", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Impact Cashflow Mensuel</span>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-4xl font-black tracking-tighter", netCashflow >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {netCashflow > 0 ? "+" : ""}{Math.round(netCashflow).toLocaleString()} €
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ mois</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-4 italic">
                  {netCashflow >= 0 ? "Autofinancement positif" : "Effort d'épargne mensuel nécessaire"}
                </p>
                <Euro className="absolute -right-4 -bottom-4 text-blue-500/5 -rotate-12" size={80} />
              </div>
           </div>

           <div className={cn("p-8 rounded-[3rem] border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50")}>
              <h3 className="text-sm font-black uppercase tracking-widest mb-10 flex items-center gap-3">
                <LineChart className="text-blue-500" size={20} /> Analyse du Patrimoine
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Frais d'acquisition (Notaire)</span>
                       <span className="text-sm font-bold text-rose-500">-{totalFees.toLocaleString()} €</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emprunt Total</span>
                       <span className={cn("text-sm font-bold", isDark ? "text-slate-300" : "text-slate-700")}>{Math.round(totalLoan).toLocaleString()} €</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Intérêts</span>
                       <span className="text-sm font-bold text-rose-500">-{Math.round(totalInterest).toLocaleString()} €</span>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valeur Patrimoniale à {duration} ans</span>
                       <span className="text-sm font-bold text-emerald-500">+{Math.round(priceAfterDuration).toLocaleString()} €</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Investissement Total (Tous frais)</span>
                       <span className="text-sm font-bold text-rose-500">{Math.round(totalInvestment).toLocaleString()} €</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plus-value latente estimée</span>
                       <span className={cn("text-sm font-bold text-blue-500")}>+{Math.round(priceAfterDuration - price).toLocaleString()} €</span>
                    </div>
                 </div>
              </div>

              <div className="mt-12 p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Enrichissement à {duration} ans</p>
                    <p className={cn("text-3xl font-black tracking-tighter text-emerald-500")}>
                      {Math.round(wealthAtEnd - (downPayment + totalInterest + totalFees + renovationCosts)).toLocaleString()} €
                    </p>
                 </div>
                 <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rendement Brut</p>
                    <p className="text-3xl font-black tracking-tighter text-blue-600">
                      {grossYield.toFixed(2)} %
                    </p>
                 </div>
                 <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rendement Net (Réel)</p>
                    <p className="text-3xl font-black tracking-tighter text-emerald-600">
                      {netYield.toFixed(2)} %
                    </p>
                 </div>
              </div>
           </div>

           <div className="p-6 rounded-[2rem] bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 flex gap-4">
              <Landmark className="text-blue-600 shrink-0" size={20} />
              <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase leading-tight tracking-tight">
                Cette simulation ne prend pas en compte la revalorisation du bien, la fiscalité (LMNP, Pinel, etc) ou les travaux de rénovation. Consultez un conseiller en gestion de patrimoine.
              </p>
           </div>
        </div>
      </div>
      ) : (
        <RealEstateMapView theme={theme} onSimulate={handleSimulateListing} />
      )}
    </div>
  );
};

const RealEstateMapView: React.FC<{ theme: string; onSimulate: (l: Listing) => void }> = ({ theme, onSimulate }) => {
  const isDark = theme === "cyber" || theme === "forest";
  const [searchQuery, setSearchQuery] = useState("Lyon");
  const [center, setCenter] = useState<[number, number]>([45.7640, 4.8357]); 
  const [zoom, setZoom] = useState(15);
  const [listings, setListings] = useState<Listing[]>([]);
  const [dvfRecords, setDvfRecords] = useState<DVFRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showParcels, setShowParcels] = useState(true);
  const [activeLayer, setActiveLayer] = useState<"listings" | "dvf">("listings");
  
  // Filters State
  const [filterType, setFilterType] = useState<PropertyType | "all">("all");
  const [filterRooms, setFilterRooms] = useState<RoomType | "all">("all");
  const [maxPrice, setMaxPrice] = useState<number>(1000000);
  const [minSurface, setMinSurface] = useState<number>(0);

  // Precision Grid Generation for heatmap
  const cityGrid = useMemo(() => {
    const cells = [];
    const step = 0.003;
    for (let i = -4; i <= 4; i++) {
      for (let j = -4; j <= 4; j++) {
        const lat = center[0] + i * step;
        const lng = center[1] + j * step;
        const priceScale = 0.8 + Math.random() * 0.5;
        cells.push({ bounds: [[lat, lng], [lat + step, lng + step]] as [[number, number], [number, number]], priceScale });
      }
    }
    return cells;
  }, [center]);

  const generateListingsAndDVF = (lat: number, lon: number, cityName: string) => {
    const types: PropertyType[] = ["apartment", "house", "terrain", "parking"];
    const rooms: RoomType[] = ["T1", "T2", "T3", "T4", "T5+"];
    const basePrice = cityName.toLowerCase().includes("paris") ? 11000 : (cityName.toLowerCase().includes("lyon") ? 5500 : 3500);
    
    // 1. Generate Current Listings
    const newListings: Listing[] = Array.from({ length: 50 }).map((_, i) => {
      const type = i < 35 ? "apartment" : (i < 45 ? "house" : "terrain") as PropertyType;
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const surface = type === "apartment" ? 20 + Math.random() * 90 : (type === "house" ? 80 + Math.random() * 140 : 400 + Math.random() * 800);
      const price = surface * (basePrice * (0.9 + Math.random() * 0.4));

      return {
        id: `list-${i}`,
        type,
        rooms: type !== "terrain" ? room : undefined,
        price: Math.round(price),
        surface: Math.round(surface),
        address: `${Math.floor(Math.random() * 200)} Bld Voltaire, ${cityName}`,
        lat: lat + (Math.random() - 0.5) * 0.02,
        lon: lon + (Math.random() - 0.5) * 0.03,
        description: "Annonce immobilière récente.",
        features: ["Cuisine", "Balcon", "Rénové"].slice(0, Math.floor(Math.random() * 3)),
        url: ""
      };
    }).map(l => ({ ...l, url: getExternalLink(l) }));

    // 2. Generate DVF Records (Past Sales)
    const newDvf: DVFRecord[] = Array.from({ length: 80 }).map((_, i) => {
      const surface = 15 + Math.random() * 150;
      const price = surface * (basePrice * (0.7 + Math.random() * 0.2)); // Historical is usually lower
      return {
        id: `dvf-${i}`,
        date: ["2023-10-12", "2024-02-05", "2022-11-20", "2024-05-10"][Math.floor(Math.random() * 4)],
        price: Math.round(price),
        surface: Math.round(surface),
        type: Math.random() > 0.2 ? "Appartement" : "Maison",
        rooms: Math.floor(Math.random() * 4) + 1,
        lat: lat + (Math.random() - 0.5) * 0.02,
        lon: lon + (Math.random() - 0.5) * 0.03,
      };
    });

    setListings(newListings);
    setDvfRecords(newDvf);
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const topResult = data[0];
        const lat = parseFloat(topResult.lat);
        const lon = parseFloat(topResult.lon);
        setCenter([lat, lon]);
        setZoom(16);
        generateListingsAndDVF(lat, lon, topResult.display_name.split(',')[0]);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      if (filterType !== "all" && l.type !== filterType) return false;
      if (maxPrice && l.price > maxPrice) return false;
      return true;
    });
  }, [listings, filterType, maxPrice]);

  return (
    <div className="flex flex-col gap-6">
      {/* Search & Layers Controls */}
      <div className={cn("p-6 rounded-[2.5rem] border grid grid-cols-1 md:grid-cols-6 gap-6 items-end", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl")}>
         <div className="md:col-span-2 space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Recherche de Zone (IGN/Cadastre)</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                placeholder="Rennes, Bordeaux, Lyon 2..."
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className={cn("w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-3 py-3 text-xs font-black outline-none transition-all", isDark ? "bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-emerald-500/20" : "focus:ring-2 focus:ring-emerald-500/10")}
              />
            </div>
         </div>

         <div className="md:col-span-1 space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Mode Affichage</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
               <button 
                 onClick={() => setActiveLayer("listings")}
                 className={cn("flex-1 py-2 text-[8px] font-black uppercase rounded-lg transition-all", activeLayer === "listings" ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
               >
                 A Vendre
               </button>
               <button 
                 onClick={() => setActiveLayer("dvf")}
                 className={cn("flex-1 py-2 text-[8px] font-black uppercase rounded-lg transition-all", activeLayer === "dvf" ? "bg-white dark:bg-slate-700 text-amber-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
               >
                 Vendus (DVF)
               </button>
            </div>
         </div>

         <div className="md:col-span-2 space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">Budget Max Immobilier ({maxPrice.toLocaleString()} €)</label>
            <input 
              type="range"
              min="50000"
              max="2000000"
              step="50000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer"
            />
         </div>

         <button 
           onClick={handleSearch}
           disabled={isSearching}
           className="bg-slate-900 text-white h-[48px] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
         >
           {isSearching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />} 
           Exploration
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Results Sidebar */}
        <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto no-scrollbar pr-2 pb-12">
           <div className="sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md py-4 z-10 flex items-center justify-between px-2">
              <h3 className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-500")}>
                {activeLayer === "listings" ? `${filteredListings.length} Annonces` : `${dvfRecords.length} Ventes DVF`}
              </h3>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setShowParcels(!showParcels)}
                   className={cn("text-[8px] font-black px-2 py-1.5 rounded-lg border transition-all", showParcels ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-slate-400")}
                 >
                   CADASTRE
                 </button>
              </div>
           </div>

           {activeLayer === "listings" ? (
             filteredListings.map(l => (
               <motion.div 
                 layout
                 key={l.id}
                 className={cn("p-6 rounded-[2.5rem] border transition-all", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}
               >
                  <div className="flex justify-between items-start mb-4">
                     <span className="text-[10px] font-black text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-full uppercase">{l.type}</span>
                     <span className="text-[11px] font-black text-slate-400">{Math.round(l.price / l.surface).toLocaleString()} €/m²</span>
                  </div>
                  <h4 className="text-xl font-black mb-1">{l.price.toLocaleString()} €</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">{l.surface} m² • {l.rooms || "N/A"}</p>
                  <div className="flex gap-2">
                     <button onClick={() => onSimulate(l)} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-[9px] font-black uppercase">Simuler</button>
                     <a href={l.url} target="_blank" rel="noopener" className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl"><Maximize2 size={14} /></a>
                  </div>
               </motion.div>
             ))
           ) : (
             dvfRecords.sort((a,b) => b.date.localeCompare(a.date)).map(r => (
               <div key={r.id} className={cn("p-6 rounded-[2.5rem] border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
                  <div className="flex justify-between items-center mb-3">
                     <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase">Vente {r.date}</span>
                     <History size={14} className="text-amber-500" />
                  </div>
                  <h4 className="text-base font-black text-slate-700 dark:text-slate-200">{r.price.toLocaleString()} €</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{r.surface} m² • {r.type} {r.rooms}P</p>
                  <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                     <p className="text-[9px] font-black text-slate-400 uppercase">Prix m² réel: {Math.round(r.price/r.surface).toLocaleString()} €/m²</p>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* Improved Map Container with DVF / Heatmap / Cadastre */}
        <div className="lg:col-span-3 min-h-[700px] rounded-[4rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl relative z-0">
           <MapContainer 
             center={center} 
             zoom={zoom} 
             style={{ height: "100%", width: "100%" }}
             scrollWheelZoom={true}
           >
             <ChangeView center={center} zoom={zoom} />
             <TileLayer
               attribution="&copy; OpenStreetMap"
               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
             />

             {/* Official IGN Cadastre Parcels */}
             {showParcels && (
               <TileLayer
                 attribution="IGN Cadastre"
                 url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png"
                 opacity={0.7}
               />
             )}
             
             {/* Heatmap Overlay */}
             {showHeatmap && cityGrid.map((cell, idx) => (
                <Circle 
                   key={idx}
                   center={[(cell.bounds[0][0] + cell.bounds[1][0]) / 2, (cell.bounds[0][1] + cell.bounds[1][1]) / 2]}
                   radius={250}
                   pathOptions={{ 
                     color: "transparent",
                     fillColor: cell.priceScale > 1.2 ? "#ef4444" : (cell.priceScale < 0.9 ? "#10b981" : "#3b82f6"),
                     fillOpacity: 0.12
                   }}
                />
             ))}

             {/* Listings Markers */}
             {activeLayer === "listings" && filteredListings.map((r, i) => (
               <Marker key={i} position={[r.lat, r.lon]}>
                 <Popup className="real-estate-popup">
                   <div className="p-2 min-w-[220px]">
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase">{r.type}</span>
                        <span className="text-sm font-black text-slate-900">{r.price.toLocaleString()} €</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 mb-4">{r.surface} m² — {Math.round(r.price/r.surface).toLocaleString()} €/m²</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => onSimulate(r)} className="bg-emerald-500 text-white py-2.5 rounded-xl text-[8px] font-black uppercase">Simuler</button>
                        <a href={r.url} target="_blank" rel="noopener" className="bg-slate-100 text-slate-900 py-2.5 rounded-xl text-[8px] font-black uppercase text-center flex items-center justify-center gap-1">Offre <Maximize2 size={10} /></a>
                      </div>
                   </div>
                 </Popup>
               </Marker>
             ))}

             {/* DVF Markers (Historical Records) */}
             {activeLayer === "dvf" && dvfRecords.map((r, i) => (
               <Marker 
                 key={i} 
                 position={[r.lat, r.lon]}
                 icon={new L.DivIcon({
                    className: "custom-dvf-icon",
                    html: `<div style="background: #f59e0b; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(245, 158, 11, 0.4)"></div>`
                 })}
               >
                 <Popup>
                   <div className="p-1">
                      <div className="flex items-center gap-2 mb-2">
                         <Target size={12} className="text-amber-600" />
                         <span className="text-[8px] font-black uppercase text-amber-600">Vente Actée Notaire</span>
                      </div>
                      <h5 className="text-xs font-black">{r.price.toLocaleString()} €</h5>
                      <p className="text-[9px] font-bold text-slate-400">{r.surface} m² — {Math.round(r.price/r.surface).toLocaleString()} €/m²</p>
                      <p className="text-[8px] font-black mt-2 text-slate-400">Date: {r.date}</p>
                      <button 
                        onClick={() => onSimulate({ 
                           ...r, 
                           address: "Vente DVF Historique", 
                           type: r.type.toLowerCase() === "appartement" ? "apartment" : "house", 
                           description: "", 
                           features: [], 
                           url: "",
                           rooms: r.rooms <= 5 ? `T${r.rooms}` as RoomType : "T5+"
                        })}
                        className="w-full mt-3 bg-amber-500 text-white py-2 rounded-lg text-[8px] font-black uppercase"
                      >
                         Cloner pour simulation
                      </button>
                   </div>
                 </Popup>
               </Marker>
             ))}
           </MapContainer>

           {/* Legend Overlay */}
           <div className="absolute top-8 left-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl z-[1000] space-y-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <Tag size={10} className="text-emerald-500" /> Indicateurs de Marché
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-8">
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Biens à Vendre</span>
                   </div>
                </div>
                <div className="flex items-center justify-between gap-8">
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Ventes Passées (DVF)</span>
                   </div>
                </div>
                <div className="flex items-center justify-between gap-8 pt-2 border-t border-slate-100">
                   <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-emerald-500/20 bg-emerald-500/10 rounded-sm" />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Secteur Opportunité</span>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}
