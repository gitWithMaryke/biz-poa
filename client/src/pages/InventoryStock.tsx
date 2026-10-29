import React, { useState } from 'react';
import { Plus, ScanBarcode, PlusCircle, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Product } from '../types/index.js';

interface InventoryStockProps {
  products: Product[];
  archivedProducts: Product[];
  onAdjustStock: (id: string, delta: number) => void;
  onDeleteProduct: (id: string) => void;
  onRestoreProduct: (id: string, qty: number) => void;
  onOpenAddModal: () => void;
  onOpenScanner: () => void;
}

export const InventoryStock: React.FC<InventoryStockProps> = ({
  products,
  archivedProducts,
  onAdjustStock,
  onDeleteProduct,
  onRestoreProduct,
  onOpenAddModal,
  onOpenScanner,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const activeProducts = products.filter((p) => !p.isArchived);
  const totalUnits = activeProducts.reduce((sum, p) => sum + p.qty, 0);
  const totalValue = activeProducts.reduce((sum, p) => sum + p.qty * p.price, 0);
  const lowStockCount = activeProducts.filter((p) => p.qty <= (p.minStockAlert || 5)).length;

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Inventory KPI Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-[#DAE1DC] flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#5C6962]">Total Items</span>
          <b className="text-xl font-bold font-mono text-gray-900">{activeProducts.length}</b>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-[#DAE1DC] flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#5C6962]">Stock Units</span>
          <b className="text-xl font-bold font-mono text-gray-900">{totalUnits.toLocaleString()}</b>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-[#DAE1DC] flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#5C6962]">Low Stock</span>
          <b className={`text-xl font-bold font-mono ${lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {lowStockCount}
          </b>
        </div>
      </div>

      {/* Header with Inventory Valuation & Actions */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Inventory Catalog</h2>
          <span className="text-xs font-mono text-[#5C6962]">Value: KES {totalValue.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenScanner}
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
          >
            <ScanBarcode className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-3 py-1.5 bg-[#0F7B5A] hover:bg-[#0c664a] text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Products Inventory List */}
      <ul className="flex flex-col gap-2">
        {activeProducts.map((p) => {
          const isLow = p.qty <= (p.minStockAlert || 5);
          return (
            <li
              key={p.id}
              className="bg-white border border-[#DAE1DC] rounded-2xl p-3 flex flex-col gap-2 shadow-2xs transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-gray-900 truncate">{p.name}</span>
                    {isLow && (
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                        Low
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold font-mono text-[#0F7B5A]">
                      KES {p.price.toLocaleString()}
                    </span>
                    {p.barcode && (
                      <span className="text-[10px] font-mono text-gray-400 truncate">
                        BC: {p.barcode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stepper + Quick restock */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-[#EEF1EE] rounded-lg p-1">
                    <button
                      onClick={() => onAdjustStock(p.id, -1)}
                      className="w-6 h-6 bg-white hover:bg-gray-100 text-gray-800 rounded font-bold text-xs flex items-center justify-center shadow-xs"
                      title="Deduct 1"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-xs font-mono font-bold text-gray-900">
                      {p.qty}
                    </span>
                    <button
                      onClick={() => onAdjustStock(p.id, 1)}
                      className="w-6 h-6 bg-white hover:bg-gray-100 text-gray-800 rounded font-bold text-xs flex items-center justify-center shadow-xs"
                      title="Add 1"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => onAdjustStock(p.id, 10)}
                    className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0F7B5A] text-[11px] font-bold rounded-lg transition-colors"
                    title="Add 10 units"
                  >
                    +10
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(p.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Delete confirmation banner */}
              {deleteConfirmId === p.id && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900">
                  <span className="font-semibold">Confirm delete this item?</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        onDeleteProduct(p.id);
                        setDeleteConfirmId(null);
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 bg-white border border-gray-200 text-gray-700 font-bold rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Sold Out & Removed Stock Section */}
      {archivedProducts.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C6962]">
            Sold Out / Removed Items ({archivedProducts.length})
          </h3>

          <ul className="flex flex-col gap-1.5">
            {archivedProducts.map((item) => (
              <li
                key={item.id}
                className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-gray-800 line-through opacity-70">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium block">Sold out</span>
                </div>

                <button
                  onClick={() => onRestoreProduct(item.id, 12)}
                  className="px-3 py-1 bg-white hover:bg-gray-100 text-[#0F7B5A] border border-gray-200 text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restock</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
