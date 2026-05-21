import { Transaction, Position, PortfolioSummary, Quote } from "../types";

// Static mapping for tickers and country exposure
export const TICKER_MAP: Record<string, string> = {
  "CREDIT AGRICOLE": "ACA.PA",
  "STIF": "ALSTI.PA",
  "TOTALENERGIES": "TTE.PA",
  "ENI": "ENI.MI",
  "SPIE": "SPIE.PA",
  "AMUNDI MSCI WORLD SWAP - UCITS ETF - EUR (D) DIS": "EWLD.PA",
  "AMUNDI MSCI WORLD SWAP UCITS ETF EUR (D) DIS": "EWLD.PA",
  "AMUNDI PEA NASDAQ-100 UCITS ETF - EUR ACC": "PUST.PA",
  "AMUNDI EURO STOXX 50 II UCITS ETF - ACC": "MSE.PA",
  "AMUNDI PEA JAPON (TOPIX) UCITS ETF - EUR DIS": "PTPXE.PA",
  "AMUNDI PEA INDE (MSCI INDIA) UCITS ETF - EUR ACC": "PINR.PA",
  "AMUNDI PHYSICAL GOLD ETC": "GLDA",
  "AMUNDIPHME ETC Z 2118": "GLDA",
  "AMUNDI PHYSICAL GOLD": "GLDA",
  "AMUNDI PHYSICAL METALS PLC": "GLDA",
  "GLDA": "GLDA",
  "1RPGOLD": "GLDA",
  "CORE CAC 40 EUR (ACC)": "CACC.PA",
  "CORE S&P 500 (ACC)": "CSPX.AS",
  "CORE S&P 500 USD (ACC)": "CSPX.AS",
  "CORE S&P 500": "CSPX.AS",
  "CORE S": "CSPX.AS",
  "GOLD 3X LEV USD (ACC)": "3GLO.MI",
  "GOLD 3X": "3GLO.MI",
  "CLEANSPARK": "CLSK",
  "FDJ UNITED": "FDJ.PA",
  "FDJ": "FDJ.PA",
  "COFFEE 3X LEV USD": "3LCF.MI",
  "COFFEE 3X": "3LCF.MI",
  "SUGAR 3X LEV USD": "3LSU.MI",
  "SUGAR 3X": "3LSU.MI",
  "COFFEE 2X LEV USD": "LCFE.MI",
  "COFFEE 2X": "LCFE.MI",
  "DU PONT DE NEMOURS": "DD",
  "DUPONT DE NEMOURS": "DD",
  "DUPONT": "DD",
  "ACM RESEARCH": "ACMR",
  "LVMH LOUIS VUITTON MOET HENNESSY (ADR)": "MC.PA",
  "LVMH": "MC.PA",
  "DELL TECHNOLOGIES": "DELL",
  "PHYSICAL GOLD": "GLDA",
  "ESSILORLUXOTTICA": "EL.PA",
  "SOCIETE GENERALE": "GLE.PA",
  "EURONEXT": "ENX.PA",
  "GTT": "GTT.PA",
  "MERSEN": "MRN.PA",
  "OR": "GLDA",
  "GOLD": "GLDA",
  "BITCOIN": "BTC-EUR",
  "BTC": "BTC-EUR",
  "APPLE": "APC.DE",
  "AAPL": "APC.DE",
  "GOOGL": "ABEA.DE",
  "GOOGLE": "ABEA.DE",
  "ALPHABET": "ABEA.DE",
  "DELL": "D7G.DE",
  "AMUNDI PEA INDE (MSCI INDIA)": "PINR.PA",
  "AMUNDI MSCI INDIA": "PINR.PA",
  "AMUNDI PEA JAPON": "PTPXE.PA",
  "AMUNDI NASDAQ-100": "PUST.PA",
  "AMUNDI NASDAQ 100": "PUST.PA",
  "AMUNDI MSCI WORLD SWAP": "EWLD.PA",
  "AMUNDI EURO STOXX 50": "MSE.PA",
  "CORE S&P 500 USD": "CSPX.AS",
  "CCC": "CCC.WA",
  "ALPHABET (A)": "ABEA.DE",
  "GTT.PA": "GTT.PA",
  "ACA.PA": "ACA.PA",
  "EL.PA": "EL.PA",
  "ENX.PA": "ENX.PA",
  "MRN.PA": "MRN.PA",
  "FDJ.PA": "FDJ.PA",
  "GLE.PA": "GLE.PA",
  "ABEA.DE": "ABEA.DE",
};

