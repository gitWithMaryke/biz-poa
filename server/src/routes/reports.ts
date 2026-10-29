import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { formatDailyClosingReportSMS, sendSMS } from '../services/africastalking.js';

const router = Router();

router.get('/daily', (req: Request, res: Response) => {
  const offset = parseInt(String(req.query.offset || '0'), 10);
  const stats = db.getStatsForDayOffset(offset);
  const prevStats = db.getStatsForDayOffset(offset + 1);

  let deltaPct: number | null = null;
  if (prevStats.income > 0) {
    deltaPct = Math.round(((stats.income - prevStats.income) / prevStats.income) * 100);
  }

  res.json({
    success: true,
    data: {
      ...stats,
      comparison: {
        previousIncome: prevStats.income,
        deltaPct
      }
    }
  });
});

router.get('/week', (req: Request, res: Response) => {
  const days = [6, 5, 4, 3, 2, 1, 0].map(offset => {
    const st = db.getStatsForDayOffset(offset);
    return {
      offset,
      timestamp: st.dayStart,
      dateLabel: offset === 0 ? 'Today' : offset === 1 ? 'Yesterday' : new Date(st.dayStart).toLocaleDateString('en-KE', { weekday: 'short' }),
      income: st.income,
      receiptCount: st.receiptCount
    };
  });

  const maxIncome = Math.max(...days.map(d => d.income), 1);

  res.json({
    success: true,
    data: {
      days,
      maxIncome
    }
  });
});

router.post('/sms', async (req: Request, res: Response) => {
  try {
    const { offset = 0, phone } = req.body;
    const settings = db.getSettings();
    const recipient = phone || settings.owner;

    if (!recipient) {
      return res.status(400).json({ success: false, message: 'Owner phone number not configured' });
    }

    const reportText = formatDailyClosingReportSMS(Number(offset));
    const msg = await sendSMS(recipient, reportText);

    res.json({ success: true, message: `Report dispatched to ${recipient}`, data: msg });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
