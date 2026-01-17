
export interface StockPurchase {
  id: string;
  name: string;
  purchaseDate: string;
  pe: number;
  pb: number;
  eps: number;
  price: number;
  quantity: number;
  note?: string;
}

export type AlertType = 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PE_ABOVE' | 'PE_BELOW' | 'PB_ABOVE' | 'PB_BELOW' | 'EPS_ABOVE' | 'EPS_BELOW';

export interface StockAlert {
  id: string;
  ticker: string;
  type: AlertType;
  threshold: number;
  isActive: boolean;
  triggeredAt?: string;
}

export interface StockSummary {
  name: string;
  avgPe: number;
  avgPb: number;
  avgEps: number;
  weightedAvgPrice: number;
  totalQuantity: number;
  totalInvested: number;
  currentPrice: number;
  count: number;
  purchases: StockPurchase[];
  xirr: number;
}

export interface AIAnalysis {
  summary: string;
  advice: string;
}