export const ISIN_MAP: Record<string, string> = {
  "US0378331005": "APC.DE",
  "US02079K3059": "ABEA.DE",
  "US24703L2025": "D7G.DE",
  "US26614N1028": "DD",
  "US18452B2097": "CLSK",
  "FR0013380607": "CAC40.PA",
  "IE00B5BMR087": "CSPX.AS",
  "US00108J1097": "ACMR",
  "PLCCC0000016": "CCC.WA",
  "IE00B8HGT870": "3GO.MI",
  "JE00BYQY3Z98": "3CFE.MI",
  "FR0013416716": "GLDA",
  "JE00BYQY7H96": "3SUG.MI",
  "JE00B2NFTD12": "LCFE.MI",
  "US5024413065": "LVMUY",
  "FR0010261198": "MSE.PA",
  "FR0013451838": "PTPXE.PA",
  "FR0010361683": "PINR.PA",
  "FR0010315770": "EWLD.PA",
  "FR0013412210": "PUST.PA",
  "BTC": "BTC-EUR",
};

export const ETF_EXPOSURE: Record<string, Record<string, number>> = {
  "PINR.PA": { "Inde": 1.0 },
  "PTPXE.PA": { "Japon": 1.0 },
  "MSE.PA": { "France": 0.40, "Allemagne": 0.25, "Pays-Bas": 0.15, "Espagne": 0.08, "Italie": 0.06, "Autre Europe": 0.06 },
  "PUST.PA": { "USA": 1.0 },
  "EWLD.PA": { "USA": 0.70, "Japon": 0.06, "Royaume-Uni": 0.04, "France": 0.03, "Canada": 0.03, "Autre": 0.14 },
  "APC.DE": { "USA": 1.0 },
  "ABEA.DE": { "USA": 1.0 },
  "D7G.DE": { "USA": 1.0 },
  "CLSK": { "USA": 1.0 },
  "ACMR": { "USA": 1.0 },
};

export const DEFAULT_COUNTRY: Record<string, string> = {
  "ACA.PA": "France",
  "ALSTI.PA": "France",
  "TTE.PA": "France",
  "ENI.MI": "Italie",
  "SPIE.PA": "France",
  "EL.PA": "France",
  "GLE.PA": "France",
  "ENX.PA": "France",
  "GTT.PA": "France",
  "MRN.PA": "France",
  "FDJUP.XC": "France",
  "GOLD.PA": "Luxembourg",
  "APC.DE": "USA",
  "ABEA.DE": "USA",
  "D7G.DE": "USA",
  "ACMR": "USA",
  "CLSK": "USA",
};

export const RISK_PROFILES: Record<string, "Low" | "Medium" | "High"> = {
  "PINR.PA": "High",
  "PTPXE.PA": "Medium",
  "MSE.PA": "Medium",
  "PUST.PA": "High",
  "EWLD.PA": "Medium",
  "ACA.PA": "Medium",
  "TTE.PA": "Low",
  "GLE.PA": "Medium",
  "EL.PA": "Low",
  "GTT.PA": "Medium",
  "FDJUP.XC": "Low",
  "ENI.MI": "Medium",
  "GOLD.PA": "Medium",
  "APC.DE": "Low",
  "ABEA.DE": "Low",
  "D7G.DE": "Medium",
  "CLSK": "High",
  "ACMR": "High",
};

