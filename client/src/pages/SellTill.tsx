import React, { useState, useMemo } from 'react';
import { Search, ScanBarcode, ArrowRight } from 'lucide-react';
import { Product, CartItem } from '../types/index.js';

interface SellTillProps {
  products: Product[];
  cart: CartItem[];
  todayIncome: number;
  todaySalesCount: number;
  onAddToCart: (product: Product) => void;
  onOpenCart: () => void;
  onOpenScanner: () => void;
  onGoToSales: () => void;
}

const CATEGORY_HUES: Record<string, string> = {
  'Staples': '#d97706',
  'Dairy & Eggs': '#0284c7',
  'Drinks': '#e11d48',
  'Household': '#059669',
  'Snacks': '#d97706',
  'Personal Care': '#7c3aed',
};

function getMonogram(name: string): string {
  const words = name.split(/\s+/).filter(w => /^[A-Za-z]/.test(w));
  return (words.slice(0, 2).map(w => w[0]).join('').toUpperCase()) || '?';
}

function getHueForCategory(cat: string): string {
  if (CATEGORY_HUES[cat]) return CATEGORY_HUES[cat];
  let hash = 0;
  for (let i = 0; i < cat.length; i++) {
    hash = (hash * 31 + cat.charCodeAt(i)) % 360;
  }
  return `hsl(${hash}, 65%, 45%)`;
}

export const SellTill: React.FC<SellTillProps> = ({
  products,
  cart,
  todayIncome,
  todaySalesCount,
  onAddToCart,
  onOpenCart,
  onOpenScanner,
  onGoToSales,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      if (p.isArchived) return false;
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.barcode.includes(q);
      return matchCat && matchSearch;
    });
  }, [products, search, selectedCategory]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const cartMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach(item => map.set(item.id, item.qty));
    return map;
  }, [cart]);

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Today Income Strip */}
      <button
        onClick={onGoToSales}
        className="w-full flex items-baseline justify-between px-3.5 py-2.5 bg-[#0F7B5A] text-white rounded-2xl shadow-sm text-left hover:bg-[#0c664a] transition-colors"
      >
        <span className="text-xs font-semibold opacity-90">Today's Sales</span>
        <b className="text-base font-bold font-mono tracking-tight">KES {todayIncome.toLocaleString()}</b>
        <span className="text-xs font-medium opacity-80">{todaySalesCount} sale{todaySalesCount === 1 ? '' : 's'}</span>
      </button>

      {/* Search Bar + Barcode Scanner Trigger */}
      <div className="flex gap-2">
        <div className="flex-1 relative flex items-center bg-white border border-[#DAE1DC] rounded-xl px-3 focus-within:border-[#0F7B5A] shadow-2xs">
          <Search className="w-4 h-4 text-[#5C6962] shrink-0" />
          <input
            type="search"
            placeholder={`Search ${products.length} products...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2.5 px-2 bg-transparent text-sm text-[#14201B] placeholder-gray-400 focus:outline-none"
          />
        </div>

        <button
          onClick={onOpenScanner}
          className="w-11 h-11 bg-[#0F7B5A] hover:bg-[#0c664a] text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95"
          title="Scan barcode"
          aria-label="Scan barcode"
        >
          <ScanBarcode className="w-5 h-5" />
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                isSelected
                  ? 'bg-[#14201B] text-white border-transparent'
                  : 'bg-white text-gray-700 border-[#DAE1DC] hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Product Tiles Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center text-[#5C6962]">
          <p className="text-sm font-semibold">No items match your search.</p>
          <p className="text-xs text-gray-400 mt-1">Try another category or scan an item barcode.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {filteredProducts.map((p) => {
            const inCart = cartMap.get(p.id) || 0;
            const isLow = p.qty <= (p.minStockAlert || 5);
            const isOutOfStock = p.qty <= 0;
            const isCartMax = inCart >= p.qty;
            const brandHue = getHueForCategory(p.category);

            return (
              <button
                key={p.id}
                disabled={isOutOfStock || isCartMax}
                onClick={() => onAddToCart(p)}
                className={`relative flex flex-col justify-between p-2.5 bg-white border border-[#DAE1DC] rounded-2xl text-left transition-all active:scale-[0.98] shadow-2xs ${
                  isOutOfStock || isCartMax ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-500'
                }`}
              >
                {/* Visual Monogram Header Box */}
                <div
                  className="w-full h-14 rounded-xl flex items-center justify-center text-xl font-extrabold font-display tracking-wider mb-2"
                  style={{
                    backgroundColor: `${brandHue}18`,
                    color: brandHue,
                  }}
                >
                  {getMonogram(p.name)}
                </div>

                {/* In Cart Badge */}
                {inCart > 0 && (
                  <span className="absolute top-2 right-2 min-w-[22px] h-[22px] bg-[#0F7B5A] text-white font-bold text-xs rounded-full flex items-center justify-center px-1.5 shadow-sm">
                    {inCart}
                  </span>
                )}

                {/* Product Name */}
                <span className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.5em]">
                  {p.name}
                </span>

                {/* Price and Stock status */}
                <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-gray-100">
                  <span className="text-xs font-mono font-bold text-gray-900">
                    KES {p.price.toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      isLow ? 'text-amber-600 font-bold' : 'text-gray-400'
                    }`}
                  >
                    {isOutOfStock ? 'Sold out' : `${p.qty} left`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-14 left-0 right-0 max-w-md mx-auto px-3 z-20 animate-in slide-in-from-bottom duration-150">
          <button
            onClick={onOpenCart}
            className="w-full py-3 px-4 bg-[#0F7B5A] hover:bg-[#0c664a] text-white rounded-2xl flex items-center justify-between shadow-xl shadow-emerald-950/20 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-white text-[#0F7B5A] font-extrabold text-xs rounded-full flex items-center justify-center">
                {cartCount}
              </span>
              <span className="font-bold text-sm">View Cart</span>
            </div>

            <div className="flex items-center gap-1.5 font-mono font-bold text-base">
              <span>KES {cartTotal.toLocaleString()}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
