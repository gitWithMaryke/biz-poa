import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { sendSMS, formatSaleReceiptSMS } from '../services/africastalking.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const limit = parseInt(String(req.query.limit || '100'), 10);
  const sales = db.getSales(limit);
  res.json({ success: true, count: sales.length, data: sales });
});

router.get('/:id', (req: Request, res: Response) => {
  const sale = db.getSaleById(req.params.id);
  if (!sale) {
    return res.status(404).json({ success: false, message: 'Sale receipt not found' });
  }
  res.json({ success: true, data: sale });
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { lines, total, method, tendered, change, phone, sendReceiptSMS, notes, id, timestamp } = req.body;

    if (!Array.isArray(lines) || !lines.length) {
      return res.status(400).json({ success: false, message: 'Sale lines array cannot be empty' });
    }

    if (typeof total !== 'number' || total <= 0) {
      return res.status(400).json({ success: false, message: 'Valid total amount required' });
    }

    let smsId: string | null = null;
    const settings = db.getSettings();

    const sale = db.recordSale({
      id,
      timestamp,
      lines,
      total,
      method: method || 'cash',
      tendered: tendered || (method === 'cash' ? total : 0),
      change: change || 0,
      phone: phone || '',
      smsId: null,
      notes,
      synced: true
    });

    if (sendReceiptSMS && phone) {
      try {
        const smsText = formatSaleReceiptSMS(settings.shop, sale);
        const msg = await sendSMS(phone, smsText);
        sale.smsId = msg.id;
      } catch (smsErr) {
        console.error('Failed to dispatch receipt SMS:', smsErr);
      }
    }

    res.status(201).json({ success: true, data: sale });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
