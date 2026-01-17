
import React, { useState, useEffect } from 'react';
import { StockPurchase } from '../types';

interface EditPurchaseModalProps {
  purchase: StockPurchase;
  onClose: () => void;
  onUpdate: (updated: StockPurchase) => void;
}

const EditPurchaseModal: React.FC<EditPurchaseModalProps> = ({ purchase, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: purchase.name,
    purchaseDate: purchase.purchaseDate,
    pe: purchase.pe.toString(),
    pb: purchase.pb.toString(),
    eps: purchase.eps.toString(),
    price: purchase.price.toString(),
    quantity: purchase.quantity.toString(),
    note: purchase.note || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.pe || !formData.pb || !formData.eps || !formData.price || !formData.quantity) return;

    const updatedPurchase: StockPurchase = {
      ...purchase,
      name: formData.name.trim().toUpperCase(),
      purchaseDate: formData.purchaseDate,
      pe: parseFloat(formData.pe),
      pb: parseFloat(formData.pb),
      eps: parseFloat(formData.eps),
      price: parseFloat(formData.price),
      quantity: parseFloat(formData.quantity),
      note: formData.note.trim() || undefined
    };

    onUpdate(updatedPurchase);
  };

  const totalCost = (parseFloat(formData.price) || 0) * (parseFloat(formData.quantity) || 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-slide-up">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900">Edit Record</h3>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Reference: {purchase.id.slice(0,8)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Stock Ticker</label>
              <input
                required
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Buy Price (₹)</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">P/E @ Buy</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold"
                value={formData.eps}
                onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
              <input
                required
                type="date"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Note</label>
              <input
                type="text"
                placeholder="Observation..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjusted Value</span>
              <span className="text-xl font-black text-slate-900">₹{totalCost.toLocaleString()}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-all text-sm"
              >
                Discard
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg text-sm uppercase tracking-widest"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPurchaseModal;
