import * as dbService from '../database/transactionService';

class TransactionRepository {
  async add(data) {
    return dbService.addTransaction(data);
  }

  async getAll() {
    return dbService.getAllTransactions();
  }

  async getById(id) {
    return dbService.getTransactionById(id);
  }

  async getUnsynced() {
    return dbService.getUnsyncedTransactions();
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

  async cacheCloudTransactions(cloudItems) {
    return dbService.bulkInsertFromCloud(cloudItems);
  }
}

export default new TransactionRepository();
