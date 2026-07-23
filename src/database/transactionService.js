import db from './database';

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

/**
 * Adds a transaction to SQLite database
 */
export const addTransaction = (data) => {
  try {
    const now = new Date().toISOString();
    const query = `
      INSERT INTO transactions (
        cloudId, userId, type, category, description, amount, paymentMethod, transactionDate, note, isSynced, deleted, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?);
    `;
    const params = [
      data.cloudId || null,
      data.userId || null,
      data.type,
      data.category,
      data.description || '',
      parseFloat(data.amount) || 0,
      data.paymentMethod || 'UPI',
      data.transactionDate || now,
      data.note || '',
      data.isSynced ? 1 : 0,
      now,
      now,
    ];
    const result = db.execute(query, params);
    return {
      id: result.insertId,
      ...data,
      isSynced: data.isSynced ? 1 : 0,
    };
  } catch (error) {
    console.error('Error adding transaction to SQLite:', error);
    throw error;
  }
};

/**
 * Gets all active (non-deleted) transactions from SQLite
 */
export const getAllTransactions = () => {
  try {
    const query = `SELECT * FROM transactions WHERE deleted = 0 ORDER BY transactionDate DESC, id DESC;`;
    const result = db.execute(query);
    return extractRows(result);
  } catch (error) {
    console.error('Error fetching transactions from SQLite:', error);
    return [];
  }
};

/**
 * Gets a single transaction by SQLite ID
 */
export const getTransactionById = (id) => {
  try {
    const query = `SELECT * FROM transactions WHERE id = ? AND deleted = 0;`;
    const result = db.execute(query, [id]);
    const rows = extractRows(result);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching transaction by ID from SQLite:', error);
    return null;
  }
};

/**
 * Gets all unsynced transactions (isSynced = 0)
 */
export const getUnsyncedTransactions = () => {
  try {
    const query = `SELECT * FROM transactions WHERE isSynced = 0 AND deleted = 0;`;
    const result = db.execute(query);
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
    const query = `
      UPDATE transactions SET
        type = ?,
        category = ?,
        description = ?,
        amount = ?,
        paymentMethod = ?,
        transactionDate = ?,
        note = ?,
        isSynced = ?,
        updatedAt = ?
      WHERE id = ?;
    `;
    const params = [
      data.type,
      data.category,
      data.description || '',
      parseFloat(data.amount) || 0,
      data.paymentMethod || 'UPI',
      data.transactionDate || now,
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
 * Bulk inserts/replaces cloud transactions into local SQLite cache
 */
export const bulkInsertFromCloud = (cloudItems = []) => {
  try {
    const now = new Date().toISOString();
    for (const item of cloudItems) {
      const query = `
        INSERT OR REPLACE INTO transactions (
          cloudId, type, category, description, amount, paymentMethod, transactionDate, note, isSynced, deleted, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?);
      `;
      const params = [
        item._id || item.cloudId,
        item.type,
        item.category,
        item.description || '',
        parseFloat(item.amount) || 0,
        item.paymentMethod || 'UPI',
        item.transactionDate || now,
        item.note || '',
        item.createdAt || now,
        item.updatedAt || now,
      ];
      db.execute(query, params);
    }
  } catch (error) {
    console.error('Error bulk inserting cloud transactions to SQLite:', error);
  }
};
