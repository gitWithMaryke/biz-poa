import fs from 'fs';
import path from 'path';
import { DatabaseState, Product, Sale, OutboxMessage, ShopSettings } from '../types/index.js';
import { config } from '../config/env.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'duka_db.json');

function ean13(prefix: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(prefix[i]) * (i % 2 === 1 ? 3 : 1);
  }
  const check = (10 - (sum % 10)) % 10;
  return prefix + check;
}

function getInitialSeed(): DatabaseState {
  const now = Date.now();
  const HOUR = 3600000;
  const DAY = 86400000;

  const rawProducts: [string, string, number, number][] = [
    ['Jogoo Maize Flour 2kg', 'Staples', 190, 24],
    ['Mumias Sugar 1kg', 'Staples', 170, 18],
    ['Pishori Rice 1kg', 'Staples', 220, 3], // Low stock trigger
    ['Supaloaf Bread 400g', 'Staples', 70, 12],
    ['Fresh Fri Cooking Oil 1L', 'Staples', 330, 9],
    ['Ketepa Tea Leaves 100g', 'Staples', 85, 15],
    ['Brookside Milk 500ml', 'Dairy & Eggs', 65, 30],
    ['Eggs Tray of 30', 'Dairy & Eggs', 520, 6],
    ['Blue Band 250g', 'Dairy & Eggs', 160, 8],
    ['Coca-Cola 500ml', 'Drinks', 60, 36],
    ['Dasani Water 500ml', 'Drinks', 40, 20],
    ['Stoney Tangawizi 500ml', 'Drinks', 60, 2], // Low stock trigger
    ['Menengai Soap 800g', 'Household', 190, 11],
    ['Omo Detergent 500g', 'Household', 130, 10],
    ['Toilet Roll 4 Pack', 'Household', 150, 14],
    ['Matchbox', 'Household', 15, 40]
  ];

  const products: Product[] = rawProducts.map((p, i) => ({
    id: `prod_${i + 1}`,
    name: p[0],
    category: p[1],
    price: p[2],
    qty: p[3],
    barcode: ean13(`6160001${String(i + 1).padStart(5, '0')}`),
    minStockAlert: 5,
    isArchived: false,
    createdAt: now - 30 * DAY,
    updatedAt: now
  }));

  const archivedProducts: Product[] = [
    {
      id: 'prod_soldout_1',
      name: 'Kimbo Cooking Fat 500g',
      category: 'Staples',
      price: 210,
      qty: 0,
      barcode: ean13('616000100099'),
      minStockAlert: 5,
      isArchived: true,
      createdAt: now - 35 * DAY,
      updatedAt: now - 26 * HOUR
    }
  ];

  // 7-day realistic sales distribution
  const sales: Sale[] = [];
  let seq = 1;
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  let seedRandom = 77;
  const pseudoRandom = (max: number) => {
    seedRandom = (seedRandom * 9301 + 49297) % 233280;
    return Math.floor((seedRandom / 233280) * max);
  };

  for (let d = 6; d >= 1; d--) {
    const daySalesCount = 5 + pseudoRandom(4);
    for (let k = 0; k < daySalesCount; k++) {
      const lineCount = 1 + pseudoRandom(3);
      const lines = [];
      let total = 0;

      for (let j = 0; j < lineCount; j++) {
        const prod = products[pseudoRandom(products.length)];
        const qty = 1 + pseudoRandom(3);
        lines.push({ name: prod.name, qty, price: prod.price });
        total += qty * prod.price;
      }

      const method: 'cash' | 'mpesa' | 'card' = (['cash', 'cash', 'mpesa', 'mpesa', 'card'] as const)[pseudoRandom(5)];
      const timeOffset = (8 + k * 1.3) * HOUR;
      const saleTime = todayMidnight.getTime() - d * DAY + timeOffset;

      sales.push({
        id: `sale_${seq}`,
        receiptNo: seq,
        timestamp: saleTime,
        lines,
        total,
        method,
        tendered: method === 'cash' ? Math.ceil(total / 50) * 50 : 0,
        change: method === 'cash' ? (Math.ceil(total / 50) * 50) - total : 0,
        phone: '',
        smsId: null,
        synced: true
      });
      seq++;
    }
  }

  // Today's active sales
  sales.push({
    id: `sale_${seq}`,
    receiptNo: seq,
    timestamp: now - 2.5 * HOUR,
    lines: [
      { name: 'Brookside Milk 500ml', qty: 2, price: 65 },
      { name: 'Supaloaf Bread 400g', qty: 1, price: 70 }
    ],
    total: 200,
    method: 'cash',
    tendered: 200,
    change: 0,
    phone: '',
    smsId: null,
    synced: true
  });
  seq++;

  sales.push({
    id: `sale_${seq}`,
    receiptNo: seq,
    timestamp: now - 1.1 * HOUR,
    lines: [
      { name: 'Jogoo Maize Flour 2kg', qty: 2, price: 190 },
      { name: 'Mumias Sugar 1kg', qty: 1, price: 170 }
    ],
    total: 550,
    method: 'mpesa',
    tendered: 0,
    change: 0,
    phone: '+254712345678',
    smsId: 'msg_001',
    synced: true
  });

  const outbox: OutboxMessage[] = [
    {
      id: 'msg_001',
      to: '+254712345678',
      text: `${config.shop.name}\nReceipt #${String(seq).padStart(4, '0')}\n2x Jogoo Maize Flour 2kg 380\n1x Mumias Sugar 1kg 170\nTotal KES 550\nAsante!`,
      status: 'sent',
      timestamp: now - 1.1 * HOUR
    }
  ];

  const settings: ShopSettings = {
    shop: config.shop.name,
    till: config.shop.till,
    user: config.africasTalking.username,
    key: config.africasTalking.apiKey,
    sender: config.africasTalking.senderId,
    sandbox: config.africasTalking.isSandbox,
    owner: config.shop.ownerPhone,
    daily: config.shop.dailyReportEnabled,
    reportTime: config.shop.dailyReportTime,
    lastReport: '',
    currency: config.shop.currency
  };

  return {
    sequence: seq,
    products,
    archivedProducts,
    sales,
    outbox,
    settings
  };
}

