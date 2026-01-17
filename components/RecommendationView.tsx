
import React, { useState, useMemo } from 'react';
import { StockSummary } from '../types';
import { MarketData } from '../services/geminiService';

interface RecommendationViewProps {
  summaries: StockSummary[];
  currentMetrics: Record<string, Partial<MarketData>>;
  onSync: () => void;
}

const RecommendationView: React.FC<RecommendationViewProps> = ({ summaries, currentMetrics, onSync }) => {
  const [recType, setRecType] = useState<'BUY' | 'SELL'>('BUY');
  const [valuationFilter, setValuationFilter] = useState<'PE' | 'PB' | 'ALL'>('ALL');

  const recommendations = useMemo(() => {
    return summaries.map(s => {
      const livePe = currentMetrics[s.name]?.pe;
      const livePb = currentMetrics[s.name]?.pb;
      
      const peDiff = livePe ? ((s.avgPe - livePe) / s.avgPe) * 100 : 0;
      const pbDiff = livePb ? ((s.avgPb - livePb) / s.avgPb) * 100 : 0;
      
      // For SELL, we want the premium: ((Current - Avg) / Avg) * 100
      // This is just -peDiff and -pbDiff
      const pePremium = -peDiff;
      const pbPremium = -pbDiff;

      return {
        ...s,
        livePe,
        livePb,
        peDiff, // positive means discount (BUY), negative means premium (SELL)
        pbDiff, // positive means discount (BUY), negative means premium (SELL)
        pePremium,
        pbPremium,
        maxBuyGap: Math.max(peDiff, pbDiff),
        maxSellGap: Math.max(pePremium, pbPremium)
      };
    });
  }, [summaries, currentMetrics]);

  const filteredList = useMemo(() => {
    let list = recommendations.filter(r => r.livePe !== undefined || r.livePb !== undefined);

    if (recType === 'BUY') {
      // Filter for discounts
      if (valuationFilter === 'PE') list = list.filter(r => r.peDiff > 0);
      else if (valuationFilter === 'PB') list = list.filter(r => r.pbDiff > 0);
      else list = list.filter(r => r.peDiff > 0 || r.pbDiff > 0);
      
      // Sort by maximum discount
      return list.sort((a, b) => b.maxBuyGap - a.maxBuyGap);
    } else {
      // Filter for premiums
      if (valuationFilter === 'PE') list = list.filter(r => r.pePremium > 0);
      else if (valuationFilter === 'PB') list = list.filter(r => r.pbPremium > 0);
      else list = list.filter(r => r.pePremium > 0 || r.pbPremium > 0);
      
      // Sort by maximum premium
      return list.sort((a, b) => b.maxSellGap - a.maxSellGap);
    }
  }, [recommendations, recType, valuationFilter]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-3xl ${recType === 'BUY' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {recType === 'BUY' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">
              {recType === 'BUY' ? 'Accumulation' : 'Distribution'} <span className={recType === 'BUY' ? 'text-emerald-600' : 'text-amber-600'}>Signals</span>
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Based on historical {valuationFilter !== 'ALL' ? valuationFilter : 'PE/PB'} multiples
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* BUY/SELL Toggle */}
          <div className="bg-slate-100 p-1 rounded-2xl flex">
            <button 
              onClick={() => setRecType('BUY')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${recType === 'BUY' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Buy
            </button>
            <button 
              onClick={() => setRecType('SELL')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${recType === 'SELL' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sell
            </button>
          </div>

          {/* Metric Filter */}
          <div className="bg-slate-100 p-1 rounded-2xl flex">
            <button 
              onClick={() => setValuationFilter('ALL')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${valuationFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setValuationFilter('PE')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${valuationFilter === 'PE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              PE
            </button>
            <button 
              onClick={() => setValuationFilter('PB')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${valuationFilter === 'PB' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              PB
            </button>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {filteredList.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
          <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">No {recType} Hits</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto mb-8 font-medium">
            {recType === 'BUY' 
              ? "None of your assets are trading below your average multiples currently." 
              : "None of your assets have exceeded your historical entry multiples."}
          </p>
          <button onClick={onSync} className="px-8 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all">Force Refresh Market</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map(s => {
            const isBuy = recType === 'BUY';
            const showPe = valuationFilter === 'ALL' || valuationFilter === 'PE';
            const showPb = valuationFilter === 'ALL' || valuationFilter === 'PB';
            
            const peGap = isBuy ? s.peDiff : s.pePremium;
            const pbGap = isBuy ? s.pbDiff : s.pbPremium;
            const themeColor = isBuy ? 'emerald' : 'amber';

            return (
              <div key={s.name} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-500 transition-all flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-all">{s.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {isBuy ? 'Valuation Discount' : 'Valuation Premium'}
                    </p>
                  </div>
                  {peGap > 0 && pbGap > 0 && (
                    <div className={`bg-${themeColor}-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse`}>
                      Dual {isBuy ? 'Buy' : 'Sell'}
                    </div>
                  )}
                </div>

                <div className="space-y-6 flex-1">
                  {showPe && s.livePe !== undefined && (isBuy ? s.peDiff > 0 : s.pePremium > 0) && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">P/E {isBuy ? 'Gap' : 'Premium'}</span>
                        <span className={`text-${themeColor}-500`}>{isBuy ? '-' : '+'}{peGap.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-${themeColor}-500 rounded-full transition-all duration-500`} style={{ width: `${Math.min(peGap * 2, 100)}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-500">
                        <span>Avg: {s.avgPe.toFixed(1)}</span>
                        <span>Live: {s.livePe.toFixed(1)}</span>
                      </div>
                    </div>
                  )}

                  {showPb && s.livePb !== undefined && (isBuy ? s.pbDiff > 0 : s.pbPremium > 0) && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">P/B {isBuy ? 'Gap' : 'Premium'}</span>
                        <span className={`text-${themeColor}-500`}>{isBuy ? '-' : '+'}{pbGap.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-${isBuy ? 'indigo' : 'amber'}-500 rounded-full transition-all duration-500`} style={{ width: `${Math.min(pbGap * 2, 100)}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-500">
                        <span>Avg: {s.avgPb.toFixed(1)}</span>
                        <span>Live: {s.livePb.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Recommended Action</p>
                    <p className={`text-sm font-black text-${themeColor}-600 uppercase`}>
                      {isBuy ? 'Accumulate' : 'Take Profit'}
                    </p>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Live Price</p>
                     <p className="text-sm font-black text-slate-900">₹{s.currentPrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendationView;
