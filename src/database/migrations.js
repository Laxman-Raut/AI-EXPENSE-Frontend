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

export const ensureColumn = (tableName, columnName, definition) => {
  try {
    const columns = getTableColumns(tableName);
    if (columns.includes(columnName)) return;

    db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${definition};`);
    console.log(`[SQLite Migration] Added missing column "${columnName}" to "${tableName}".`);
  } catch (error) {
    if (error?.message && error.message.includes('duplicate column name')) {
      // Column already exists, safe to ignore
      return;
    }
    console.warn(`[SQLite Migration] Could not add column "${columnName}" to "${tableName}":`, error?.message);
  }
};

export const runMigration = () => {
  try {
    console.log("🚀 Checking & Running SQLite Database Migrations...");

    // ─── TRANSACTIONS COLUMNS ──────────────────────────────────────────────
    ensureColumn('transactions', 'currency', "currency TEXT DEFAULT 'INR'");
    ensureColumn('transactions', 'originalAmount', 'originalAmount REAL');
    ensureColumn('transactions', 'originalCurrency', "originalCurrency TEXT DEFAULT 'INR'");
    ensureColumn('transactions', 'amountINR', 'amountINR REAL');
    ensureColumn('transactions', 'amountUSD', 'amountUSD REAL');
    ensureColumn('transactions', 'exchangeRate', 'exchangeRate REAL');
    ensureColumn('transactions', 'exchangeRateTimestamp', 'exchangeRateTimestamp TEXT');
    ensureColumn('transactions', 'paymentMethod', 'paymentMethod TEXT');
    ensureColumn('transactions', 'transactionDate', 'transactionDate TEXT');
    ensureColumn('transactions', 'bankAccount', 'bankAccount TEXT');
    ensureColumn('transactions', 'note', 'note TEXT');
    ensureColumn('transactions', 'isSynced', 'isSynced INTEGER DEFAULT 0');
    ensureColumn('transactions', 'deleted', 'deleted INTEGER DEFAULT 0');
    ensureColumn('transactions', 'createdAt', 'createdAt TEXT');
    ensureColumn('transactions', 'updatedAt', 'updatedAt TEXT');

    // ─── USERS COLUMNS ─────────────────────────────────────────────────────
    ensureColumn('users', 'currency', "currency TEXT DEFAULT 'INR'");
    ensureColumn('users', 'monthlyBudget', 'monthlyBudget REAL DEFAULT 0');
    ensureColumn('users', 'lastVisitedAt', 'lastVisitedAt TEXT');
    ensureColumn('users', 'subscriptionPlan', "subscriptionPlan TEXT DEFAULT 'free'");
    ensureColumn('users', 'subscriptionStatus', "subscriptionStatus TEXT DEFAULT 'inactive'");
    ensureColumn('users', 'subscriptionProvider', "subscriptionProvider TEXT DEFAULT 'none'");
    ensureColumn('users', 'subscriptionStartDate', 'subscriptionStartDate TEXT');
    ensureColumn('users', 'subscriptionEndDate', 'subscriptionEndDate TEXT');
    ensureColumn('users', 'autoRenew', 'autoRenew INTEGER DEFAULT 0');
    ensureColumn('users', 'chatbotUsed', 'chatbotUsed INTEGER DEFAULT 0');
    ensureColumn('users', 'chatbotLimit', 'chatbotLimit INTEGER DEFAULT 0');
    ensureColumn('users', 'receiptUsed', 'receiptUsed INTEGER DEFAULT 0');
    ensureColumn('users', 'receiptLimit', 'receiptLimit INTEGER DEFAULT 0');
    ensureColumn('users', 'voiceUsed', 'voiceUsed INTEGER DEFAULT 0');
    ensureColumn('users', 'voiceLimit', 'voiceLimit INTEGER DEFAULT 0');
    ensureColumn('users', 'resetOtp', 'resetOtp TEXT');
    ensureColumn('users', 'resetOtpExpiry', 'resetOtpExpiry TEXT');

    console.log("✅ SQLite Migrations Completed Successfully");
  } catch (error) {
    console.error("❌ SQLite Migration Error:", error);
  }
};
