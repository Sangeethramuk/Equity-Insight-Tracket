
import React, { useState, useMemo, useEffect, useRef } from 'react';
import StockForm from './components/StockForm';
import SummaryCard from './components/SummaryCard';
import AlertModal from './components/AlertModal';
import EditPurchaseModal from './components/EditPurchaseModal';
import RecommendationView from './components/RecommendationView';
import { StockPurchase, StockSummary, AIAnalysis, StockAlert } from './types';
import { getPortfolioAnalysis, fetchMarketPrices, MarketData } from './services/geminiService';
import { calculateXIRR } from './utils/finance';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'recommendations'>('dashboard');
  const [purchases, setPurchases] = useState<StockPurchase[]>(() => {
    const saved = localStorage.getItem('equity_purchases_v2');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('equity_prices');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentMetrics, setCurrentMetrics] = useState<Record<string, Partial<MarketData>>>(() => {
    const saved = localStorage.getItem('equity_metrics');
    return saved ? JSON.parse(saved) : {};
  });

  const [alerts, setAlerts] = useState<StockAlert[]>(() => {
    const saved = localStorage.getItem('equity_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeToast, setActiveToast] = useState<{message: string, type: 'info' | 'success'} | null>(null);
  const [selectedTickerForAlert, setSelectedTickerForAlert] = useState<string | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<StockPurchase | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGithubGuide, setShowGithubGuide] = useState(false);

  useEffect(() => {
    localStorage.setItem('equity_purchases_v2', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('equity_prices', JSON.stringify(currentPrices));
    localStorage.setItem('equity_metrics', JSON.stringify(currentMetrics));
  }, [currentPrices, currentMetrics]);

  useEffect(() => {
    localStorage.setItem('equity_alerts', JSON.stringify(alerts));
  }, [alerts]);

  const showToast = (message: string, type: 'info' | 'success' = 'info') => {
    setActiveToast({ message, type });
    setTimeout(() => setActiveToast(null), 5000);
  };

  const handleSyncMarket = async () => {
    const tickers: string[] = Array.from(new Set(purchases.map(p => p.name.toUpperCase())));
    if (tickers.length === 0) return;

    setIsSyncing(true);
    showToast('Syncing with live market...', 'info');
    
    try {
      const { data } = await fetchMarketPrices(tickers);
      if (Object.keys(data).length > 0) {
        const prices: Record<string, number> = {};
        const metrics: Record<string, Partial<MarketData>> = {};
        
        Object.entries(data).forEach(([ticker, val]) => {
          prices[ticker] = val.price;
          metrics[ticker] = { pe: val.pe, pb: val.pb, eps: val.eps };
        });

        setCurrentPrices(prev => ({ ...prev, ...prices }));
        setCurrentMetrics(prev => ({ ...prev, ...metrics }));
        showToast(`Updated market data for ${Object.keys(data).length} assets`, 'success');
      } else {
        showToast('No updated market data found', 'info');
      }
    } catch (error) {
      showToast('Market sync failed', 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  const checkAlerts = (summaries: StockSummary[]) => {
    const newAlerts = [...alerts];
    let triggered = false;

    summaries.forEach(s => {
      const stockAlerts = newAlerts.filter(a => a.ticker === s.name && a.isActive);
      stockAlerts.forEach(alert => {
        let isBreached = false;
        switch (alert.type) {
          case 'PRICE_ABOVE': isBreached = s.currentPrice >= alert.threshold; break;
          case 'PRICE_BELOW': isBreached = s.currentPrice <= alert.threshold; break;
          case 'PE_ABOVE': isBreached = s.avgPe >= alert.threshold; break;
          case 'PE_BELOW': isBreached = s.avgPe <= alert.threshold; break;
          case 'PB_ABOVE': isBreached = s.avgPb >= alert.threshold; break;
          case 'PB_BELOW': isBreached = s.avgPb <= alert.threshold; break;
        }

        if (isBreached) {
          alert.isActive = false; 
          alert.triggeredAt = new Date().toISOString();
          triggered = true;
          const msg = `Alert: ${s.name} ${alert.type.replace('_', ' ').toLowerCase()} ${alert.threshold}`;
          showToast(msg, 'success');
        }
      });
    });

    if (triggered) setAlerts(newAlerts);
  };

  const addPurchase = (purchase: StockPurchase) => {
    setPurchases(prev => [...prev, purchase]);
    if (!currentPrices[purchase.name]) {
      setCurrentPrices(prev => ({ ...prev, [purchase.name]: purchase.price }));
    }
  };

  const updatePurchase = (updated: StockPurchase) => {
    setPurchases(prev => prev.map(p => p.id === updated.id ? updated : p));
    showToast(`Updated record for ${updated.name}`, 'success');
    setEditingPurchase(null);
  };

  const removePurchase = (id: string) => {
    if (confirm('Permanently delete this transaction record?')) {
      setPurchases(prev => prev.filter(p => p.id !== id));
    }
  };

  const updateCurrentPrice = (name: string, price: number) => {
    setCurrentPrices(prev => ({ ...prev, [name]: price }));
  };

  const handleUpdateMetric = (name: string, metric: keyof MarketData, value: number) => {
    setCurrentMetrics(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        [metric]: value
      }
    }));
  };

  const addAlert = (newAlert: Omit<StockAlert, 'id' | 'isActive'>) => {
    const alert: StockAlert = { ...newAlert, id: crypto.randomUUID(), isActive: true };
    setAlerts(prev => [...prev, alert]);
    showToast(`Alert set for ${newAlert.ticker}`, 'success');
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleAIAnalysis = async () => {
    if (summaries.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await getPortfolioAnalysis(summaries);
      setAiAnalysis(result);
      showToast('AI Portfolio Report Generated', 'success');
    } catch (error) {
      showToast('Failed to generate AI report', 'info');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const summaries = useMemo(() => {
    const groups: Record<string, StockPurchase[]> = {};
    purchases.forEach(p => {
      const name = p.name.trim().toUpperCase();
      if (!groups[name]) groups[name] = [];
      groups[name].push(p);
    });

    return Object.entries(groups).map(([name, items]) => {
      const count = items.length;
      const totalQuantity = items.reduce((sum, p) => sum + p.quantity, 0);
      const totalInvested = items.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const weightedAvgPrice = totalInvested / totalQuantity;
      const avgPe = items.reduce((sum, p) => sum + p.pe, 0) / count;
      const avgPb = items.reduce((sum, p) => sum + p.pb, 0) / count;
      const avgEps = items.reduce((sum, p) => sum + p.eps, 0) / count;
      const currentPrice = currentPrices[name] || 0;
      const flows = items.map(p => ({ amount: -(p.price * p.quantity), date: new Date(p.purchaseDate) }));
      flows.push({ amount: currentPrice * totalQuantity, date: new Date() });
      flows.sort((a, b) => a.date.getTime() - b.date.getTime());
      const xirr = calculateXIRR(flows);
      return { name, avgPe, avgPb, avgEps, weightedAvgPrice, totalQuantity, totalInvested, currentPrice, count, purchases: items, xirr };
    }).sort((a, b) => b.totalInvested - a.totalInvested);
  }, [purchases, currentPrices]);

  useEffect(() => {
    if (summaries.length > 0) checkAlerts(summaries);
  }, [summaries, alerts.length]);

  const portfolioStats = useMemo(() => {
    const totalInvested = summaries.reduce((sum, s) => sum + s.totalInvested, 0);
    const totalCurrentValue = summaries.reduce((sum, s) => sum + (s.currentPrice * s.totalQuantity), 0);
    const totalGain = totalCurrentValue - totalInvested;
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
    const allFlows = purchases.map(p => ({ amount: -(p.price * p.quantity), date: new Date(p.purchaseDate) }));
    if (totalCurrentValue > 0) allFlows.push({ amount: totalCurrentValue, date: new Date() });
    allFlows.sort((a, b) => a.date.getTime() - b.date.getTime());
    const portfolioXirr = calculateXIRR(allFlows);
    return { totalInvested, totalCurrentValue, totalGain, totalGainPercent, portfolioXirr };
  }, [summaries, purchases]);

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 pb-20 selection:bg-indigo-100 relative">
      {/* GitHub Guide Modal */}
      {showGithubGuide && (
        <div className="fixed inset-0 z-[400] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 italic uppercase">GitHub <span className="text-indigo-600">Push Guide</span></h2>
              <button onClick={() => setShowGithubGuide(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-600 font-medium">To push this app to your GitHub, run these commands in your local project folder:</p>
              <div className="bg-slate-900 p-4 rounded-2xl font-mono text-xs text-indigo-300 space-y-2 overflow-x-auto">
                <p>git init</p>
                <p>git add .</p>
                <p>git commit -m "Initial commit of EquityInsight"</p>
                <p>git branch -M main</p>
                <p className="text-white">git remote add origin https://github.com/YOUR_USERNAME/equity-insight.git</p>
                <p>git push -u origin main</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-xs text-indigo-700 leading-relaxed">
                  <b>Pro Tip:</b> After pushing, go to your Repository Settings &gt; Pages and set the source to "main" to host the app for free on GitHub Pages!
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowGithubGuide(false)}
              className="w-full mt-8 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest text-sm"
            >
              Ready to Push
            </button>
          </div>
        </div>
      )}

      {isSyncing && (
        <div className="fixed inset-0 z-[300] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-xs uppercase tracking-[0.3em] text-indigo-600 animate-pulse">Syncing Fundamentals...</p>
        </div>
      )}

      {activeToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-bounce-in">
          <div className={`px-6 py-4 rounded-3xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${activeToast.type === 'success' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <p className="font-black text-xs uppercase tracking-widest">{activeToast.message}</p>
          </div>
        </div>
      )}

      {selectedTickerForAlert && (
        <AlertModal 
          ticker={selectedTickerForAlert}
          alerts={alerts.filter(a => a.ticker === selectedTickerForAlert)}
          onClose={() => setSelectedTickerForAlert(null)}
          onSave={addAlert}
          onDelete={deleteAlert}
        />
      )}

      {editingPurchase && (
        <EditPurchaseModal 
          purchase={editingPurchase}
          onClose={() => setEditingPurchase(null)}
          onUpdate={updatePurchase}
        />
      )}

      <nav className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight italic hidden sm:block uppercase">Equity<span className="text-indigo-600">Sync</span></h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowGithubGuide(true)}
              className="p-2.5 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2"
              title="Push to GitHub"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            </button>

            <button 
              onClick={handleSyncMarket}
              disabled={isSyncing || purchases.length === 0}
              className={`p-2.5 rounded-full transition-all ${isSyncing ? 'animate-spin bg-slate-100' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
              title="Sync Market Prices & Fundamentals"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button 
              onClick={handleAIAnalysis}
              disabled={isAnalyzing || summaries.length === 0}
              className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-slate-800 disabled:bg-slate-200 transition-all shadow-md"
            >
              {isAnalyzing ? "Analyzing..." : "AI Report"}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex gap-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('recommendations')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'recommendations' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Recommendations
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {activeTab === 'dashboard' ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Portfolio Value</p>
                <p className="text-3xl font-black text-slate-900">₹{portfolioStats.totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-xs mt-2 text-slate-500 font-medium italic">Invested: ₹{portfolioStats.totalInvested.toLocaleString()}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Returns</p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-3xl font-black ${portfolioStats.totalGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {portfolioStats.totalGain >= 0 ? '+' : ''}{portfolioStats.totalGainPercent.toFixed(2)}%
                  </p>
                </div>
                <p className="text-xs mt-2 font-bold text-slate-400 uppercase tracking-tight">Relative Performance</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Portfolio XIRR</p>
                <p className={`text-3xl font-black ${portfolioStats.portfolioXirr >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                  {portfolioStats.portfolioXirr.toFixed(2)}%
                </p>
                <p className="text-xs mt-2 text-slate-500 font-medium">Market Optimized</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Triggers</p>
                <p className="text-3xl font-black text-slate-900">{alerts.filter(a => a.isActive).length}</p>
                <p className="text-xs mt-2 text-slate-500 font-medium">Monitoring Triggers</p>
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              <div className="xl:col-span-8 space-y-8">
                <StockForm onAdd={addPurchase} existingTickers={Array.from(new Set(purchases.map(p => p.name)))} />
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[11px]">Audit Ledger</h3>
                    <span className="text-[10px] font-bold text-indigo-500">{purchases.length} Records</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                          <tr>
                            <th className="px-8 py-5 text-left">Asset</th>
                            <th className="px-8 py-5 text-left">Basis</th>
                            <th className="px-8 py-5 text-left">Valuation</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[...purchases].reverse().map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="px-8 py-5"><p className="font-bold text-slate-900">{p.name}</p><p className="text-[10px] text-slate-400 font-medium">{p.purchaseDate}</p></td>
                              <td className="px-8 py-5"><span className="font-bold text-slate-800">₹{p.price.toLocaleString()}</span><span className="text-[10px] text-slate-400 ml-2">x {p.quantity}</span></td>
                              <td className="px-8 py-5"><span className="text-xs font-black text-indigo-600">PE: {p.pe.toFixed(1)}</span></td>
                              <td className="px-8 py-5 text-right flex justify-end gap-2">
                                <button onClick={() => setEditingPurchase(p)} className="text-slate-300 hover:text-indigo-600 p-2 transition-colors" title="Edit Record">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button onClick={() => removePurchase(p.id)} className="text-slate-300 hover:text-rose-500 p-2 transition-colors" title="Delete Record">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <aside className="xl:col-span-4 space-y-6 lg:sticky lg:top-28">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">Live Fundamentals</h2>
                  <button onClick={handleSyncMarket} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-100 hover:border-indigo-600 transition-all">Sync All</button>
                </div>
                <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 scrollbar-hide pb-10">
                  {summaries.length === 0 ? <div className="p-16 border-2 border-dashed border-slate-200 rounded-[3rem] text-center bg-white text-slate-300 italic text-sm">Portfolio Empty</div> : summaries.map(s => (
                    <SummaryCard 
                      key={s.name} 
                      summary={s} 
                      currentMetrics={currentMetrics[s.name]} 
                      onUpdatePrice={updateCurrentPrice} 
                      onUpdateMetric={handleUpdateMetric}
                      onOpenAlerts={(ticker) => setSelectedTickerForAlert(ticker)} 
                      hasActiveAlerts={alerts.some(a => a.ticker === s.name && a.isActive)} 
                    />
                  ))}
                </div>
              </aside>
            </div>
          </>
        ) : (
          <RecommendationView summaries={summaries} currentMetrics={currentMetrics} onSync={handleSyncMarket} />
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] z-50">
        Live Market Sync Enabled &bull; Buy/Sell Recommendations Active &bull; v4.9
      </footer>
    </div>
  );
};

export default App;