class Database {
  private state: DatabaseState;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.state = JSON.parse(raw);
      } catch (err) {
        console.warn('Could not read existing database, initializing fresh seed.');
        this.state = getInitialSeed();
        this.persist();
      }
    } else {
      this.state = getInitialSeed();
      this.persist();
    }
  }

  private persist() {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- Products ---
  public getProducts(): Product[] {
    return this.state.products.filter(p => !p.isArchived);
  }

  public getAllProductsIncludingArchived(): Product[] {
    return [...this.state.products, ...this.state.archivedProducts];
  }

  public getProductById(id: string): Product | undefined {
    return this.state.products.find(p => p.id === id) || this.state.archivedProducts.find(p => p.id === id);
  }

  public getProductByBarcode(barcode: string): Product | undefined {
    return this.state.products.find(p => p.barcode === barcode) || this.state.archivedProducts.find(p => p.barcode === barcode);
  }

  public saveProduct(productData: Partial<Product> & { name: string; price: number; qty: number }): Product {
    const existing = productData.id ? this.getProductById(productData.id) : null;
    const now = Date.now();

    if (existing) {
      Object.assign(existing, productData, { updatedAt: now });
      // If archived and quantity added, unarchive
      if (existing.isArchived && existing.qty > 0) {
        existing.isArchived = false;
        this.state.archivedProducts = this.state.archivedProducts.filter(p => p.id !== existing.id);
        if (!this.state.products.some(p => p.id === existing.id)) {
          this.state.products.push(existing);
        }
      }
      this.persist();
      return existing;
    }

    // Check if name or barcode already exists in active list
    const nameMatch = this.state.products.find(p => p.name.toLowerCase() === productData.name.toLowerCase());
    if (nameMatch) {
      nameMatch.qty += productData.qty;
      if (productData.price) nameMatch.price = productData.price;
      if (productData.barcode) nameMatch.barcode = productData.barcode;
      nameMatch.updatedAt = now;
      this.persist();
      return nameMatch;
    }

    const newProd: Product = {
      id: productData.id || `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: productData.name,
      category: productData.category || 'General',
      price: productData.price,
      qty: productData.qty,
      barcode: productData.barcode || '',
      minStockAlert: productData.minStockAlert || 5,
      isArchived: false,
      createdAt: now,
      updatedAt: now
    };

    this.state.products.push(newProd);
    this.persist();
    return newProd;
  }

  public adjustStock(id: string, delta: number): Product | null {
    const prod = this.state.products.find(p => p.id === id);
    if (!prod) return null;

    prod.qty += delta;
    prod.updatedAt = Date.now();

    if (prod.qty <= 0) {
      prod.qty = 0;
      prod.isArchived = true;
      this.state.products = this.state.products.filter(p => p.id !== id);
      this.state.archivedProducts.unshift(prod);
    }

    this.persist();
    return prod;
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.state.products.length;
    this.state.products = this.state.products.filter(p => p.id !== id);
    this.state.archivedProducts = this.state.archivedProducts.filter(p => p.id !== id);
    this.persist();
    return this.state.products.length < initialLen;
  }

  public restoreProduct(id: string, qtyToAdd: number = 10): Product | null {
    const archivedIndex = this.state.archivedProducts.findIndex(p => p.id === id);
    if (archivedIndex === -1) return null;

    const [prod] = this.state.archivedProducts.splice(archivedIndex, 1);
    prod.qty = qtyToAdd;
    prod.isArchived = false;
    prod.updatedAt = Date.now();
    this.state.products.push(prod);
    this.persist();
    return prod;
  }

  public getArchivedProducts(): Product[] {
    return this.state.archivedProducts;
  }

  // --- Sales ---
  public getSales(limit: number = 100): Sale[] {
    return this.state.sales.slice(-limit).reverse();
  }

  public getSaleById(id: string): Sale | undefined {
    return this.state.sales.find(s => s.id === id);
  }

  public recordSale(saleData: Omit<Sale, 'id' | 'receiptNo' | 'timestamp'> & { id?: string; timestamp?: number }): Sale {
    this.state.sequence += 1;
    const now = Date.now();

    const sale: Sale = {
      id: saleData.id || `sale_${this.state.sequence}`,
      receiptNo: this.state.sequence,
      timestamp: saleData.timestamp || now,
      lines: saleData.lines,
      total: saleData.total,
      method: saleData.method,
      tendered: saleData.tendered || 0,
      change: saleData.change || 0,
      phone: saleData.phone || '',
      smsId: saleData.smsId || null,
      synced: true,
      notes: saleData.notes
    };

    // Deduct stock for all items
    for (const line of sale.lines) {
      const prod = this.state.products.find(p => p.name === line.name);
      if (prod) {
        prod.qty -= line.qty;
        prod.updatedAt = now;
        if (prod.qty <= 0) {
          prod.qty = 0;
          prod.isArchived = true;
          this.state.products = this.state.products.filter(p => p.id !== prod.id);
          this.state.archivedProducts.unshift(prod);
        }
      }
    }

    this.state.sales.push(sale);
    this.persist();
    return sale;
  }

  // --- Sync Batch Processing ---
  public batchSync(clientSales: Sale[]): { syncedCount: number; existingCount: number } {
    let syncedCount = 0;
    let existingCount = 0;

    for (const cSale of clientSales) {
      const exists = this.state.sales.some(s => s.id === cSale.id || (s.receiptNo === cSale.receiptNo && Math.abs(s.timestamp - cSale.timestamp) < 5000));
      if (exists) {
        existingCount++;
      } else {
        this.recordSale(cSale);
        syncedCount++;
      }
    }

    return { syncedCount, existingCount };
  }

  // --- Outbox Messages ---
  public getOutbox(): OutboxMessage[] {
    return this.state.outbox;
  }

  public addOutbox(to: string, text: string, status: 'queued' | 'sending' | 'sent' | 'failed' = 'queued'): OutboxMessage {
    const msg: OutboxMessage = {
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      to,
      text,
      status,
      timestamp: Date.now()
    };
    this.state.outbox.unshift(msg);
    this.persist();
    return msg;
  }

  public updateOutboxStatus(id: string, status: 'queued' | 'sending' | 'sent' | 'failed', error?: string): void {
    const msg = this.state.outbox.find(m => m.id === id);
    if (msg) {
      msg.status = status;
      if (error) msg.error = error;
      this.persist();
    }
  }

  // --- Settings ---
  public getSettings(): ShopSettings {
    return this.state.settings;
  }

  public updateSettings(partial: Partial<ShopSettings>): ShopSettings {
    Object.assign(this.state.settings, partial);
    this.persist();
    return this.state.settings;
  }

  // --- Reporting & Stats ---
  public getStatsForDayOffset(offset: number = 0) {
    const targetDate = new Date();
    targetDate.setHours(0, 0, 0, 0);
    const dayStart = targetDate.getTime() - offset * 86400000;
    const dayEnd = dayStart + 86400000;

    const daySales = this.state.sales.filter(s => s.timestamp >= dayStart && s.timestamp < dayEnd);
    const byMethod = { cash: 0, mpesa: 0, card: 0 };
    let itemsSold = 0;
    const productFrequency: Record<string, number> = {};

    for (const s of daySales) {
      byMethod[s.method] = (byMethod[s.method] || 0) + s.total;
      for (const line of s.lines) {
        itemsSold += line.qty;
        productFrequency[line.name] = (productFrequency[line.name] || 0) + line.qty;
      }
    }

    const income = daySales.reduce((sum, s) => sum + s.total, 0);
    const topProducts = Object.entries(productFrequency)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      offset,
      dayStart,
      income,
      receiptCount: daySales.length,
      itemsSold,
      averageTicket: daySales.length ? Math.round(income / daySales.length) : 0,
      byMethod,
      topProducts,
      sales: daySales.sort((a, b) => b.timestamp - a.timestamp)
    };
  }
}

export const db = new Database();
