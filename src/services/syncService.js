import transactionRepository from '../repositories/transactionRepository';
import { syncBulkTransactions } from '../api/transactions';
import { checkIsConnected } from '../utils/netInfoHelper';

class SyncService {
  /**
   * Syncs all unsynced local SQLite transactions to MongoDB Cloud
   */
  async syncOfflineDataToCloud() {
    try {
      const isConnected = await checkIsConnected();
      if (!isConnected) {
        console.log('Sync skipped: Device is offline');
        return { success: false, reason: 'offline' };
      }

      const unsyncedTransactions = await transactionRepository.getUnsynced();
      if (!unsyncedTransactions || unsyncedTransactions.length === 0) {
        console.log('No unsynced offline transactions found');
        return { success: true, syncedCount: 0 };
      }

      console.log(`Syncing ${unsyncedTransactions.length} offline transactions to MongoDB...`);
      
      const payload = unsyncedTransactions.map((item) => ({
        localId: item.id,
        cloudId: item.cloudId,
        type: item.type,
        category: item.category,
        description: item.description,
        amount: item.amount,
        paymentMethod: item.paymentMethod,
        transactionDate: item.transactionDate,
        note: item.note,
      }));

      const response = await syncBulkTransactions(payload);

      if (response && response.success && Array.isArray(response.data)) {
        for (const mapping of response.data) {
          if (mapping.localId && mapping.cloudId) {
            await transactionRepository.markSynced(mapping.localId, mapping.cloudId);
          }
        }
        console.log('✅ Offline data successfully synced to cloud!');
        return { success: true, syncedCount: response.data.length };
      }

      throw new Error(response?.message || 'Failed to sync offline data to cloud');
    } catch (error) {
      console.error('❌ SyncService Error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new SyncService();
