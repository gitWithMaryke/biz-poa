import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.post('/push', (req: Request, res: Response) => {
  const { sales = [], outbox = [] } = req.body;

  let salesResult = { syncedCount: 0, existingCount: 0 };
  if (Array.isArray(sales) && sales.length > 0) {
    salesResult = db.batchSync(sales);
  }

  // Also process offline queued outbox SMS messages
  let smsCount = 0;
  if (Array.isArray(outbox) && outbox.length > 0) {
    for (const msg of outbox) {
      if (msg.to && msg.text) {
        db.addOutbox(msg.to, msg.text, 'sent');
        smsCount++;
      }
    }
  }

  res.json({
    success: true,
    serverTimestamp: Date.now(),
    salesSynced: salesResult.syncedCount,
    salesExisting: salesResult.existingCount,
    smsSynced: smsCount
  });
});

router.get('/pull', (req: Request, res: Response) => {
  res.json({
    success: true,
    serverTimestamp: Date.now(),
    products: db.getProducts(),
    archivedProducts: db.getArchivedProducts(),
    settings: db.getSettings()
  });
});

export default router;
