import db from "./database";

/**
 * Normalizes rows returned by react-native-quick-sqlite
 */
const extractRows = (result) => {
  if (!result || !result.rows) return [];
  if (Array.isArray(result.rows)) return result.rows;
  if (Array.isArray(result.rows._array)) return result.rows._array;
  const list = [];
  if (typeof result.rows.length === 'number') {
    if (typeof result.rows.item === 'function') {
      for (let i = 0; i < result.rows.length; i++) {
        list.push(result.rows.item(i));
      }
    } else {
      for (let i = 0; i < result.rows.length; i++) {
        list.push(result.rows[i]);
      }
    }
  }
  return list;
};

export const getTableColumns = (tableName) => {
  try {
    const result = db.execute(`PRAGMA table_info(${tableName});`);
    const rows = extractRows(result);
    return rows.map((row) => row?.name).filter(Boolean);
  } catch (error) {
    console.warn(`[SQLite Migration] Failed to inspect ${tableName} columns:`, error?.message);
    return [];
  }
};

export const ensureTableColumns = (tableName, columns) => {
  try {
    const existing = new Set(getTableColumns(tableName));
    for (const [columnName, definition] of columns) {
      if (!existing.has(columnName)) {
        try {
          db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${definition};`);
          console.log(`[SQLite Migration] Added missing column "${columnName}" to "${tableName}".`);
        } catch (colErr) {
          if (!colErr?.message?.includes('duplicate column name')) {
            console.warn(`[SQLite Migration] Could not add column "${columnName}" to "${tableName}":`, colErr?.message);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`[SQLite Migration] Failed to migrate ${tableName}:`, error?.message);
  }
};

export const ensureColumn = (tableName, columnName, definition) => {
  ensureTableColumns(tableName, [[columnName, definition]]);
};

export const runMigration = () => {
  try {
    console.log("🚀 Checking & Running SQLite Database Migrations...");

    // ─── TRANSACTIONS COLUMNS ──────────────────────────────────────────────
    ensureTableColumns('transactions', [
      ['currency', "currency TEXT DEFAULT 'INR'"],
      ['originalAmount', 'originalAmount REAL'],
      ['originalCurrency', "originalCurrency TEXT DEFAULT 'INR'"],
      ['amountINR', 'amountINR REAL'],
      ['amountUSD', 'amountUSD REAL'],
      ['exchangeRate', 'exchangeRate REAL'],
      ['exchangeRateTimestamp', 'exchangeRateTimestamp TEXT'],
      ['paymentMethod', 'paymentMethod TEXT'],
      ['transactionDate', 'transactionDate TEXT'],
      ['bankAccount', 'bankAccount TEXT'],
      ['note', 'note TEXT'],
      ['isSynced', 'isSynced INTEGER DEFAULT 0'],
      ['deleted', 'deleted INTEGER DEFAULT 0'],
      ['createdAt', 'createdAt TEXT'],
      ['updatedAt', 'updatedAt TEXT'],
    ]);

    // ─── USERS COLUMNS ─────────────────────────────────────────────────────
    ensureTableColumns('users', [
      ['currency', "currency TEXT DEFAULT 'INR'"],
      ['monthlyBudget', 'monthlyBudget REAL DEFAULT 0'],
      ['lastVisitedAt', 'lastVisitedAt TEXT'],
      ['subscriptionPlan', "subscriptionPlan TEXT DEFAULT 'free'"],
      ['subscriptionStatus', "subscriptionStatus TEXT DEFAULT 'inactive'"],
      ['subscriptionProvider', "subscriptionProvider TEXT DEFAULT 'none'"],
      ['subscriptionStartDate', 'subscriptionStartDate TEXT'],
      ['subscriptionEndDate', 'subscriptionEndDate TEXT'],
      ['autoRenew', 'autoRenew INTEGER DEFAULT 0'],
      ['chatbotUsed', 'chatbotUsed INTEGER DEFAULT 0'],
      ['chatbotLimit', 'chatbotLimit INTEGER DEFAULT 0'],
      ['receiptUsed', 'receiptUsed INTEGER DEFAULT 0'],
      ['receiptLimit', 'receiptLimit INTEGER DEFAULT 0'],
      ['voiceUsed', 'voiceUsed INTEGER DEFAULT 0'],
      ['voiceLimit', 'voiceLimit INTEGER DEFAULT 0'],
      ['resetOtp', 'resetOtp TEXT'],
      ['resetOtpExpiry', 'resetOtpExpiry TEXT'],
    ]);

    console.log("✅ SQLite Migrations Completed Successfully");
  } catch (error) {
    console.error("❌ SQLite Migration Error:", error);
  }
};
