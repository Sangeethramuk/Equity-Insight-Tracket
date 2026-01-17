
import { GoogleGenAI, Type } from "@google/genai";
import { StockSummary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getPortfolioAnalysis = async (summaries: StockSummary[]): Promise<{ summary: string; advice: string }> => {
  const portfolioData = summaries.map(s => {
    const gain = ((s.currentPrice - s.weightedAvgPrice) / s.weightedAvgPrice) * 100;
    return {
      ticker: s.name,
      avgPe: s.avgPe.toFixed(2),
      avgPb: s.avgPb.toFixed(2),
      weightedAvgBuyPrice: s.weightedAvgPrice.toFixed(2),
      currentPrice: s.currentPrice.toFixed(2),
      totalGainPercent: gain.toFixed(2) + "%",
      sharesHeld: s.totalQuantity
    };
  });

  const prompt = `Analyze this stock purchase portfolio performance and valuation: ${JSON.stringify(portfolioData)}. 
  The user has tracked these metrics at the time of purchase and current market prices. 
  Provide a professional summary of the portfolio's valuation versus performance. 
  Is the user buying at good valuations? Provide one key piece of strategic advice.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A summary of the current portfolio metrics and performance" },
            advice: { type: Type.STRING, description: "Actionable strategy advice" }
          },
          required: ["summary", "advice"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"summary": "No analysis available.", "advice": "Please add more stocks."}');
    return result;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      summary: "Unable to generate analysis at this time.",
      advice: "Try again after adding more data points."
    };
  }
};

export interface MarketData {
  price: number;
  pe?: number;
  pb?: number;
  eps?: number;
}

export const fetchMarketPrices = async (tickers: string[]): Promise<{ data: Record<string, MarketData>, sources: {title: string, uri: string}[] }> => {
  if (tickers.length === 0) return { data: {}, sources: [] };

  const prompt = `Find the current real-time market data for these Indian stock symbols (NSE/BSE): ${tickers.join(', ')}. 
  For each ticker, find:
  1. Current Price
  2. TTM P/E Ratio
  3. P/B Ratio
  4. Current EPS
  
  Format the response clearly as TICKER: PRICE, PE: val, PB: val, EPS: val.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter(Boolean) || [];

    const data: Record<string, MarketData> = {};
    
    tickers.forEach(ticker => {
      const entry: MarketData = { price: 0 };
      
      // Extract price
      const priceMatch = text.match(new RegExp(`${ticker}\\D*?(\\d[\\d,.]+)`, 'i'));
      if (priceMatch) entry.price = parseFloat(priceMatch[1].replace(/,/g, ''));

      // Extract PE
      const peMatch = text.match(new RegExp(`${ticker}.*?PE:?\\s*(\\d[\\d,.]+)`, 'i')) || text.match(new RegExp(`PE.*?${ticker}.*?(\\d[\\d,.]+)`, 'i'));
      if (peMatch) entry.pe = parseFloat(peMatch[1]);

      // Extract PB
      const pbMatch = text.match(new RegExp(`${ticker}.*?PB:?\\s*(\\d[\\d,.]+)`, 'i')) || text.match(new RegExp(`PB.*?${ticker}.*?(\\d[\\d,.]+)`, 'i'));
      if (pbMatch) entry.pb = parseFloat(pbMatch[1]);

      // Extract EPS
      const epsMatch = text.match(new RegExp(`${ticker}.*?EPS:?\\s*(\\d[\\d,.]+)`, 'i')) || text.match(new RegExp(`EPS.*?${ticker}.*?(\\d[\\d,.]+)`, 'i'));
      if (epsMatch) entry.eps = parseFloat(epsMatch[1]);

      if (entry.price > 0) {
        data[ticker] = entry;
      }
    });

    return { data, sources };
  } catch (error) {
    console.error("Market Data fetch failed:", error);
    return { data: {}, sources: [] };
  }
};
