
import React from 'react';
import { StockSummary } from '../types';
import { MarketData } from '../services/geminiService';

interface SummaryCardProps {
  summary: StockSummary;
  currentMetrics?: Partial<MarketData>;
  onUpdatePrice: (name: string, price: number) => void;
  onUpdateMetric: (name: string, metric: keyof MarketData, value: number) => void;
  onOpenAlerts: (ticker: string) => void;
  hasActiveAlerts: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  summary, 
  currentMetrics, 
  onUpdatePrice, 
  onUpdateMetric,
  onOpenAlerts, 
  hasActiveAlerts 
}) => {
  const gainValue = (summary.currentPrice - summary.weightedAvgPrice) * summary.totalQuantity;
  const gainPercent = ((summary.currentPrice - summary.weightedAvgPrice) / summary.weightedAvgPrice) * 100;
  const isProfit = summary.currentPrice >= summary.weightedAvgPrice;

  const latestNote = summary.purchases
    .slice()
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
    .find(p => p.note)?.note;

  const MetricInput = ({ label, avg, live, metricKey }: { label: string, avg: number, live?: number, metricKey: keyof MarketData }) => (
    <div className="text-center">
      <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">{label}</p>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-black text-slate-400 mb-1" title="Average Purchase Value">
          {avg.toFixed(1)}
        </span>
        <input 
          type="number"
          step="0.01"
          className="w-12 bg-transparent text-center text-[11px] font-black text-indigo-600 outline-none border-b border-indigo-100 focus:border-indigo-400 transition-colors"
          value={live !== undefined ? live : ''}
          onChange={(e) => onUpdateMetric(summary.name, metricKey, parseFloat(e.target.value) || 0)}
          placeholder="—"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group relative">
      <button 
        onClick={() => onOpenAlerts(summary.name)}
        className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${hasActiveAlerts ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}
        title="Manage Alerts"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>

      <div className="flex justify-between items-start mb-4 pr-10">
        <div>
          <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{summary.name}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {summary.totalQuantity.toLocaleString()} shares held
          </p>
        </div>
      </div>

      <div className="flex flex-col mb-4">
        <div className="flex gap-1 items-center mb-1">
          <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isProfit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            ABS: {isProfit ? '+' : ''}{gainPercent.toFixed(2)}%
          </div>
          <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${summary.xirr >= 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
            XIRR: {summary.xirr.toFixed(2)}%
          </div>
        </div>
        <p className={`text-sm font-black ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isProfit ? '+' : ''}₹{gainValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Avg Buy Basis</p>
          <p className="text-md font-black text-slate-700">₹{summary.weightedAvgPrice.toFixed(2)}</p>
        </div>
        <div className="bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50">
          <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">Live Price</p>
          <div className="flex items-center">
            <span className="text-indigo-400 mr-1 text-sm">₹</span>
            <input 
              type="number"
              step="0.01"
              className="w-full bg-transparent text-md font-black text-indigo-700 outline-none border-b border-indigo-200 focus:border-indigo-500"
              value={summary.currentPrice || ''}
              onChange={(e) => onUpdatePrice(summary.name, parseFloat(e.target.value) || 0)}
              placeholder="Set price..."
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 py-3 border-y border-slate-100 mb-4 bg-slate-50/50 -mx-5 px-5">
         <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black text-slate-400 uppercase">Valuation Pivot</span>
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Entry vs Live</span>
         </div>
         <div className="grid grid-cols-3 gap-2">
            <MetricInput label="P/E" avg={summary.avgPe} live={currentMetrics?.pe} metricKey="pe" />
            <MetricInput label="P/B" avg={summary.avgPb} live={currentMetrics?.pb} metricKey="pb" />
            <MetricInput label="EPS" avg={summary.avgEps} live={currentMetrics?.eps} metricKey="eps" />
         </div>
      </div>

      {latestNote && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 italic text-[11px] text-slate-500 leading-relaxed">
          <span className="font-black uppercase text-[8px] block text-slate-400 not-italic mb-1 tracking-widest">Latest Insight</span>
          "{latestNote}"
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
