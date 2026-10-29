import { localDB } from '../db/db.js';
import { api } from './api.js';

export async function getPendingSyncCount(): Promise<number> {
  const unsyncedSales = await localDB.sales.filter(s => !s.synced).count();
  const queuedOutbox = await localDB.outbox.filter(m => m.status === 'queued').count();
  return unsyncedSales + queuedOutbox;
}

export async function performSync(isOnline: boolean): Promise<{ success: boolean; syncedSales: number; syncedMessages: number; error?: string }> {
  if (!isOnline) {
    return { success: false, syncedSales: 0, syncedMessages: 0, error: 'Cannot sync while offline' };
  }

  try {
    const unsyncedSales = await localDB.sales.filter(s => !s.synced).toArray();
    const queuedOutbox = await localDB.outbox.filter(m => m.status === 'queued').toArray();

    if (unsyncedSales.length === 0 && queuedOutbox.length === 0) {
      return { success: true, syncedSales: 0, syncedMessages: 0 };
    }

    // Set outbox to sending
    for (const msg of queuedOutbox) {
      await localDB.outbox.update(msg.id, { status: 'sending' });
    }

    const pushResult = await api.syncPush({
      sales: unsyncedSales,
      outbox: queuedOutbox
    });

    // Mark sales as synced locally
    for (const s of unsyncedSales) {
      await localDB.sales.update(s.id, { synced: true });
    }

    // Mark outbox as sent locally
    for (const m of queuedOutbox) {
      await localDB.outbox.update(m.id, { status: 'sent' });
    }

    // Pull any new changes from server
    try {
      const pullResult = await api.syncPull();
      if (pullResult?.products) {
        // Sync products with server
        for (const prod of pullResult.products) {
          await localDB.products.put(prod);
        }
      }
    } catch (pullErr) {
      console.warn('Pull sync warning:', pullErr);
    }

    return {
      success: true,
      syncedSales: unsyncedSales.length,
      syncedMessages: queuedOutbox.length
    };
  } catch (err: any) {
    console.error('Sync failure:', err);
    return {
      success: false,
      syncedSales: 0,
      syncedMessages: 0,
      error: err.message
    };
  }
}
