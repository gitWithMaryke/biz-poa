import { db } from '../db/index.js';
import { OutboxMessage } from '../types/index.js';

export function normalizePhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (/^\+254[17]\d{8}$/.test(cleaned)) return cleaned;
  if (/^254[17]\d{8}$/.test(cleaned)) return `+${cleaned}`;
  if (/^0[17]\d{8}$/.test(cleaned)) return `+254${cleaned.slice(1)}`;
  return null;
}

export async function sendSMS(to: string, message: string): Promise<OutboxMessage> {
  const norm = normalizePhone(to);
  if (!norm) {
    throw new Error('Invalid Kenyan phone number format. Expected 07XXXXXXXX, 01XXXXXXXX, or +254XXXXXXXXX.');
  }

  const settings = db.getSettings();
  const outboxItem = db.addOutbox(norm, message, 'queued');

  // If no API key configured or in sandbox simulation mode
  if (!settings.key || settings.key === 'atsk_sandbox_dummy_key_replace_with_live') {
    // Simulate real SMS gateway latency and delivery
    setTimeout(() => {
      db.updateOutboxStatus(outboxItem.id, 'sent');
    }, 1200);
    return outboxItem;
  }

  // Real Africa's Talking HTTP dispatch
  try {
    db.updateOutboxStatus(outboxItem.id, 'sending');
    const host = settings.sandbox ? 'api.sandbox.africastalking.com' : 'api.africastalking.com';
    const url = `https://${host}/version1/messaging`;

    const bodyParams = new URLSearchParams();
    bodyParams.append('username', settings.sandbox ? 'sandbox' : settings.user);
    bodyParams.append('to', norm);
    bodyParams.append('message', message);
    if (settings.sender) {
      bodyParams.append('from', settings.sender);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': settings.key
      },
      body: bodyParams.toString()
    });

    const data: any = await response.json();
    if (response.ok && data?.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
      db.updateOutboxStatus(outboxItem.id, 'sent');
    } else {
      const errReason = data?.SMSMessageData?.Recipients?.[0]?.status || response.statusText;
      db.updateOutboxStatus(outboxItem.id, 'failed', errReason);
    }
  } catch (err: any) {
    db.updateOutboxStatus(outboxItem.id, 'failed', err.message);
  }

  return outboxItem;
}

export function formatSaleReceiptSMS(shopName: string, sale: { receiptNo: number; lines: { name: string; qty: number; price: number }[]; total: number; method: string }): string {
  const linesSummary = sale.lines.map(l => `${l.qty}x ${l.name} KES ${l.qty * l.price}`).join('\n');
  return `${shopName}\nReceipt #${String(sale.receiptNo).padStart(4, '0')}\n${linesSummary}\nTotal: KES ${sale.total.toLocaleString()}\nPayment: ${sale.method.toUpperCase()}\nAsante sana, Karibu tena!`;
}

export function formatDailyClosingReportSMS(offset: number = 0): string {
  const stats = db.getStatsForDayOffset(offset);
  const settings = db.getSettings();
  const lowItems = db.getProducts().filter(p => p.qty <= (p.minStockAlert || 5));

  const dayName = offset === 0 ? 'Today' : offset === 1 ? 'Yesterday' : new Date(stats.dayStart).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' });

  let text = `${settings.shop}\nDaily Closing Report: ${dayName}\nTotal Sales: KES ${stats.income.toLocaleString()}\nReceipts: ${stats.receiptCount} (${stats.itemsSold} units)\nCash: KES ${stats.byMethod.cash.toLocaleString()}\nM-Pesa: KES ${stats.byMethod.mpesa.toLocaleString()}`;
  if (stats.byMethod.card > 0) {
    text += `\nCard: KES ${stats.byMethod.card.toLocaleString()}`;
  }

  if (lowItems.length > 0) {
    const lowSummary = lowItems.slice(0, 3).map(p => `${p.name.slice(0, 15)} (${p.qty})`).join(', ');
    text += `\nLow Stock: ${lowSummary}`;
  }

  return text;
}
