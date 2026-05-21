
import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal, sankeyCenter } from "d3-sankey";
import { Plus, Trash2, Wallet, DollarSign, PiggyBank, Home, ShoppingBag, CreditCard, ChevronRight, Save, Info } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

interface SankeyNode {
  name: string;
  category?: string;
}

interface SankeyLink {
  source: number | string;
  target: number | string;
  value: number;
  color?: string;
}

interface CashflowItem {
  id: string;
  label: string;
  amount: number;
}

interface CashflowCategory {
  id: string;
  label: string;
  items: CashflowItem[];
  color: string;
}

const DEFAULT_CATEGORIES: CashflowCategory[] = [
  {
    id: "invest",
    label: "Investissements",
    color: "#fecaca", // red-200
    items: [
      { id: "cto", label: "CTO", amount: 1280 },
      { id: "pea", label: "PEA", amount: 200 },
      { id: "finary", label: "Finary Invest", amount: 120 },
      { id: "crypto", label: "Crypto", amount: 100 },
    ]
  },
  {
    id: "housing",
    label: "Logement",
    color: "#e9d5ff", // purple-200
    items: [
      { id: "rent", label: "Loyer", amount: 726.22 },
      { id: "water", label: "Eau", amount: 13.63 },
      { id: "elec", label: "Elec", amount: 170 },
      { id: "insur", label: "Assurance", amount: 21.27 },
    ]
  },
  {
    id: "daily",
    label: "Vie quotidienne",
    color: "#c7d2fe", // indigo-200
    items: [
      { id: "groceries", label: "Courses", amount: 400 },
      { id: "restaurant", label: "Restaurants", amount: 300 },
      { id: "health", label: "Mutuelle", amount: 34.45 },
    ]
  },
  {
    id: "subs",
    label: "Abonnements",
    color: "#ccfbf1", // teal-100
    items: [
      { id: "internet", label: "Internet / Téléphone", amount: 80 },
      { id: "sport", label: "Sport", amount: 20 },
      { id: "revolut", label: "Revolut", amount: 13.99 },
      { id: "netflix", label: "Netflix", amount: 17.9 },
    ]
  }
];

interface CashflowScenario {
  id: string;
  name: string;
  incomes: CashflowItem[];
  categories: CashflowCategory[];
}

const DEFAULT_SCENARIOS: CashflowScenario[] = [
  {
    id: "default",
    name: "Budget Principal",
    incomes: [{ id: "main-income", label: "Salaire", amount: 4200 }],
    categories: DEFAULT_CATEGORIES
  }
];

