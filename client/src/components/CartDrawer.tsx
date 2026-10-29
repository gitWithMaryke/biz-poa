import React from 'react';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Modal } from './Modal.js';
import { CartItem } from '../types/index.js';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onClearCart,
  onProceedToCheckout,
}) => {
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Cart">
      {items.length === 0 ? (
        <div className="py-12 text-center text-[#5C6962]">
          <p className="text-sm">Your cart is empty.</p>
          <p className="text-xs text-gray-400 mt-1">Tap items on the till or scan a barcode to add.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="divide-y divide-gray-100 max-h-[46vh] overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-[#5C6962] font-mono">KES {item.price.toLocaleString()} each</p>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-1.5 bg-[#EEF1EE] rounded-lg p-1">
                  <button
                    onClick={() => onUpdateQty(item.id, -1)}
                    className="w-7 h-7 bg-white hover:bg-gray-100 active:scale-95 text-gray-800 rounded-md flex items-center justify-center font-bold shadow-xs transition-transform"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-mono font-bold">{item.qty}</span>
                  <button
                    onClick={() => onUpdateQty(item.id, 1)}
                    className="w-7 h-7 bg-white hover:bg-gray-100 active:scale-95 text-gray-800 rounded-md flex items-center justify-center font-bold shadow-xs transition-transform"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <span className="text-sm font-bold font-mono text-gray-900">
                    KES {(item.price * item.qty).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between">
            <span className="text-sm font-medium text-gray-600">Total Due</span>
            <span className="text-2xl font-bold font-mono text-[#0F7B5A]">
              KES {total.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={onProceedToCheckout}
              className="w-full py-3.5 bg-[#0F7B5A] hover:bg-[#0c664a] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 active:scale-[0.99] transition-all"
            >
              <span>Charge KES {total.toLocaleString()}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClearCart}
              className="w-full py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