export function parseCSV(csvText: string): Transaction[] {
  const lines = csvText.split("\n").map(l => l.trim()).filter(l => l);
  if (lines.length === 0) return [];

  const transactions: Transaction[] = [];

  // Detect format
  if (lines[0].toLowerCase().includes("datetime") || lines[0].includes("\",\"")) {
    const headers = lines[0].replace(/"/g, "").split(",");
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Robust split for quoted CSV
      const parts: string[] = [];
      let inQuotes = false;
      let current = "";
      for (let char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          parts.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      parts.push(current);

      const getVal = (header: string) => {
        const idx = headers.indexOf(header);
        return parts[idx] || "";
      };

      const type = getVal("type");
      const category = getVal("category");
      if (category === "CASH" && !["DIVIDEND", "INTEREST_PAYMENT"].includes(type)) continue;

      const symbol = getVal("symbol");
      const name = getVal("name");
      const label = name || symbol;
      
      let operation = "Autre";
      if (type === "BUY") operation = "Achat";
      else if (type === "SELL") operation = "Vente";
      else if (type === "DIVIDEND") operation = "Dividende";
      else if (type === "INTEREST_PAYMENT") operation = "Coupon";

      const rawDate = getVal("date"); // YYYY-MM-DD
      const dParts = rawDate.split("-");
      const date = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : rawDate;

      const shares = Math.abs(parseFloat(getVal("shares") || "0"));
      const price = parseFloat(getVal("price") || "0");
      const amount = parseFloat(getVal("amount") || "0");
      const fee = parseFloat(getVal("fee") || "0");
      const tax = parseFloat(getVal("tax") || "0");
      
      // For buy/sell, we want the net cash flow
      const netAmount = Math.abs(amount + fee + tax);

      transactions.push({
        label,
        operation,
        place: getVal("asset_class"),
        date,
        quantity: shares,
        price,
        grossAmount: Math.abs(amount),
        fees: Math.abs(fee + tax),
        netAmount,
        currency: getVal("currency"),
        ticker: ISIN_MAP[symbol] || symbol
      });
    }
    return transactions;
  }

  // Fallback to semicolon format
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(";");
    if (parts.length < 9) continue;

    const label = parts[0];
    const operation = parts[1];
    const place = parts[2];
    const date = parts[3];
    const quantity = parseFloat(parts[4]?.replace(",", ".") || "0");
    const price = parseFloat(parts[5]?.replace(",", ".") || "0");
    const grossAmount = parseFloat(parts[6]?.replace(",", ".") || "0");
    const fees = parseFloat(parts[7]?.replace(",", ".") || "0");
    const netAmount = parseFloat(parts[8]?.replace(",", ".") || "0");
    const currency = parts[9];

    transactions.push({
      label,
      operation,
      place,
      date,
      quantity,
      price,
      grossAmount,
      fees,
      netAmount,
      currency,
    });
  }

  return transactions;
}

export function deduplicateTransactions(transactions: Transaction[]): Transaction[] {
  const parseDate = (d: string) => {
    if (!d) return 0;
    // Handle DD/MM/YYYY
    if (d.includes("/")) {
      const [day, month, year] = d.split("/").map(Number);
      return new Date(year, month - 1, day).getTime();
    }
    // Handle YYYY-MM-DD (ISO)
    if (d.includes("-")) {
      const [year, month, day] = d.split("-").map(Number);
      return new Date(year, month - 1, day).getTime();
    }
    return new Date(d).getTime() || 0;
  };

  const sorted = [...transactions].sort((a, b) => parseDate(a.date) - parseDate(b.date));
  
  const finalTransactions: Transaction[] = [];
  const dividendHistory = new Map<string, { date: number, amount: number }[]>();

  for (const tx of sorted) {
    const isDiv = tx.operation.toLowerCase().includes("coupon") || tx.operation.toLowerCase().includes("dividende");
    if (isDiv) {
      const txTime = parseDate(tx.date);
      const history = dividendHistory.get(tx.label) || [];
      
      const isDup = history.some(h => 
        Math.abs(h.amount - tx.netAmount) < 0.001 && 
        Math.abs(h.date - txTime) <= 10 * 24 * 60 * 60 * 1000
      );

      if (isDup) continue;
      
      history.push({ date: txTime, amount: tx.netAmount });
      dividendHistory.set(tx.label, history);
    }
    finalTransactions.push(tx);
  }

  return finalTransactions;
}

