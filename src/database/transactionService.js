import db from './database';
import { convertCurrencyValue, getExchangeRate, normalizeCurrencyCode } from '../utils/formatCurrency';

/**
 * Normalizes rows returned by react-native-quick-sqlite
 */
const extractRows = (result) => {
  if (!result || !result.rows) return [];
  if (Array.isArray(result.rows._array)) return result.rows._array;
  if (Array.isArray(result.rows)) return result.rows;
  const list = [];
  if (typeof result.rows.length === 'number' && typeof result.rows.item === 'function') {
    for (let i = 0; i < result.rows.length; i++) {
      list.push(result.rows.item(i));
    }
  }
  return list;
};

const buildSnapshot = (data = {}) => {
  const currency = normalizeCurrencyCode(data.currency || data.originalCurrency || 'INR');
  const originalAmount = Number(data.originalAmount ?? data.amount ?? 0) || 0;
  const originalCurrency = normalizeCurrencyCode(data.originalCurrency || currency);
  const exchangeRate = Number(data.exchangeRate || getExchangeRate() || 0) || null;
  const exchangeRateTimestamp = data.exchangeRateTimestamp || data.rateTimestamp || new Date().toISOString();
  const amountINR = Number(
    data.amountINR ??
      (originalCurrency === 'INR'
        ? originalAmount
        : convertCurrencyValue(originalAmount, originalCurrency, 'INR'))
  ) || 0;
  const amountUSD = Number(
    data.amountUSD ??
      (originalCurrency === 'USD'
        ? originalAmount
        : convertCurrencyValue(originalAmount, originalCurrency, 'USD'))
  ) || 0;

  return {
    currency,
    originalAmount,
    originalCurrency,
    amountINR,
    amountUSD,
    exchangeRate,
    exchangeRateTimestamp,
  };
};

/**
 * Adds a transaction to SQLite database
 */
export const addTransaction = (data) => {
  try {
    const now = new Date().toISOString();
    const snapshot = buildSnapshot(data);
    const query = `
      INSERT INTO transactions (
        cloudId, userId, type, category, description, amount, currency, originalAmount, originalCurrency, amountINR, amountUSD, exchangeRate, exchangeRateTimestamp, paymentMethod, transactionDate, bankAccount, note, isSynced, deleted, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?);
    `;
    const params = [
      data.cloudId || null,
      data.userId || null,
      data.type,
      data.category,
      data.description || '',
      snapshot.originalAmount,
      snapshot.currency,
      snapshot.originalAmount,
      snapshot.originalCurrency,
      snapshot.amountINR,
      snapshot.amountUSD,
      snapshot.exchangeRate,
      snapshot.exchangeRateTimestamp,
      data.paymentMethod || 'UPI',
      data.transactionDate || now,
      data.bankAccount || null,
      data.note || '',
      data.isSynced ? 1 : 0,
      now,
      now,
    ];
    const result = db.execute(query, params);
    return {
      id: result.insertId,
      ...data,
      ...snapshot,
      isSynced: data.isSynced ? 1 : 0,
    };
  } catch (error) {
    console.error('Error adding transaction to SQLite:', error);
    throw error;
  }
};

/**
 * Gets all active (non-deleted) transactions for a specific user from SQLite
 */
export const getAllTransactions = (userId = null) => {
  try {
    if (!userId) {
      console.log('[SQLite] getAllTransactions: No userId provided, returning empty list for security.');
      return [];
    }
    const userStr = String(userId);
    const query = `
      SELECT * FROM transactions
      WHERE deleted = 0 AND (userId = ? OR CAST(userId AS TEXT) = ?)
      ORDER BY transactionDate DESC, id DESC;
    `;
    const result = db.execute(query, [userId, userStr]);
    const rows = extractRows(result);
    return rows.map((row) => {
      const origCurr = normalizeCurrencyCode(row.originalCurrency || row.currency || 'INR');
      const origAmt = Number(row.originalAmount ?? row.amount ?? 0) || 0;
      const snapINR = row.amountINR !== null && row.amountINR !== undefined
        ? Number(row.amountINR)
        : (origCurr === 'INR' ? origAmt : convertCurrencyValue(origAmt, origCurr, 'INR'));
      const snapUSD = row.amountUSD !== null && row.amountUSD !== undefined
        ? Number(row.amountUSD)
        : (origCurr === 'USD' ? origAmt : convertCurrencyValue(origAmt, origCurr, 'USD'));

      return {
        ...row,
        amount: origAmt,
        originalAmount: origAmt,
        originalCurrency: origCurr,
        amountINR: snapINR,
        amountUSD: snapUSD,
      };
    });
  } catch (error) {
    console.error('Error fetching transactions from SQLite:', error);
    return [];
  }
};

/**
 * Gets a single transaction by SQLite ID for a specific user
 */
export const getTransactionById = (id, userId = null) => {
  try {
    if (!userId) {
      const query = `SELECT * FROM transactions WHERE id = ? AND deleted = 0;`;
      const result = db.execute(query, [id]);
      const rows = extractRows(result);
      return rows.length > 0 ? rows[0] : null;
    }
    const userStr = String(userId);
    const query = `SELECT * FROM transactions WHERE id = ? AND deleted = 0 AND (userId = ? OR CAST(userId AS TEXT) = ?);`;
    const result = db.execute(query, [id, userId, userStr]);
    const rows = extractRows(result);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching transaction by ID from SQLite:', error);
    return null;
  }
};

/**
 * Gets all unsynced transactions (isSynced = 0) for a specific user
 */
