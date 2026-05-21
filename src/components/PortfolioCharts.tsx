import React from "react";
import { Position, Transaction } from "../types";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";
import { motion } from "motion/react";
import { PortfolioValueChart } from "./PortfolioValueChart";
import { CorrelationMatrix } from "./CorrelationMatrix";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1", "#f43f5e"];

export function PortfolioCharts({ positions, transactions }: { positions: Position[], transactions: Transaction[] }) {
  // 1. Allocation par position
  const allocationData = positions.map(p => ({
    name: p.label,
    value: p.currentValue,
  })).sort((a, b) => b.value - a.value);

  // 2. Performance latente (%)
  const performanceData = positions.map(p => ({
    name: p.label,
    value: p.latentPLPercent,
  })).sort((a, b) => b.value - a.value);

  // 3. Exposition pays réelle (Decomposed)
  const countryExposure: Record<string, number> = {};
  positions.forEach(p => {
    Object.entries(p.countryExposure).forEach(([country, weight]) => {
      countryExposure[country] = (countryExposure[country] || 0) + (weight * p.currentValue);
    });
  });
  const countryData = Object.entries(countryExposure).map(([name, value]) => ({
    name,
    value,
  })).sort((a, b) => b.value - a.value);

  // 4. Profil risque
  const riskDataMap: Record<string, number> = { "Low": 0, "Medium": 0, "High": 0 };
  positions.forEach(p => {
    riskDataMap[p.riskProfile] += p.currentValue;
  });
  const riskData = Object.entries(riskDataMap).map(([name, value]) => ({ name, value }));

  // 5. Répartition par secteur
  const sectorExposure: Record<string, number> = {};
  positions.forEach(p => {
    sectorExposure[p.sector] = (sectorExposure[p.sector] || 0) + p.currentValue;
  });
  const sectorData = Object.entries(sectorExposure).map(([name, value]) => ({
    name,
    value,
  })).sort((a, b) => b.value - a.value);

  const averageRiskScore = positions.length > 0 
    ? (positions.reduce((acc, p) => acc + (p.riskScore * p.currentValue), 0) / positions.reduce((acc, p) => acc + p.currentValue, 0))
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Portfolio Value History - Full Width */}
      <div className="lg:col-span-2">
        <PortfolioValueChart positions={positions} transactions={transactions} />
      </div>

      {/* Allocation */}
      <ChartContainer title="Allocation par Position">
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center relative">
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {allocationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="md:ml-4 space-y-1.5 max-h-[250px] overflow-y-auto pr-2">
            {allocationData.slice(0, 5).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="truncate max-w-[120px]">{entry.name}</span>
              </div>
            ))}
            {allocationData.length > 5 && <div className="text-[10px] text-slate-400 italic">+{allocationData.length - 5} autres...</div>}
          </div>
        </div>
      </ChartContainer>

      {/* Performance Latente */}
      <ChartContainer title="Performance Latente (%)">
        <div className="w-full">
          <ResponsiveContainer width="100%" height={Math.max(300, performanceData.length * 30)}>
            <BarChart 
              data={performanceData} 
              layout="vertical" 
              margin={{ left: -10, right: 30, top: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100} 
                fontSize={9} 
                tickFormatter={(value) => value.length > 20 ? value.substring(0, 17) + "..." : value}
                tick={{ fill: '#64748b', fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                formatter={(value: number) => value.toFixed(2) + "%"}
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value >= 0 ? "#10b981" : "#f43f5e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      {/* Country Exposure */}
      <ChartContainer title="Exposition Pays Réelle">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={countryData} margin={{ top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip 
              formatter={(value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
              {countryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Risk Profile */}
      <ChartContainer title="Profil Risque" isAi={true}>
        <div className="flex-1 flex flex-col justify-center gap-4 px-4 h-[250px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-slate-400">Score Moyen</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-2xl font-black",
                averageRiskScore > 7 ? "text-rose-600" : averageRiskScore > 4 ? "text-amber-600" : "text-emerald-600"
              )}>
                {averageRiskScore.toFixed(1)}
              </span>
              <span className="text-slate-300 text-sm">/ 10</span>
            </div>
          </div>
          {riskData.map((entry, index) => {
            const colors: any = { "Low": "bg-emerald-400", "Medium": "bg-amber-400", "High": "bg-rose-500" };
            const percentage = (entry.value / positions.reduce((acc, p) => acc + p.currentValue, 0)) * 100;
            return (
              <div key={entry.name} className="flex items-center gap-4">
                <span className="text-[10px] w-12 text-slate-500 uppercase font-bold tracking-wider">{entry.name}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className={cn(colors[entry.name], "h-full")} style={{ width: `${percentage}%` }}></div>
                </div>
                <span className="text-xs font-bold text-slate-700">{percentage.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </ChartContainer>

      {/* Sector Allocation */}
      <ChartContainer title="Répartition par Secteur" isAi={true}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={sectorData} layout="vertical" margin={{ left: -10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100} 
              fontSize={9} 
              tick={{ fill: '#64748b' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip 
              formatter={(value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
              {sectorData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Correlation Matrix - Full Width */}
      <div className="lg:col-span-2">
        <CorrelationMatrix positions={positions} />
      </div>
    </div>
  );
}

function ChartContainer({ title, children, isAi = false }: { title: string, children: React.ReactNode, isAi?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm flex flex-col relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest">{title}</h4>
        {isAi && (
          <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border border-blue-100 shadow-sm animate-pulse">
            <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
            IA Mention
          </div>
        )}
      </div>
      {children}
    </motion.div>
  );
}
