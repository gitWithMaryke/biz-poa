import { Product, Sale, ShopSettings } from '../types/index.js';

const API_BASE = '/api';

export const api = {
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const json = await res.json();
    return json.data;
  },

  async createSale(saleData: any): Promise<Sale> {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });
    if (!res.ok) throw new Error('Failed to record sale');
    const json = await res.json();
    return json.data;
  },

  async syncPush(payload: { sales: Sale[]; outbox: any[] }) {
    const res = await fetch(`${API_BASE}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Sync push failed');
    return await res.json();
  },

  async syncPull() {
    const res = await fetch(`${API_BASE}/sync/pull`);
    if (!res.ok) throw new Error('Sync pull failed');
    return await res.json();
  },

  async sendSMS(to: string, message: string) {
    const res = await fetch(`${API_BASE}/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message })
    });
    if (!res.ok) throw new Error('Failed to send SMS');
    return await res.json();
  },

  async triggerDailyReportSMS(offset: number = 0, phone?: string) {
    const res = await fetch(`${API_BASE}/reports/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offset, phone })
    });
    if (!res.ok) throw new Error('Failed to send report SMS');
    return await res.json();
  },

  async getWeekStats() {
    const res = await fetch(`${API_BASE}/reports/week`);
    if (!res.ok) throw new Error('Failed to fetch week report');
    return (await res.json()).data;
  },

  async getDailyStats(offset: number = 0) {
    const res = await fetch(`${API_BASE}/reports/daily?offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch daily report');
    return (await res.json()).data;
  },

  async getSettings(): Promise<ShopSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return (await res.json()).data;
  },

  async updateSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return (await res.json()).data;
  },

  async triggerSTKPush(phone: string, amount: number) {
    const res = await fetch(`${API_BASE}/mpesa/stkpush`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, amount })
    });
    if (!res.ok) throw new Error('Failed to trigger STK Push');
    return await res.json();
  }
};
