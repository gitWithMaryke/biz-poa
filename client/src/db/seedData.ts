import { Product, Sale, ShopSettings } from '../types/index.js';

function ean13(prefix: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(prefix[i]) * (i % 2 === 1 ? 3 : 1);
  }
  const check = (10 - (sum % 10)) % 10;
  return prefix + check;
}

export const initialProducts: Product[] = [
  { id: 'p1', name: 'Jogoo Maize Flour 2kg', category: 'Staples', price: 190, qty: 24, barcode: ean13('616000100001'), minStockAlert: 5, isArchived: false },
  { id: 'p2', name: 'Mumias Sugar 1kg', category: 'Staples', price: 170, qty: 18, barcode: ean13('616000100002'), minStockAlert: 5, isArchived: false },
  { id: 'p3', name: 'Pishori Rice 1kg', category: 'Staples', price: 220, qty: 3, barcode: ean13('616000100003'), minStockAlert: 5, isArchived: false },
  { id: 'p4', name: 'Supaloaf Bread 400g', category: 'Staples', price: 70, qty: 12, barcode: ean13('616000100004'), minStockAlert: 5, isArchived: false },
  { id: 'p5', name: 'Fresh Fri Cooking Oil 1L', category: 'Staples', price: 330, qty: 9, barcode: ean13('616000100005'), minStockAlert: 5, isArchived: false },
  { id: 'p6', name: 'Ketepa Tea Leaves 100g', category: 'Staples', price: 85, qty: 15, barcode: ean13('616000100006'), minStockAlert: 5, isArchived: false },
  { id: 'p7', name: 'Brookside Milk 500ml', category: 'Dairy & Eggs', price: 65, qty: 30, barcode: ean13('616000100007'), minStockAlert: 5, isArchived: false },
  { id: 'p8', name: 'Eggs Tray of 30', category: 'Dairy & Eggs', price: 520, qty: 6, barcode: ean13('616000100008'), minStockAlert: 5, isArchived: false },
  { id: 'p9', name: 'Blue Band 250g', category: 'Dairy & Eggs', price: 160, qty: 8, barcode: ean13('616000100009'), minStockAlert: 5, isArchived: false },
  { id: 'p10', name: 'Coca-Cola 500ml', category: 'Drinks', price: 60, qty: 36, barcode: ean13('616000100010'), minStockAlert: 5, isArchived: false },
  { id: 'p11', name: 'Dasani Water 500ml', category: 'Drinks', price: 40, qty: 20, barcode: ean13('616000100011'), minStockAlert: 5, isArchived: false },
  { id: 'p12', name: 'Stoney Tangawizi 500ml', category: 'Drinks', price: 60, qty: 2, barcode: ean13('616000100012'), minStockAlert: 5, isArchived: false },
  { id: 'p13', name: 'Menengai Soap 800g', category: 'Household', price: 190, qty: 11, barcode: ean13('616000100013'), minStockAlert: 5, isArchived: false },
  { id: 'p14', name: 'Omo Detergent 500g', category: 'Household', price: 130, qty: 10, barcode: ean13('616000100014'), minStockAlert: 5, isArchived: false },
  { id: 'p15', name: 'Toilet Roll 4 Pack', category: 'Household', price: 150, qty: 14, barcode: ean13('616000100015'), minStockAlert: 5, isArchived: false },
  { id: 'p16', name: 'Matchbox', category: 'Household', price: 15, qty: 40, barcode: ean13('616000100016'), minStockAlert: 5, isArchived: false }
];

export const initialRemovedProducts: Product[] = [
  {
    id: 'r1',
    name: 'Kimbo Cooking Fat 500g',
    category: 'Staples',
    price: 210,
    qty: 0,
    barcode: ean13('616000100099'),
    minStockAlert: 5,
    isArchived: true,
    updatedAt: Date.now() - 26 * 3600000
  }
];

export const defaultSettings: ShopSettings = {
  shop: 'Mama Njeri Duka',
  till: '5012345',
  user: 'sandbox',
  key: '',
  sender: '',
  sandbox: true,
  owner: '+254722000111',
  daily: true,
  reportTime: '20:00',
  lastReport: '',
  currency: 'KES'
};
