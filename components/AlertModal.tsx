
import React, { useState } from 'react';
import { StockAlert, AlertType } from '../types';

interface AlertModalProps {
  ticker: string;
  alerts: StockAlert[];
  onClose: () => void;
  onSave: (alert: Omit<StockAlert, 'id' | 'isActive'>) => void;
  onDelete: (id: string) => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ ticker, alerts, onClose, onSave, onDelete }) => {
  const [type, setType] = useState<AlertType>('PRICE_ABOVE');
  const [threshold, setThreshold] = useState('');

  const handleAdd = () => {
    if (!threshold) return;
    onSave({ ticker, type, threshold: parseFloat(threshold) });
    setThreshold('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900">Manage Alerts</h3>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{ticker}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Condition</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as AlertType)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-sm"
                >
                  <option value="PRICE_ABOVE">Price Above</option>
                  <option value="PRICE_BELOW">Price Below</option>
                  <option value="PE_ABOVE">Avg PE Above</option>
                  <option value="PE_BELOW">Avg PE Below</option>
                  <option value="PB_ABOVE">Avg PB Above</option>
                  <option value="PB_BELOW">Avg PB Below</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Value</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="Enter value..."
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                  />
                  <button 
                    onClick={handleAdd}
                    className="bg-indigo-600 text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Triggers</h4>
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center border-2 border-dashed border-slate-100 rounded-3xl">No alerts set for this asset.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{alert.type.replace('_', ' ')}</p>
                      <p className="text-sm font-bold text-slate-700">{alert.threshold.toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => onDelete(alert.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
