import { AssetRiskInfo } from "../types";
export type { AssetRiskInfo };

export async function fetchRiskData(tickers: string[]): Promise<Record<string, AssetRiskInfo>> {
  if (tickers.length === 0) return {};

  try {
    const response = await fetch("/api/risk-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers }),
    });

    if (!response.ok) {
      if (response.status === 503) {
        console.warn("Gemini is currently overloaded (503). Retrying might work later.");
      }
      throw new Error(`Failed to fetch risk data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching risk data from server:", error);
    return {};
  }
}
