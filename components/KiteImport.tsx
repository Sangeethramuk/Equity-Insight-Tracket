
import React, { useRef } from 'react';
import { StockPurchase } from '../types';
import * as XLSX from 'xlsx';

interface KiteImportProps {
  onImport: (purchases: StockPurchase[]) => void;
  onToast: (msg: string, type: 'success' | 'info') => void;
}

const KiteImport: React.FC<KiteImportProps> = ({ onImport, onToast }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Robust CSV row parser that handles commas inside quotes.
   */
  const parseCSVRow = (row: string): string[] => {
    const result = [];
    let startValue = 0;
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      if (row[i] === '"') {
        inQuotes = !inQuotes;
      } else if (row[i] === ',' && !inQuotes) {
        result.push(row.substring(startValue, i).replace(/^"|"$/g, '').trim());
        startValue = i + 1;
      }
    }
    result.push(row.substring(startValue).replace(/^"|"$/g, '').trim());
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCsv = fileName.endsWith('.csv');

    if (!isExcel && !isCsv) {
      onToast('Invalid file type. Please upload .csv or .xlsx', 'info');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let rows: any[][] = [];

        if (isExcel) {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          // Convert sheet to array of arrays (header included)
          rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        } else {
          const text = event.target?.result as string;
          if (!text) throw new Error('File is empty');
          const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
          rows = lines.map(parseCSVRow);
        }

        if (rows.length < 2) throw new Error('File has no data rows');

        const headers = rows[0].map((h: any) => String(h || '').toLowerCase());
        
        // Dynamic mapping of headers to find indices
        const instrumentIdx = headers.findIndex((h: string) => 
          h.includes('instrument') || h.includes('symbol') || h.includes('ticker')
        );
        const qtyIdx = headers.findIndex((h: string) => 
          h.includes('qty') || h.includes('quantity') || h.includes('shares')
        );
        const avgPriceIdx = headers.findIndex((h: string) => 
          (h.includes('avg') || h.includes('average')) && (h.includes('cost') || h.includes('price'))
        );

        if (instrumentIdx === -1 || qtyIdx === -1 || avgPriceIdx === -1) {
          throw new Error('Headers not recognized. Required: Instrument, Qty, Avg. cost');
        }

        const newPurchases: StockPurchase[] = [];
        const dataRows = rows.slice(1);

        dataRows.forEach((cols) => {
          if (cols.length <= Math.max(instrumentIdx, qtyIdx, avgPriceIdx)) return;

          const ticker = String(cols[instrumentIdx] || '').toUpperCase().trim();
          
          // Clean numeric values if they are strings (Excel often provides numbers directly)
          let cleanQty = String(cols[qtyIdx] || '0').replace(/[₹,]/g, '');
          let cleanPrice = String(cols[avgPriceIdx] || '0').replace(/[₹,]/g, '');
          
          const qty = parseFloat(cleanQty);
          const price = parseFloat(cleanPrice);

          // Validation: Check if it's a valid data row and not a 'Total' summary row
          if (ticker && ticker !== 'TOTAL' && !isNaN(qty) && !isNaN(price) && qty > 0) {
            newPurchases.push({
              id: crypto.randomUUID(),
              name: ticker,
              purchaseDate: new Date().toISOString().split('T')[0],
              price: price,
              quantity: qty,
              pe: 0,
              pb: 0,
              eps: 0,
              note: 'Kite Portfolio Import'
            });
          }
        });

        if (newPurchases.length > 0) {
          onImport(newPurchases);
          onToast(`Imported ${newPurchases.length} holdings from ${isExcel ? 'Excel' : 'CSV'}`, 'success');
        } else {
          onToast('No valid holdings found in the file.', 'info');
        }
      } catch (err: any) {
        onToast(err.message || 'Error parsing file', 'info');
        console.error('Kite Import Error:', err);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex items-center">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".csv, .xlsx, .xls" 
        className="hidden" 
      />
      <button 
        onClick={(e) => {
          e.preventDefault();
          fileInputRef.current?.click();
        }}
        className="flex items-center gap-2 px-4 py-2 bg-[#387ed1] hover:bg-[#2d6ab3] text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all shadow-md active:scale-95 border-b-2 border-transparent hover:border-white/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>Kite Import</span>
      </button>
    </div>
  );
};

export default KiteImport;
