export interface CartItem {
  name: string;
  qty: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  qty: number;
  barcode: string;
  minStockAlert?: number;
  isArchived?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface Sale {
  id: string;
  receiptNo: number;
  timestamp: number;
  lines: CartItem[];
  total: number;
  method: 'cash' | 'mpesa' | 'card';
  tendered: number;
  change?: number;
  phone: string;
  smsId?: string | null;
  synced: boolean;
  notes?: string;
}

export interface OutboxMessage {
  id: string;
  to: string;
  text: string;
  status: 'queued' | 'sending' | 'sent' | 'failed';
  timestamp: number;
  error?: string;
}

export interface ShopSettings {
  shop: string;
  till: string;
  user: string;
  key: string;
  sender: string;
  sandbox: boolean;
  owner: string;
  daily: boolean;
  reportTime: string;
  lastReport: string;
  currency: string;
}

export interface DatabaseState {
  sequence: number;
  products: Product[];
  archivedProducts: Product[];
  sales: Sale[];
  outbox: OutboxMessage[];
  settings: ShopSettings;
}
