export interface Transaction {
  label: string;
  operation: string;
  place: string;
  date: string;
  quantity: number;
  price: number;
  grossAmount: number;
  fees: number;
  netAmount: number;
  currency: string;
  ticker?: string;
}

export interface Position {
  label: string;
  ticker: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  isLivePrice: boolean;
  currentValue: number;
  latentPL: number;
  latentPLPercent: number;
  realizedPL: number;
  totalPL: number;
  dividends: number;
  countryExposure: Record<string, number>; // { "FR": 0.8, "US": 0.2 }
  riskProfile: "Low" | "Medium" | "High";
  riskScore: number; // 1 to 10
  sector: string;
  assetType: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalLatentPL: number;
  totalRealizedPL: number;
  totalDividends: number;
  totalFees: number;
  totalPL: number;
  latentPerformance: number;
  globalPerformance: number;
  investedCapital: number;
}

export interface Quote {
  price: number;
  prevClose: number;
  currency: string;
}

export interface AssetRiskInfo {
  ticker: string;
  riskScore: number;
  riskProfile: "Low" | "Medium" | "High";
  sector: string;
  assetType: string;
  justification: string;
}
