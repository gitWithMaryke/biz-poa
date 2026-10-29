import React from 'react';
import { Printer, Check, MessageSquare } from 'lucide-react';
import { Modal } from './Modal.js';
import { Sale } from '../types/index.js';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  shopName: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  shopName,
}) => {
  if (!sale) return null;

  const dateStr = new Date(sale.timestamp).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date(sale.timestamp).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Receipt #${String(sale.receiptNo).padStart(4, '0')}`}>
      <div className="flex flex-col gap-4">
        {/* Printable Thermal Receipt Box */}
        <div
          id="thermal-receipt"
          className="bg-[#F8FAF9] border border-dashed border-gray-300 rounded-xl p-4 font-mono text-xs text-gray-800 flex flex-col gap-2 shadow-inner"
        >
          <div className="text-center font-bold text-sm tracking-wide text-gray-900 uppercase">
            {shopName}
          </div>
          <div className="text-center text-[11px] text-gray-500">
            {dateStr} · {timeStr}
          </div>

          <div className="border-t border-dashed border-gray-300 my-1" />

          {/* Line items */}
          <div className="flex flex-col gap-1.5">
            {sale.lines.map((l, i) => (
              <div key={i} className="flex justify-between items-baseline gap-2">
                <span className="truncate flex-1">
                  {l.qty}x {l.name}
                </span>
                <span className="shrink-0 font-semibold">
                  KES {(l.qty * l.price).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 my-1" />

          {/* Totals */}
          <div className="flex justify-between text-sm font-bold text-gray-900">
            <span>TOTAL</span>
            <span>KES {sale.total.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-gray-600 text-[11px]">
            <span>Paid via</span>
            <span className="uppercase font-semibold">{sale.method}</span>
          </div>

          {sale.method === 'cash' && (
            <>
              <div className="flex justify-between text-gray-600 text-[11px]">
                <span>Cash Tendered</span>
                <span>KES {sale.tendered.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-[11px]">
                <span>Change Returned</span>
                <span>KES {sale.change.toLocaleString()}</span>
              </div>
            </>
          )}

          <div className="border-t border-dashed border-gray-300 my-1" />

          <div className="text-center text-[11px] text-gray-500 italic mt-1">
            Asante sana, karibu tena!
          </div>
        </div>

        {/* SMS Status note */}
        {sale.phone && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-medium">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>SMS to {sale.phone}</span>
            </div>
            <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {sale.synced ? 'Dispatched' : 'Queued (offline)'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={handlePrint}
            className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-3 bg-[#0F7B5A] hover:bg-[#0c664a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
