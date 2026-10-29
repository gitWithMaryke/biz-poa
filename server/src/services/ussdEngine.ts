import { db } from '../db/index.js';
import { formatDailyClosingReportSMS, sendSMS } from './africastalking.js';

interface USSDRequest {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  text: string;
}

export function handleUSSDRequest(req: USSDRequest): string {
  const { text, phoneNumber } = req;
  const settings = db.getSettings();
  const inputs = text ? text.split('*') : [];
  const level = inputs.length;
  const lastInput = inputs[inputs.length - 1];

  // Root Menu
  if (level === 0 || text === '') {
    return [
      `CON ${settings.shop} POS`,
      '1. Today\'s Sales Summary',
      '2. Yesterday\'s Sales',
      '3. Last 5 Transactions',
      '4. Low Stock Alerts',
      '5. Request Daily SMS Report',
      '0. Exit'
    ].join('\n');
  }

  // First Level Selections
  if (level === 1) {
    switch (lastInput) {
      case '1': {
        const stats = db.getStatsForDayOffset(0);
        return [
          `CON Today's Sales (${settings.shop}):`,
          `Income: KES ${stats.income.toLocaleString()}`,
          `Sales Count: ${stats.receiptCount}`,
          `Cash: KES ${stats.byMethod.cash.toLocaleString()}`,
          `M-Pesa: KES ${stats.byMethod.mpesa.toLocaleString()}`,
          stats.byMethod.card > 0 ? `Card: KES ${stats.byMethod.card.toLocaleString()}` : '',
          '0. Back to Main Menu'
        ].filter(Boolean).join('\n');
      }

      case '2': {
        const stats = db.getStatsForDayOffset(1);
        return [
          `CON Yesterday's Sales:`,
          `Income: KES ${stats.income.toLocaleString()}`,
          `Sales Count: ${stats.receiptCount}`,
          `Cash: KES ${stats.byMethod.cash.toLocaleString()}`,
          `M-Pesa: KES ${stats.byMethod.mpesa.toLocaleString()}`,
          '0. Back to Main Menu'
        ].join('\n');
      }

      case '3': {
        const sales = db.getSales(5);
        if (!sales.length) {
          return 'CON No recent sales recorded.\n0. Back to Main Menu';
        }
        const lines = sales.map(s => {
          const time = new Date(s.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false });
          return `#${String(s.receiptNo).padStart(4, '0')} ${time} KES ${s.total.toLocaleString()} (${s.method.toUpperCase()})`;
        });
        return [`CON Last 5 Sales:`, ...lines, '0. Back to Main Menu'].join('\n');
      }

      case '4': {
        const lowItems = db.getProducts().filter(p => p.qty <= (p.minStockAlert || 5));
        if (!lowItems.length) {
          return 'CON All products have sufficient stock levels!\n0. Back to Main Menu';
        }
        const lines = lowItems.slice(0, 5).map(p => `${p.name.slice(0, 16)}: ${p.qty} left`);
        return [`CON Low Stock Items (<=5):`, ...lines, '0. Back to Main Menu'].join('\n');
      }

      case '5': {
        const report = formatDailyClosingReportSMS(0);
        const recipient = phoneNumber || settings.owner;
        sendSMS(recipient, report).catch(console.error);
        return `END Sales report has been dispatched to ${recipient} via SMS.\nAsante!`;
      }

      case '0':
        return 'END Thank you for using Bizpoa POS. Goodbye!';

      default:
        return 'CON Invalid option selected.\n0. Back to Main Menu';
    }
  }

  // Level 2 (e.g., user pressed 0 to go back)
  if (lastInput === '0') {
    return [
      `CON ${settings.shop} POS`,
      '1. Today\'s Sales Summary',
      '2. Yesterday\'s Sales',
      '3. Last 5 Transactions',
      '4. Low Stock Alerts',
      '5. Request Daily SMS Report',
      '0. Exit'
    ].join('\n');
  }

  return 'END Session ended. Dial *384*5012# to reconnect.';
}