export const getUnsyncedTransactions = (userId = null) => {
  try {
    if (!userId) {
      const query = `SELECT * FROM transactions WHERE isSynced = 0 AND deleted = 0;`;
      const result = db.execute(query);
      return extractRows(result);
    }
    const userStr = String(userId);
    const query = `SELECT * FROM transactions WHERE isSynced = 0 AND deleted = 0 AND (userId = ? OR CAST(userId AS TEXT) = ?);`;
    const result = db.execute(query, [userId, userStr]);
    return extractRows(result);
  } catch (error) {
    console.error('Error fetching unsynced transactions from SQLite:', error);
    return [];
  }
};

/**
 * Updates a transaction in SQLite
 */
export const updateTransaction = (data) => {
  try {
    const now = new Date().toISOString();
    const snapshot = buildSnapshot(data);
    const query = `
      UPDATE transactions SET
        type = ?,
        category = ?,
        description = ?,
        amount = ?,
        currency = ?,
        originalAmount = ?,
        originalCurrency = ?,
        amountINR = ?,
        amountUSD = ?,
        exchangeRate = ?,
        exchangeRateTimestamp = ?,
        paymentMethod = ?,
        transactionDate = ?,
        bankAccount = ?,
        note = ?,
        isSynced = ?,
        updatedAt = ?
      WHERE id = ?;
    `;
    const params = [
      data.type,
      data.category,
      data.description || '',
      snapshot.originalAmount,
      snapshot.currency,
      snapshot.originalAmount,
      snapshot.originalCurrency,
      snapshot.amountINR,
      snapshot.amountUSD,
      snapshot.exchangeRate,
      snapshot.exchangeRateTimestamp,
      data.paymentMethod || 'UPI',
      data.transactionDate || now,
      data.bankAccount || null,
      data.note || '',
      data.isSynced ? 1 : 0,
      now,
      data.id,
    ];
    db.execute(query, params);
    return { ...data };
  } catch (error) {
    console.error('Error updating transaction in SQLite:', error);
    throw error;
  }
};

/**
 * Soft deletes a transaction in SQLite (or hard delete if not synced yet)
 */
export const deleteTransaction = (id) => {
  try {
    const transaction = getTransactionById(id);
    if (!transaction) return true;

    if (!transaction.cloudId) {
      // If never synced to cloud, hard delete
      db.execute(`DELETE FROM transactions WHERE id = ?;`, [id]);
    } else {
      // Soft delete so sync service can communicate deletion to cloud if needed
      db.execute(`UPDATE transactions SET deleted = 1, isSynced = 0, updatedAt = ? WHERE id = ?;`, [
        new Date().toISOString(),
        id,
      ]);
    }
    return true;
  } catch (error) {
    console.error('Error deleting transaction from SQLite:', error);
    throw error;
  }
};

/**
 * Marks a local transaction as synced with its corresponding Mongo cloudId
 */
export const markAsSynced = (localId, cloudId) => {
  try {
    const query = `UPDATE transactions SET cloudId = ?, isSynced = 1, updatedAt = ? WHERE id = ?;`;
    db.execute(query, [cloudId, new Date().toISOString(), localId]);
  } catch (error) {
    console.error('Error marking transaction as synced in SQLite:', error);
  }
};

/**
 * Bulk inserts/replaces cloud transactions into local SQLite cache.
 * BEGIN TRANSACTION / COMMIT use kiya hai — N separate writes ki jagah
 * ek single batch write hoti hai, jo 10x-50x faster hoti hai.
 */
export const bulkInsertFromCloud = (cloudItems = [], userId = null) => {
  if (!cloudItems || cloudItems.length === 0) return;
  try {
    const now = new Date().toISOString();
    // Batch transaction shuru karo — sab writes ek saath commit honge
    db.execute('BEGIN TRANSACTION;');
    try {
      for (const item of cloudItems) {
        const snapshot = buildSnapshot(item);
        const targetUserId = userId || item.userId || item.user || null;
        const query = `
          INSERT OR REPLACE INTO transactions (
            cloudId, userId, type, category, description, amount, currency, originalAmount, originalCurrency, amountINR, amountUSD, exchangeRate, exchangeRateTimestamp, paymentMethod, transactionDate, bankAccount, note, isSynced, deleted, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?);
        `;
        const params = [
          item._id || item.cloudId,
          targetUserId,
          item.type,
          item.category,
          item.description || '',
          snapshot.originalAmount,
          snapshot.currency,
          snapshot.originalAmount,
          snapshot.originalCurrency,
          snapshot.amountINR,
          snapshot.amountUSD,
          snapshot.exchangeRate,
          snapshot.exchangeRateTimestamp,
          item.paymentMethod || 'UPI',
          item.transactionDate || now,
          item.bankAccount || null,
          item.note || '',
          item.createdAt || now,
          item.updatedAt || now,
        ];
        db.execute(query, params);
      }
      // Sab writes ek saath commit
      db.execute('COMMIT;');
    } catch (innerError) {
      // Koi bhi error aaye toh rollback karo — data corrupt nahi hoga
      db.execute('ROLLBACK;');
      throw innerError;
    }
  } catch (error) {
    console.error('Error bulk inserting cloud transactions to SQLite:', error);
  }
};

/**
 * Clears all local data from SQLite on user logout/login (prevents cross-user data leaks)
 */
export const clearAllTransactions = () => {
  try {
    db.execute('DELETE FROM transactions;');
    db.execute('DELETE FROM users;');
    console.log('✅ SQLite Local Database Cleared (transactions + users)');
  } catch (error) {
    console.error('Error clearing SQLite database:', error);
  }
};
