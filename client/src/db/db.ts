import Dexie, { Table } from 'dexie';
import { Product, Sale, OutboxItem, ShopSettings } from '../types/index.js';
import { initialProducts, initialRemovedProducts, defaultSettings } from './seedData.js';

export class BizpoaDexieDB extends Dexie {
  products!: Table<Product, string>;
  sales!: Table<Sale, string>;
  outbox!: Table<OutboxItem, string>;
  settings!: Table<ShopSettings & { id: string }, string>;

  constructor() {
    super('BizpoaPOSDB');
    this.version(1).stores({
      products: 'id, name, category, barcode, qty, isArchived',
      sales: 'id, receiptNo, timestamp, method, phone, synced',
      outbox: 'id, to, status, timestamp',
      settings: 'id'
    });
  }

  async seedInitialDataIfNeeded() {
    const prodCount = await this.products.count();
    if (prodCount === 0) {
      await this.products.bulkAdd([...initialProducts, ...initialRemovedProducts]);
    }

    const settingsCount = await this.settings.count();
    if (settingsCount === 0) {
      await this.settings.add({ id: 'main', ...defaultSettings });
    }

    const salesCount = await this.sales.count();
    if (salesCount === 0) {
      const now = Date.now();
      const HOUR = 3600000;
      const initialSales: Sale[] = [
        {
          id: 's41',
          receiptNo: 41,
          timestamp: now - 2.4 * HOUR,
          lines: [
            { id: 'p7', name: 'Brookside Milk 500ml', qty: 2, price: 65 },
            { id: 'p4', name: 'Supaloaf Bread 400g', qty: 1, price: 70 }
          ],
          total: 200,
          method: 'cash',
          tendered: 200,
          change: 0,
          phone: '',
          smsId: null,
          synced: true
        },
        {
          id: 's42',
          receiptNo: 42,
          timestamp: now - 1.1 * HOUR,
          lines: [
            { id: 'p1', name: 'Jogoo Maize Flour 2kg', qty: 2, price: 190 },
            { id: 'p2', name: 'Mumias Sugar 1kg', qty: 1, price: 170 }
          ],
          total: 550,
          method: 'mpesa',
          tendered: 0,
          change: 0,
          phone: '+254712345678',
          smsId: 'm1',
          synced: true
        }
      ];
      await this.sales.bulkAdd(initialSales);

      await this.outbox.add({
        id: 'm1',
        to: '+254712345678',
        text: `Mama Njeri Duka\nReceipt #0042\n2x Jogoo Maize Flour 2kg 380\n1x Mumias Sugar 1kg 170\nTotal KES 550\nAsante!`,
        status: 'sent',
        timestamp: now - 1.1 * HOUR
      });
    }
  }
}

export const localDB = new BizpoaDexieDB();