export const CashflowView: React.FC<{ theme: string }> = ({ theme }) => {
  const [scenarios, setScenarios] = useState<CashflowScenario[]>(() => {
    const saved = localStorage.getItem("investiscope_scenarios");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse scenarios", e);
      }
    }
    
    // Migration logic for users who had data before the scenarios update
    const oldIncomes = localStorage.getItem("investiscope_incomes");
    const oldCashflow = localStorage.getItem("investiscope_cashflow");
    if (oldIncomes || oldCashflow) {
        return [{
            id: "default",
            name: "Budget Principal",
            incomes: oldIncomes ? JSON.parse(oldIncomes) : [{ id: "main-income", label: "Salaire", amount: 4200 }],
            categories: oldCashflow ? JSON.parse(oldCashflow) : DEFAULT_CATEGORIES
        }];
    }
    return DEFAULT_SCENARIOS;
  });
  const [activeScenarioId, setActiveScenarioId] = useState<string>(() => {
    const saved = localStorage.getItem("investiscope_active_scenario");
    return saved || (scenarios && scenarios.length > 0 ? scenarios[0].id : "default");
  });
  const [editMode, setEditMode] = useState(false);

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  const { incomes, categories } = activeScenario;

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    localStorage.setItem("investiscope_scenarios", JSON.stringify(scenarios));
    localStorage.setItem("investiscope_active_scenario", activeScenarioId);
    
    if (!editMode) {
      const timer = setTimeout(renderSankey, 50); // Increased delay
      return () => clearTimeout(timer);
    }
  }, [scenarios, activeScenarioId, editMode]);

  // Ensure activeScenarioId is always valid
  useEffect(() => {
    if (!scenarios.find(s => s.id === activeScenarioId) && scenarios.length > 0) {
      setActiveScenarioId(scenarios[0].id);
    }
  }, [scenarios, activeScenarioId]);

  const updateActiveScenario = (updates: Partial<CashflowScenario>) => {
    setScenarios(prev => prev.map(s => s.id === activeScenarioId ? { ...s, ...updates } : s));
  };

  const addScenario = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setScenarios(prev => [...prev, {
      id: newId,
      name: "Nouveau Cashflow",
      incomes: [{ id: "inc-" + Date.now(), label: "Salaire", amount: 2000 }],
      categories: [
          { id: "living-" + Date.now(), label: "Vie Courante", color: "#94a3b8", items: [{ id: "item-" + Date.now(), label: "Courses", amount: 400 }] }
      ]
    }]);
    setActiveScenarioId(newId);
    setEditMode(true);
  };

  const deleteScenario = (id: string) => {
    if (scenarios.length <= 1) return;
    const newScenarios = scenarios.filter(s => s.id !== id);
    setScenarios(newScenarios);
    setActiveScenarioId(newScenarios[0].id);
  };

  const renameScenario = (name: string) => {
    updateActiveScenario({ name });
  };

  const renderSankey = () => {
    if (!svgRef.current || !activeScenario) return;

    const width = 1000;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodes: any[] = [];
    const links: any[] = [];

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

    if (totalIncome === 0) {
        svg.append("text")
           .attr("x", width / 2)
           .attr("y", height / 2)
           .attr("text-anchor", "middle")
           .attr("font-size", "14px")
           .attr("font-weight", "bold")
           .attr("fill", isDark ? "#ffffff" : "#64748b")
           .text("Veuillez configurer vos revenus pour voir le graphique.");
        return;
    }

    // Income nodes
    incomes.forEach((inc, idx) => {
      nodes.push({ name: `${inc.label}: ${inc.amount} €`, id: `inc-${inc.id}` });
    });

    // Budget Node (Node index = incomes.length)
    const budgetNodeIdx = incomes.length;
    nodes.push({ name: `Budget: ${totalIncome} €`, id: "budget" });

    // Link each income to budget
    incomes.forEach((inc, idx) => {
      links.push({ source: idx, target: budgetNodeIdx, value: inc.amount, color: "#93c5fd" });
    });

    let nodeIndex = nodes.length;
    let totalExpenses = 0;
    categories.forEach((cat) => {
      const catTotal = cat.items.reduce((sum, item) => sum + item.amount, 0);
      totalExpenses += catTotal;
      if (catTotal === 0) return; // Skip empty categories in graph
      
      const catNodeIdx = nodeIndex++;
      nodes.push({ name: `${cat.label}: ${catTotal.toFixed(2)} €`, id: cat.id });
      links.push({ source: budgetNodeIdx, target: catNodeIdx, value: catTotal, color: cat.color });

      cat.items.forEach((item) => {
        if (item.amount === 0) return;
        const itemNodeIdx = nodeIndex++;
        nodes.push({ name: `${item.label}: ${item.amount} €`, id: item.id });
        links.push({ source: catNodeIdx, target: itemNodeIdx, value: item.amount, color: cat.color });
      });
    });

    const surplus = totalIncome - totalExpenses;
    if (surplus > 0) {
      const surplusNodeIdx = nodeIndex++;
      nodes.push({ name: `Épargne / Reste: ${surplus.toFixed(2)} €`, id: "surplus" });
      links.push({ source: budgetNodeIdx, target: surplusNodeIdx, value: surplus, color: "#10b981" }); // emerald-500
    }

    const sankeyGenerator = sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[50, 20], [width - 50, height - 20]])
      .nodeAlign(sankeyCenter);

    const { nodes: skNodes, links: skLinks } = sankeyGenerator({
      nodes: nodes.map(d => Object.assign({}, d)),
      links: links.map(d => Object.assign({}, d))
    });

    // Render links
    svg.append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(skLinks)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", (d: any) => d.color || "#cbd5e1")
      .attr("stroke-width", (d: any) => Math.max(1, d.width))
      .attr("opacity", 0.5)
      .on("mouseover", function() { d3.select(this).attr("opacity", 0.8); })
      .on("mouseout", function() { d3.select(this).attr("opacity", 0.5); });

    // Render nodes
    svg.append("g")
      .selectAll("rect")
      .data(skNodes)
      .join("rect")
      .attr("x", (d: any) => d.x0)
      .attr("y", (d: any) => d.y0)
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("width", (d: any) => d.x1 - d.x0)
      .attr("fill", (d: any) => {
          if (d.id.startsWith("inc-")) return "#3b82f6";
          if (d.id === "budget") return "#fb923c";
          if (d.id === "surplus") return "#10b981";
          const cat = categories.find(c => c.id === d.id || c.items.some(i => i.id === d.id));
          return cat ? cat.color : "#94a3b8";
      })
      .attr("rx", 4);

    // Render labels
    svg.append("g")
      .style("font", "bold 10px sans-serif")
      .selectAll("text")
      .data(skNodes)
      .join("text")
      .attr("x", (d: any) => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", (d: any) => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d: any) => d.x0 < width / 2 ? "start" : "end")
      .text((d: any) => d.name)
      .attr("fill", theme === "cyber" ? "#ffffff" : "#334155");
  };

  const addIncome = () => {
    updateActiveScenario({
      incomes: [...incomes, { id: Math.random().toString(36).substr(2, 9), label: "Nouveau Revenu", amount: 0 }]
    });
  };

  const updateIncome = (id: string, label: string, amount: number) => {
    updateActiveScenario({
      incomes: incomes.map(inc => inc.id === id ? { ...inc, label, amount } : inc)
    });
  };

  const removeIncome = (id: string) => {
    updateActiveScenario({
      incomes: incomes.filter(inc => inc.id !== id)
    });
  };

  const addCategory = () => {
    const colors = ["#fecaca", "#e9d5ff", "#c7d2fe", "#ccfbf1", "#fef3c7", "#dcfce7", "#dbeafe", "#f3e8ff"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    updateActiveScenario({
      categories: [{ 
        id: Math.random().toString(36).substr(2, 9), 
        label: "Nouvelle Catégorie", 
        color: randomColor, 
        items: [] 
      }, ...categories] // Prepend new category
    });
  };

  const updateCategory = (id: string, label: string) => {
    updateActiveScenario({
      categories: categories.map(cat => cat.id === id ? { ...cat, label } : cat)
    });
  };

  const removeCategory = (id: string) => {
    updateActiveScenario({
      categories: categories.filter(cat => cat.id !== id)
    });
  };

  const addItem = (catId: string) => {
    updateActiveScenario({
      categories: categories.map(cat => {
        if (cat.id === catId) {
          return {
            ...cat,
            items: [...cat.items, { id: Math.random().toString(36).substr(2, 9), label: "Nouvel item", amount: 0 }]
          };
        }
        return cat;
      })
    });
  };

  const updateItem = (catId: string, itemId: string, label: string, amount: number) => {
    updateActiveScenario({
      categories: categories.map(cat => {
        if (cat.id === catId) {
          return {
            ...cat,
            items: cat.items.map(item => item.id === itemId ? { ...item, label, amount } : item)
          };
        }
        return cat;
      })
    });
  };

  const removeItem = (catId: string, itemId: string) => {
    updateActiveScenario({
      categories: categories.map(cat => {
        if (cat.id === catId) {
          return {
            ...cat,
            items: cat.items.filter(item => item.id !== itemId)
          };
        }
        return cat;
      })
    });
  };

  const isDark = theme === "cyber" || theme === "forest";

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = categories.reduce((sum, cat) => 
    sum + cat.items.reduce((iSum, item) => iSum + item.amount, 0), 0
  );
  const surplus = totalIncome - totalExpenses;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg">
                <PiggyBank size={24} />
             </div>
             <div>
                <div className="flex items-center gap-2 group relative">
                   <input 
                     type="text"
                     value={activeScenario.name}
                     onChange={(e) => renameScenario(e.target.value)}
                     className={cn(
                       "bg-transparent border-none p-1 -m-1 text-3xl font-black tracking-tighter uppercase outline-none focus:ring-0 w-auto min-w-[250px] transition-all hover:bg-slate-100/20 rounded-lg",
                       isDark ? "text-white hover:bg-slate-800/50" : "text-slate-900 focus:bg-slate-50"
                     )}
                     placeholder="Nom du Cashflow"
                   />
                </div>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest pl-0.5 mt-1">Visualisez et planifiez vos flux financiers</p>
             </div>
          </div>

          {/* Scenario Selector */}
          <div className="flex flex-wrap items-center gap-2 pl-11">
             {scenarios.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveScenarioId(s.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    s.id === activeScenarioId 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                      : (isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")
                  )}
                >
                  {s.name}
                </button>
             ))}
             <button 
                onClick={addScenario}
                className="p-2 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all"
             >
                <Plus size={14} />
             </button>
             {scenarios.length > 1 && (
                <button 
                  onClick={() => deleteScenario(activeScenarioId)}
                  className="p-2 rounded-xl text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all ml-2"
                >
                  <Trash2 size={14} />
                </button>
             )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {editMode && (
             <button 
                onClick={addCategory}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-tighter bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all shadow-sm"
              >
                <Plus size={16} /> Nouvelle Catégorie
             </button>
          )}
          <button 
            onClick={() => setEditMode(!editMode)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-tighter transition-all",
              editMode ? "bg-emerald-600 text-white shadow-emerald-200" : (isDark ? "bg-slate-800 text-slate-400" : "bg-white text-slate-600 border border-slate-200 shadow-sm hover:shadow-md")
            )}
          >
            {editMode ? <><Save size={16} /> Enregistrer Configuration</> : <><CreditCard size={16} /> Configurer mon Cashflow</>}
          </button>
        </div>
      </div>

      {editMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Income Settings */}
          <div className={cn("p-6 rounded-3xl border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
             <div className="flex items-center justify-between mb-6">
                <h3 className={cn("text-sm font-black uppercase tracking-widest flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Wallet size={16} className="text-blue-500" /> Revenus Mensuels
                </h3>
                <button 
                  onClick={addIncome}
                  className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <Plus size={16} />
                </button>
             </div>
             
             <div className="flex flex-col gap-3">
                {incomes.map((inc) => (
                  <div key={inc.id} className="flex items-center gap-3">
                    <input 
                      type="text"
                      value={inc.label}
                      onChange={(e) => updateIncome(inc.id, e.target.value, inc.amount)}
                      className={cn("flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                      placeholder="Source de revenu"
                    />
                    <div className="relative w-32">
                      <input 
                        type="number"
                        value={inc.amount}
                        onChange={(e) => updateIncome(inc.id, inc.label, Number(e.target.value))}
                        className={cn("w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-right", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                      />
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">€</div>
                    </div>
                    <button 
                      onClick={() => removeIncome(inc.id)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      disabled={incomes.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
             </div>
          </div>

          {/* Categories Settings */}
          {categories.map((cat) => (
            <div key={cat.id} className={cn("p-6 rounded-3xl border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 flex-1 mr-4">
                  <input 
                    type="color"
                    value={cat.color}
                    onChange={(e) => {
                      updateActiveScenario({
                        categories: categories.map(c => c.id === cat.id ? { ...c, color: e.target.value } : c)
                      });
                    }}
                    className="w-8 h-8 rounded-lg border-none p-0 bg-transparent cursor-pointer overflow-hidden"
                  />
                  <div className="flex-1 relative group/cat">
                    <input 
                      type="text"
                      value={cat.label}
                      onChange={(e) => updateCategory(cat.id, e.target.value)}
                      className={cn(
                        "bg-slate-50 border border-transparent hover:border-slate-200 p-2 rounded-xl text-sm font-black uppercase tracking-widest w-full outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all",
                        isDark ? "bg-slate-800 text-white hover:border-slate-600 focus:bg-slate-800" : "text-slate-900"
                      )}
                      placeholder="Nom de la catégorie"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => addItem(cat.id)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                  <button 
                    onClick={() => removeCategory(cat.id)}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {cat.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <input 
                      type="text"
                      value={item.label}
                      onChange={(e) => updateItem(cat.id, item.id, e.target.value, item.amount)}
                      className={cn("flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                    />
                    <div className="relative w-32">
                      <input 
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateItem(cat.id, item.id, item.label, Number(e.target.value))}
                        className={cn("w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-right", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                      />
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">€</div>
                    </div>
                    <button 
                      onClick={() => removeItem(cat.id, item.id)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Summary Stats Above Graph */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className={cn("p-6 rounded-[2rem] border relative overflow-hidden group", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                <div className="flex flex-col relative z-10">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Revenus Mensuels</span>
                   <span className={cn("text-2xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>{totalIncome.toLocaleString()} €</span>
                </div>
                <Wallet className="absolute -right-2 -bottom-2 text-blue-500/10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-500" size={64} />
             </div>

             <div className={cn("p-6 rounded-[2rem] border relative overflow-hidden group", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                <div className="flex flex-col relative z-10">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Dépenses</span>
                   <span className={cn("text-2xl font-black tracking-tighter", isDark ? "text-rose-500" : "text-rose-600")}>{totalExpenses.toLocaleString()} €</span>
                </div>
                <CreditCard className="absolute -right-2 -bottom-2 text-rose-500/10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-500" size={64} />
             </div>

             <div className={cn("p-6 rounded-[2rem] border relative overflow-hidden group", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                <div className="flex flex-col relative z-10">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Épargne / Reste</span>
                   <span className={cn("text-2xl font-black tracking-tighter", surplus >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {surplus.toLocaleString()} €
                   </span>
                </div>
                <PiggyBank className={cn("absolute -right-2 -bottom-2 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-500", surplus >= 0 ? "text-emerald-500/10" : "text-rose-500/10")} size={64} />
             </div>
          </div>

          <div className={cn("rounded-[3rem] p-6 md:p-10 border overflow-x-auto", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50")}>
             <div className="min-w-[1000px]">
               <svg ref={svgRef} width="1000" height="600" />
             </div>

             <div className="mt-8 flex items-center gap-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                <Info size={18} className="text-blue-600 shrink-0" />
                <p className="text-[10px] font-bold text-blue-600 leading-tight uppercase tracking-tight">
                  Votre budget est équilibré automatiquement en fonction de vos entrées et sorties. Les catégories d'investissement sont prioritaires dans l'analyse de votre patrimoine général.
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
