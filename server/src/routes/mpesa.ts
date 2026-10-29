import { Router, Request, Response } from 'express';
import { initiateSTKPush } from '../services/mpesaDaraja.js';

const router = Router();

router.post('/stkpush', async (req: Request, res: Response) => {
  try {
    const { phone, amount, accountReference, transactionDesc } = req.body;
    if (!phone || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid phone and amount required' });
    }

    const result = await initiateSTKPush({
      phone,
      amount,
      accountReference: accountReference || 'Bizpoa POS',
      transactionDesc
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/callback', (req: Request, res: Response) => {
  console.log('[M-Pesa Callback Received]:', JSON.stringify(req.body));
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

export default router;
