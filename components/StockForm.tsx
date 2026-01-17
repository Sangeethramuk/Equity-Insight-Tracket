
import React, { useState } from 'react';
import { StockPurchase } from '../types';

interface StockFormProps {
  onAdd: (purchase: StockPurchase) => void;
  existingTickers: string[];
}

const StockForm: React.FC<StockFormProps> = ({ onAdd, existingTickers }) => {
  const [formData, setFormData] = useState({
    name: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    pe: '',
    pb: '',
    eps: '',
    price: '',
    quantity: '',
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.pe || !formData.pb || !formData.eps || !formData.price || !formData.quantity) return;

    const newPurchase: StockPurchase = {
      id: crypto.randomUUID(),
      name: formData.name.trim().toUpperCase(),
      purchaseDate: formData.purchaseDate,
      pe: parseFloat(formData.pe),
      pb: parseFloat(formData.pb),
      eps: parseFloat(formData.eps),
      price: parseFloat(formData.price),
      quantity: parseFloat(formData.quantity),
      note: formData.note.trim() || undefined
    };

    onAdd(newPurchase);
    setFormData({
      ...formData,
      name: '',
      pe: '',
      pb: '',
      eps: '',
      price: '',
      quantity: '',
      note: ''
    });
  };

  const totalCost = (parseFloat(formData.price) || 0) * (parseFloat(formData.quantity) || 0);

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">Log Transaction</h3>
        {totalCost > 0 && (
          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Total Cost: ₹{totalCost.toLocaleString()}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Stock Ticker</label>
          <input
            required
            list="ticker-suggestions"
            type="text"
            placeholder="e.g. RELIANCE"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoComplete="off"
          />
          <datalist id="ticker-suggestions">
            {existingTickers.map(ticker => (
              <option key={ticker} value={ticker} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Buy Price (₹)</label>
          <input
            required
            type="number"
            step="0.01"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quantity</label>
          <input
            required
            type="number"
            step="0.001"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
          <input
            required
            type="date"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">P/E @ Buy</label>
          <input
            required
            type="number"
            step="0.01"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            value={formData.pe}
            onChange={(e) => setFormData({ ...formData, pe: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">P/B @ Buy</label>
          <input
            required
            type="number"
            step="0.01"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            value={formData.pb}
            onChange={(e) => setFormData({ ...formData, pb: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">EPS @ Buy</label>
          <input
            required
            type="number"
            step="0.01"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            value={formData.eps}
            onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Note (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Post earnings buy"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg"
      >
        Log Investment Record
      </button>
    </form>
  );
};

export default StockForm;
