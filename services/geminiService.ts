
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
            summary: { type: Type.STRING },
            advice: { type: Type.STRING }
          },
          required: ["summary", "advice"]
        }
      }
    });

    return JSON.parse(response.text || '{"summary": "No analysis available.", "advice": "Please add more stocks."}');
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

  const prompt = `Search for the latest, real-time market data for these Indian stock symbols (NSE/BSE): ${tickers.join(', ')}.
  Return ONLY a JSON object where keys are the ticker names and values are objects containing:
  - price: current trading price (number)
  - pe: TTM P/E ratio (number)
  - pb: P/B ratio (number)
  - eps: TTM EPS (number)
  
  Ensure the data is the most recent available. Do not include currency symbols or commas in numbers.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          description: "Market data keyed by ticker",
          properties: tickers.reduce((acc, ticker) => {
            acc[ticker] = {
              type: Type.OBJECT,
              properties: {
                price: { type: Type.NUMBER },
                pe: { type: Type.NUMBER },
                pb: { type: Type.NUMBER },
                eps: { type: Type.NUMBER }
              },
              required: ["price"]
            };
            return acc;
          }, {} as any)
        }
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter(Boolean) || [];

    const rawData = JSON.parse(response.text || "{}");
    // Normalize keys to uppercase to match our application state
    const data: Record<string, MarketData> = {};
    Object.keys(rawData).forEach(key => {
      data[key.toUpperCase()] = rawData[key];
    });

    return { data, sources };
  } catch (error) {
    console.error("Market Data fetch failed:", error);
    return { data: {}, sources: [] };
  }
};
