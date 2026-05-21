import React, { useEffect, useState, useMemo, useRef } from "react";
import * as d3 from "d3";
import { Position, Transaction } from "../types";
import { Loader2, AlertCircle, Info } from "lucide-react";
import { motion } from "motion/react";

interface HistoryItem {
  time: number;
  price: number;
}

interface CorrelationData {
  x: string;
  y: string;
  value: number;
}

export function CorrelationMatrix({ positions }: { positions: Position[] }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<CorrelationData[]>([]);
  const [activeTickers, setActiveTickers] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const uniqueTickers = useMemo(() => {
    return Array.from(new Set(positions.map(p => p.ticker))).filter(t => t !== "UNKNOWN");
  }, [positions]);

  useEffect(() => {
    if (uniqueTickers.length < 2) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          uniqueTickers.map(ticker => 
            fetch(`/api/history?symbol=${encodeURIComponent(ticker)}&range=1y&interval=1d`)
              .then(res => res.ok ? res.json() : null)
              .then(data => ({ ticker, data: data as HistoryItem[] | null }))
          )
        );

        const validData = results.filter(r => r.data && r.data.length > 5);
        if (validData.length < 2) {
          setError("Données historiques insuffisantes pour cette période.");
          setLoading(false);
          return;
        }

        const tickersWithData = validData.map(d => d.ticker);
        setActiveTickers(tickersWithData);

        // Calculate returns
        const returnsByTicker: Record<string, Record<number, number>> = {};
        validData.forEach(({ ticker, data }) => {
          returnsByTicker[ticker] = {};
          if (!data) return;
          for (let i = 1; i < data.length; i++) {
            const ret = (data[i].price / data[i - 1].price) - 1;
            returnsByTicker[ticker][data[i].time] = ret;
          }
        });

        // Calculate Matrix (Pairwise)
        const corrMatrix: CorrelationData[] = [];
        for (let i = 0; i < tickersWithData.length; i++) {
          for (let j = 0; j < tickersWithData.length; j++) {
            const t1 = tickersWithData[i];
            const t2 = tickersWithData[j];
            
            // Find intersection of timestamps for these two specific tickers
            const ts1 = Object.keys(returnsByTicker[t1]).map(Number);
            const ts2 = new Set(Object.keys(returnsByTicker[t2]).map(Number));
            const commonTs = ts1.filter(ts => ts2.has(ts)).sort((a, b) => a - b);

            if (commonTs.length < 5) {
              corrMatrix.push({ x: t1, y: t2, value: i === j ? 1 : 0 });
              continue;
            }

            const r1 = commonTs.map(ts => returnsByTicker[t1][ts]);
            const r2 = commonTs.map(ts => returnsByTicker[t2][ts]);
            
            const correlation = calculatePearson(r1, r2);
            corrMatrix.push({ x: t1, y: t2, value: isNaN(correlation) ? 0 : correlation });
          }
        }

        setMatrix(corrMatrix);
      } catch (e) {
        console.error("Correlation error", e);
        setError("Une erreur est survenue lors du calcul de la matrice.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uniqueTickers]);

  useEffect(() => {
    if (!svgRef.current || matrix.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 600;
    const margin = { top: 60, right: 20, bottom: 20, left: 60 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, innerWidth])
      .domain(activeTickers)
      .padding(0.05);

    const y = d3.scaleBand()
      .range([0, innerHeight])
      .domain(activeTickers)
      .padding(0.05);

    // Color scale: Blue (negative) -> White (neutral) -> Red (positive)
    const color = d3.scaleSequential()
      .interpolator(d3.interpolateCool) // or interpolateRdBu
      .domain([-1, 1]);

    // Override for a clearer Red/Blue feel like the image
    const customColor = d3.scaleLinear<string>()
      .domain([-1, 0, 1])
      .range(["#3182bd", "#f7f7f7", "#e34a33"]);

    // Cells
    const cells = g.selectAll(".cell")
      .data<CorrelationData>(matrix)
      .enter()
      .append("g")
      .attr("class", "cell");

    cells.append("rect")
      .attr("x", (d: CorrelationData) => x(d.x)!)
      .attr("y", (d: CorrelationData) => y(d.y)!)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", (d: CorrelationData) => customColor(d.value))
      .style("stroke", "#fff")
      .style("stroke-width", 1);

    // Labels inside cells
    cells.append("text")
      .attr("x", (d: CorrelationData) => x(d.x)! + x.bandwidth() / 2)
      .attr("y", (d: CorrelationData) => y(d.y)! + y.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "black")
      .style("fill", (d: CorrelationData) => Math.abs(d.value) > 0.6 ? "#fff" : "#455a64")
      .text((d: CorrelationData) => d.value.toFixed(2));

    // Axes
    g.append("g")
      .attr("transform", `translate(0, -5)`)
      .call(d3.axisTop(x).tickSize(0))
      .select(".domain").remove();

    g.append("g")
      .attr("transform", `translate(-5, 0)`)
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove();

    svg.selectAll("text")
      .style("font-family", "Inter, sans-serif")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("text-transform", "uppercase");

  }, [matrix, activeTickers]);

  if (uniqueTickers.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Info className="mx-auto text-slate-300 mb-2" size={32} />
        <p className="text-slate-500 text-sm italic">Ajoutez au moins 2 positions pour voir la matrice de corrélation.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 shadow-sm overflow-hidden"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            Matrice de Corrélation
          </h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">Analyse des rendements quotidiens sur 1 an</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1">
             <div className="w-2 h-2 rounded-full bg-[#3182bd]"></div>
             <span className="text-[9px] font-bold text-slate-400 uppercase">-1.0 (Opposé)</span>
           </div>
           <div className="flex items-center gap-1">
             <div className="w-2 h-2 rounded-full bg-[#e34a33]"></div>
             <span className="text-[9px] font-bold text-slate-400 uppercase">+1.0 (Identique)</span>
           </div>
        </div>
      </div>

      <div className="relative flex justify-center overflow-x-auto min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/80 flex flex-col items-center justify-center gap-3">
             <Loader2 className="animate-spin text-blue-600" size={32} />
             <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Calcul de la matrice...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-8 text-center uppercase">
             <AlertCircle className="text-rose-500" size={32} />
             <span className="text-xs font-black text-rose-500 tracking-tight">{error}</span>
          </div>
        )}

        <svg ref={svgRef} width="600" height="600" viewBox="0 0 600 600" className="max-w-full h-auto"></svg>
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
         <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
           <span className="font-bold text-blue-600">Interprétation :</span> Une corrélation de 1 signifie que les deux actifs évoluent parfaitement ensemble. Une corrélation de 0 signifie qu'ils n'ont aucun lien statistique. Une corrélation de -1 signifie qu'ils évoluent à l'opposé. Diversifier avec des actifs faiblement corrélés permet de réduire le risque global du portefeuille.
         </p>
      </div>
    </motion.div>
  );
}

function calculatePearson(x: number[], y: number[]) {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  return numerator / denominator;
}
