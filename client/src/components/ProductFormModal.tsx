import React, { useState } from 'react';
import { Modal } from './Modal.js';
import { Product } from '../types/index.js';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (product: {
    id?: string;
    name: string;
    category: string;
    price: number;
    qty: number;
    barcode: string;
    minStockAlert: number;
  }) => void;
}

const CATEGORIES = ['Staples', 'Dairy & Eggs', 'Drinks', 'Household', 'Snacks', 'Personal Care', 'General'];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
}) => {
  const [name, setName] = useState(productToEdit?.name || '');
  const [category, setCategory] = useState(productToEdit?.category || 'Staples');
  const [price, setPrice] = useState(productToEdit ? String(productToEdit.price) : '');
  const [qty, setQty] = useState(productToEdit ? String(productToEdit.qty) : '');
  const [barcode, setBarcode] = useState(productToEdit?.barcode || '');
  const [minStockAlert, setMinStockAlert] = useState(productToEdit?.minStockAlert ? String(productToEdit.minStockAlert) : '5');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an item name.');
      return;
    }
    const numPrice = Number(price);
    const numQty = Number(qty);
    if (!numPrice || numPrice <= 0) {
      alert('Please enter a valid price.');
      return;
    }
    if (isNaN(numQty) || numQty < 0) {
      alert('Please enter a valid stock quantity.');
      return;
    }

    onSave({
      id: productToEdit?.id,
      name: name.trim(),
      category: category.trim() || 'General',
      price: numPrice,
      qty: Math.floor(numQty),
      barcode: barcode.trim(),
      minStockAlert: Number(minStockAlert) || 5,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={productToEdit ? 'Edit Stock Item' : 'Add New Inventory Item'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
          Product Name
          <input
            type="text"
            required
            placeholder="e.g. Jogoo Maize Flour 2kg"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-emerald-600"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-emerald-600"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Price (KES)
            <input
              type="number"
              required
              min="1"
              placeholder="190"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-mono font-bold text-gray-900 focus:outline-emerald-600"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Stock Units
            <input
              type="number"
              required
              min="0"
              placeholder="24"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-mono font-bold text-gray-900 focus:outline-emerald-600"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Barcode (EAN-13 / UPC)
            <input
              type="text"
              placeholder="Scan or type"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-mono text-gray-900 focus:outline-emerald-600"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Low Stock Threshold
            <input
              type="number"
              min="1"
              value={minStockAlert}
              onChange={(e) => setMinStockAlert(e.target.value)}
              className="w-full px-3 py-2 bg-[#EEF1EE] border border-gray-200 rounded-xl text-sm font-mono text-gray-900 focus:outline-emerald-600"
            />
          </label>
        </div>

        <button
          type="submit"
          className="mt-2 w-full py-3 bg-[#0F7B5A] hover:bg-[#0c664a] text-white font-bold rounded-xl text-sm transition-colors shadow-md"
        >
          {productToEdit ? 'Save Changes' : 'Add to Stock'}
        </button>
      </form>
    </Modal>
  );
};