export function getTicker(label: string): string {
  if (!label) return "UNKNOWN";
  const up = label.toUpperCase().trim();
  
  // Exact matches first from map
  if (TICKER_MAP[up]) return TICKER_MAP[up];

  // Specific check for Bourse Direct "Long" lines or footer lines
  if (up.includes("LONG ") || up.includes("TOTAL ") || up.includes("SOLDE ") || up.startsWith("EL :")) {
    if (up.includes(" €") || up.includes(" EUR") || up.match(/\d+[\.,]\d+/)) {
      return "UNKNOWN";
    }
  }

  // Fuzzy matches
  if (up.includes("BITCOIN") || up === "BTC") return "BTC-EUR";
  if (up.includes("GOLD 3X") || up.includes("3X LEV GOLD")) return "3GLO.MI";
  if (up.includes("GOLD") || up.includes("OR ") || up === "OR" || up.includes("GLDA") || up.includes("AMUNDIPHME") || up.includes("PHYSICAL GOLD")) return "GLDA";
  if (up.includes("APPLE") || up.includes("AAPL")) return "APC.DE";
  if (up.includes("ALPHABET") || up.includes("GOOGLE") || up.includes("GOOGL")) return "ABEA.DE";
  if (up.includes("ACMR") || up.includes("ACM RESEARCH")) return "ACMR";
  if (up.includes("DELL")) return "D7G.DE";
  if (up.includes("CLEANSPARK") || up.includes("CLSK")) return "CLSK";
  if (up.includes("FDJ")) return "FDJ.PA";
  if (up.includes("LVMH") || up.includes("LOUIS VUITTON")) return "MC.PA";
  if (up.includes("CAC 40") && up.includes("CORE")) return "CACC.PA";
  if (up.includes("S&P 500") || up.includes("CSPX") || up === "CORE S") return "CSPX.AS";
  if (up.includes("CORE S ")) return "CSPX.AS";
  if (up.includes("COFFEE 3X")) return "3LCF.MI";
  if (up.includes("SUGAR 3X")) return "3LSU.MI";
  if (up.includes("COFFEE 2X")) return "LCFE.MI";
  if (up.includes("DU PONT") || up.includes("DUPONT")) return "DD";
  if (up.includes("INDE") && up.includes("INDIA")) return "PINR.PA";
  if (up.includes("JAPON") && up.includes("TOPIX")) return "PTPXE.PA";
  if (up.includes("NASDAQ-100") || up.includes("NASDAQ 100")) return "PUST.PA";
  if (up.includes("EURO STOXX 50")) return "MSE.PA";
  if (up.includes("MSCI WORLD SWAP")) return "EWLD.PA";
  if (up.includes("CCC")) return "CCC.WA";
  if (up.includes("GTT")) return "GTT.PA";
  if (up.includes("CREDIT AGRICOLE") || up.includes("ACA")) return "ACA.PA";
  if (up.includes("EURONEXT") || up.includes("ENX")) return "ENX.PA";
  if (up.includes("ESSILOR") || up.includes("EL.PA")) return "EL.PA";
  if (up.includes("MERSEN") || up.includes("MRN.PA")) return "MRN.PA";
  if (up.includes("SOCIETE GENERALE") || up.includes("GLE.PA")) return "GLE.PA";
  
  // Final verification: standard ticker format
  return (up.includes(".") || (up.length <= 6 && !up.includes(" ") && up.match(/^[A-Z0-9\.-]+$/))) ? up : "UNKNOWN";
}

