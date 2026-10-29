import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const settings = db.getSettings();
  // Mask API key for security in responses
  const safe = {
    ...settings,
    keyMasked: settings.key ? `••••••••${settings.key.slice(-4)}` : ''
  };
  res.json({ success: true, data: safe });
});

router.put('/', (req: Request, res: Response) => {
  const { shop, till, user, key, sender, sandbox, owner, daily, reportTime } = req.body;

  const updated = db.updateSettings({
    ...(shop && { shop: shop.trim() }),
    ...(till !== undefined && { till: String(till).trim() }),
    ...(user !== undefined && { user: String(user).trim() }),
    ...(key !== undefined && key !== '' && { key: String(key).trim() }),
    ...(sender !== undefined && { sender: String(sender).trim() }),
    ...(sandbox !== undefined && { sandbox: Boolean(sandbox) }),
    ...(owner !== undefined && { owner: String(owner).trim() }),
    ...(daily !== undefined && { daily: Boolean(daily) }),
    ...(reportTime && { reportTime: String(reportTime).trim() })
  });

  res.json({ success: true, data: updated });
});

export default router;
