jest.mock('../src/api/transactions', () => ({
  fetchTransactions: jest.fn(),
  fetchTransaction: jest.fn(),
  createTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
  syncBulkTransactions: jest.fn(),
}));

jest.mock('../src/repositories/transactionRepository', () => ({
  __esModule: true,
  default: {
    add: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getUnsynced: jest.fn(),
    markSynced: jest.fn(),
    cacheCloudTransactions: jest.fn(),
  },
}));

jest.mock('../src/utils/netInfoHelper', () => ({
  checkIsConnected: jest.fn(),
}));

jest.mock('../src/services/subscriptionService', () => ({
  __esModule: true,
  default: {
    isSubscriptionPro: jest.fn(),
  },
}));

jest.mock('../src/services/notificationService', () => ({
  __esModule: true,
  default: {
    checkBudgetAlert: jest.fn(),
  },
}));

jest.mock('../src/store', () => ({
  __esModule: true,
  default: {
    getState: () => ({
      auth: { user: { _id: 'user-1' } },
      subscription: { plan: 'free', status: 'inactive' },
    }),
  },
}));

const api = require('../src/api/transactions');
const transactionRepository = require('../src/repositories/transactionRepository').default;
const { checkIsConnected } = require('../src/utils/netInfoHelper');
const subscriptionService = require('../src/services/subscriptionService').default;
const transactionService = require('../src/services/transactionService');
const syncService = require('../src/services/syncService').default;

describe('transaction storage plan policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    syncService.activeSync = null;
    checkIsConnected.mockResolvedValue(true);
    transactionRepository.add.mockResolvedValue({ id: 1 });
    transactionRepository.getAll.mockReturnValue([{ id: 1 }]);
    transactionRepository.getUnsynced.mockResolvedValue([
      { id: 1, type: 'expense', amount: 10, currency: 'INR' },
    ]);
    transactionRepository.markSynced.mockResolvedValue();
    subscriptionService.isSubscriptionPro.mockImplementation(
      (subscription) => subscription?.plan !== 'free' && subscription?.status === 'active'
    );
  });

  it('keeps free-plan transactions in SQLite when online', async () => {
    const payload = { type: 'expense', amount: 10 };

    await transactionService.createTransaction(payload);

    expect(api.createTransaction).not.toHaveBeenCalled();
    expect(transactionRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ ...payload, userId: 'user-1', isSynced: 0 })
    );
  });

  it('reads free-plan transactions from SQLite instead of the cloud', async () => {
    const localTransactions = [{ id: 1 }];
    transactionRepository.getAll.mockReturnValue(localTransactions);

    await expect(transactionService.fetchTransactions()).resolves.toBe(localTransactions);

    expect(api.fetchTransactions).not.toHaveBeenCalled();
    expect(transactionRepository.getAll).toHaveBeenCalledWith('user-1');
  });

  it('keeps free-plan edits and deletes local', async () => {
    await transactionService.updateTransaction(1, { type: 'expense', amount: 12 });
    await transactionService.deleteTransaction(1);

    expect(api.updateTransaction).not.toHaveBeenCalled();
    expect(api.deleteTransaction).not.toHaveBeenCalled();
    expect(transactionRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, isSynced: 0 })
    );
    expect(transactionRepository.delete).toHaveBeenCalledWith(1);
  });

  it('stores paid-plan transactions in cloud and SQLite when online', async () => {
    subscriptionService.isSubscriptionPro.mockReturnValue(true);
    api.createTransaction.mockResolvedValue({
      success: true,
      data: { _id: 'cloud-1', type: 'expense', amount: 10 },
    });

    await transactionService.createTransaction({ type: 'expense', amount: 10 });

    expect(api.createTransaction).toHaveBeenCalledTimes(1);
    expect(transactionRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ cloudId: 'cloud-1', isSynced: 1 })
    );
  });

  it('does not upload local transactions for a free-plan user', async () => {
    const result = await syncService.syncOfflineDataToCloud();

    expect(result).toEqual({ success: false, reason: 'free-plan', syncedCount: 0 });
    expect(api.syncBulkTransactions).not.toHaveBeenCalled();
  });

  it('uploads queued local transactions after a paid subscription is activated', async () => {
    api.syncBulkTransactions.mockResolvedValue({
      success: true,
      data: [{ localId: 1, cloudId: 'cloud-1' }],
    });

    const result = await syncService.syncOfflineDataToCloud({
      subscription: { plan: 'pro', status: 'active' },
    });

    expect(result).toEqual({ success: true, syncedCount: 1 });
    expect(api.syncBulkTransactions).toHaveBeenCalledTimes(1);
    expect(transactionRepository.markSynced).toHaveBeenCalledWith(1, 'cloud-1');
  });
});