export function calculatePortfolio(
  transactions: Transaction[], 
  currentPrices: Record<string, Quote>,
  riskData: Record<string, any> = {}
): { positions: Position[], closedPositions: Position[], summary: PortfolioSummary } {
  const finalTransactions = deduplicateTransactions(transactions);

  const positionsMap: Record<string, {
    quantity: number,
    totalCost: number,
    realizedPL: number,
    dividends: number,
    label: string,
    ticker?: string,
    lastPru: number // Keep track of the PRU before closing
  }> = {};

  for (const tx of finalTransactions) {
    if (!positionsMap[tx.label]) {
      positionsMap[tx.label] = { 
        quantity: 0, 
        totalCost: 0, 
        realizedPL: 0, 
        dividends: 0, 
        label: tx.label,
        ticker: tx.ticker,
        lastPru: 0 
      };
    }

    const pos = positionsMap[tx.label];
    if (tx.ticker) pos.ticker = tx.ticker; // Update/Preserve ticker

    if (tx.operation.toLowerCase().includes("achat")) {
      pos.quantity += tx.quantity;
      pos.totalCost += Math.abs(tx.netAmount);
      pos.lastPru = pos.quantity > 0 ? pos.totalCost / pos.quantity : pos.lastPru;
    } else if (tx.operation.toLowerCase().includes("vente")) {
      const pru = pos.quantity > 0 ? pos.totalCost / pos.quantity : pos.lastPru;
      const gain = tx.netAmount - (pru * tx.quantity);
      pos.realizedPL += gain;
      
      pos.totalCost -= (pru * tx.quantity);
      pos.quantity -= tx.quantity;
      if (pos.quantity <= 0.0001) {
        pos.totalCost = 0; // Prevent float artifacts
        pos.quantity = 0;
      }
    } else if (tx.operation.toLowerCase().includes("coupon") || tx.operation.toLowerCase().includes("dividende")) {
      pos.dividends += tx.netAmount;
      // Do not add to realizedPL here, keep them separate
    }
  }

  const allComputedPositions: Position[] = Object.values(positionsMap)
    .filter(p => p.quantity > 0 || Math.abs(p.realizedPL) > 0.01)
    .map(p => {
      const ticker = p.ticker || getTicker(p.label);
      const quote = currentPrices[ticker];
      const isLivePrice = !!quote && quote.price > 0;
      const currentPrice = isLivePrice ? quote.price : (p.quantity > 0 ? p.totalCost / p.quantity : 0);
      const currentValue = p.quantity * currentPrice;
      const latentPL = currentValue - p.totalCost;
      const latentPLPercent = p.totalCost > 0 ? (latentPL / p.totalCost) * 100 : 0;

      let countryExposure: Record<string, number> = {};
      if (ETF_EXPOSURE[ticker]) {
        countryExposure = ETF_EXPOSURE[ticker];
      } else {
        const country = DEFAULT_COUNTRY[ticker] || "Unknown";
        countryExposure[country] = 1.0;
      }

      // Improved asset type categorization
      let assetType = "Stock";
      const upLabel = p.label.toUpperCase();
      const upTicker = ticker.toUpperCase();

      if (upLabel.includes("ETF") || upLabel.includes("UCITS") || upLabel.includes("FUND") || upTicker === "EWLD.PA" || upTicker === "PUST.PA") {
        assetType = "ETF";
      } else if (upLabel.includes("BITCOIN") || upLabel.includes("BTC") || upTicker.includes("BTC") || upTicker.includes("ETH")) {
        assetType = "Crypto";
      } else if (upLabel.includes("GOLD") || upLabel.includes("SUGAR") || upLabel.includes("COFFEE") || upTicker === "GOLD.PA" || upTicker === "GZMT.PA" || upTicker === "3SUG.MI") {
        assetType = "Commodity";
      } else if (upLabel.includes("TURBO") || upLabel.includes("LONG") || upLabel.includes("SHORT") || p.label.toLowerCase().includes("derivative")) {
        assetType = "Derivative";
      }

      // Risk Profile logic: Use riskData if available, otherwise fallback to static map or defaults
      let riskProfile: "Low" | "Medium" | "High" = "Medium";
      let riskScore = 5;
      let sector = "Finances";

      if (assetType === "Crypto") sector = "Technologie";
      if (assetType === "Commodity") sector = "Matières Premières";
      if (assetType === "Derivative") sector = "Produits Dérivés";

      if (riskData[ticker]) {
        const rd = riskData[ticker];
        riskProfile = rd.riskProfile;
        riskScore = rd.riskScore;
        sector = rd.sector !== "Unknown" ? rd.sector : sector;
        assetType = rd.assetType || assetType;
      } else if (RISK_PROFILES[ticker]) {
        riskProfile = RISK_PROFILES[ticker];
        riskScore = riskProfile === "Low" ? 3 : riskProfile === "High" ? 8 : 5;
      } else {
        // Defaults based on type
        if (assetType === "Crypto" || assetType === "Derivative") {
          riskProfile = "High";
          riskScore = 9;
        } else if (assetType === "Commodity") {
          riskProfile = "Medium";
          riskScore = 7;
        } else if (assetType === "ETF") {
          riskProfile = "Low";
          riskScore = 4;
        } else {
          riskProfile = "Medium";
          riskScore = 6;
        }
      }

      return {
        label: p.label,
        ticker,
        quantity: p.quantity,
        averageCost: p.quantity > 0 ? p.totalCost / p.quantity : p.lastPru,
        totalCost: p.totalCost,
        currentPrice,
        isLivePrice,
        currentValue,
        latentPL,
        latentPLPercent,
        realizedPL: p.realizedPL,
        totalPL: latentPL + p.realizedPL,
        dividends: p.dividends,
        countryExposure,
        riskProfile,
        riskScore,
        sector,
        assetType,
      };
    });

  const positions = allComputedPositions.filter(p => p.quantity > 0.0001);
  const closedPositions = allComputedPositions.filter(p => Math.abs(p.realizedPL) > 0.01);

  const summary: PortfolioSummary = {
    totalValue: positions.reduce((acc, p) => acc + p.currentValue, 0),
    totalLatentPL: positions.reduce((acc, p) => acc + p.latentPL, 0),
    totalRealizedPL: allComputedPositions.reduce((acc, p) => acc + p.realizedPL, 0),
    totalDividends: allComputedPositions.reduce((acc, p) => acc + p.dividends, 0),
    totalFees: finalTransactions
      .filter(tx => tx.operation.toLowerCase().includes("frais") || tx.operation.toLowerCase().includes("taxe"))
      .reduce((acc, tx) => acc + Math.abs(tx.netAmount), 0),
    totalPL: 0,
    latentPerformance: 0,
    globalPerformance: 0,
    investedCapital: positions.reduce((acc, p) => acc + p.totalCost, 0),
  };

  summary.totalPL = summary.totalLatentPL + summary.totalRealizedPL + summary.totalDividends - summary.totalFees;
  summary.latentPerformance = summary.investedCapital > 0 ? (summary.totalLatentPL / summary.investedCapital) * 100 : 0;
  
  // Total cost ever put in for global performance? 
  // Let's use current invested capital + cost of sold shares (which is not directly tracked here)
  // Or just P&L vs current invested.
  summary.globalPerformance = summary.investedCapital > 0 ? (summary.totalPL / summary.investedCapital) * 100 : 0;

  return { positions, closedPositions, summary };
}
