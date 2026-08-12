import * as dbService from '../database/transactionService';

class TransactionRepository {
  async add(data) {
    return dbService.addTransaction(data);
  }

  async getAll(userId = null) {
    return dbService.getAllTransactions(userId);
  }

  async getById(id, userId = null) {
    return dbService.getTransactionById(id, userId);
  }

  async getUnsynced(userId = null) {
    return dbService.getUnsyncedTransactions(userId);
  }

  async update(data) {
    return dbService.updateTransaction(data);
  }

  async delete(id) {
    return dbService.deleteTransaction(id);
  }

  async markSynced(localId, cloudId) {
    return dbService.markAsSynced(localId, cloudId);
  }

  async cacheCloudTransactions(cloudItems, userId = null) {
    return dbService.bulkInsertFromCloud(cloudItems, userId);
  }

  async clearAll() {
    return dbService.clearAllTransactions();
  }
}

export default new TransactionRepository();
