import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { sendSMS, normalizePhone } from '../services/africastalking.js';

const router = Router();

router.get('/outbox', (req: Request, res: Response) => {
  const outbox = db.getOutbox();
  res.json({ success: true, count: outbox.length, data: outbox });
});

router.post('/send', async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ success: false, message: 'Recipient phone (to) and message text required' });
    }

    const norm = normalizePhone(to);
    if (!norm) {
      return res.status(400).json({ success: false, message: 'Invalid phone format. Please use 07XXXXXXXX or +254XXXXXXXXX' });
    }

    const msg = await sendSMS(norm, message);
    res.status(201).json({ success: true, data: msg });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
