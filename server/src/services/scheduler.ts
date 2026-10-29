import cron from 'node-cron';
import { db } from '../db/index.js';
import { formatDailyClosingReportSMS, sendSMS } from './africastalking.js';

export function initScheduler(): void {
  // Check every minute
  cron.schedule('* * * * *', async () => {
    try {
      const settings = db.getSettings();
      if (!settings.daily || !settings.owner) return;

      const now = new Date();
      const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayKey = new Date().toDateString();

      if (currentHM === settings.reportTime && settings.lastReport !== todayKey) {
        console.log(`[Scheduler] Triggering automated daily closing report to ${settings.owner}...`);
        const reportText = formatDailyClosingReportSMS(0);
        await sendSMS(settings.owner, reportText);

        db.updateSettings({ lastReport: todayKey });
        console.log(`[Scheduler] Daily closing report dispatched successfully.`);
      }
    } catch (err) {
      console.error('[Scheduler] Error running daily closing check:', err);
    }
  });

  console.log('[Scheduler] Daily closing report scheduler initialized.');
}
