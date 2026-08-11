import db from "./database";
import { createTables } from "./schema";

const DB_VERSION = 2;

const getTableColumns = (tableName) => {
  try {
    const result = db.execute(`PRAGMA table_info(${tableName});`);
    if (!result?.rows) return [];

    if (Array.isArray(result.rows._array)) {
      return result.rows._array.map((row) => row.name);
    }

    const columns = [];
    if (typeof result.rows.length === 'number' && typeof result.rows.item === 'function') {
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        if (row?.name) columns.push(row.name);
      }
    }
    return columns;
  } catch (error) {
    console.warn(`Failed to inspect ${tableName} columns:`, error?.message);
    return [];
  }
};

const ensureColumn = (tableName, columnName, definition) => {
  const columns = getTableColumns(tableName);
  if (columns.includes(columnName)) return;
  db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${definition};`);
};

export const runMigration = () => {
  try {
    // Meta table
    db.execute(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Check current version
    const result = db.execute(
      "SELECT value FROM app_meta WHERE key = ?;",
      ["db_version"]
    );

    let currentVersion = 0;

    if (result.rows && result.rows.length > 0) {
      currentVersion = parseInt(result.rows.item(0).value, 10);
    }

    if (currentVersion < DB_VERSION) {
      console.log("🚀 Running Database Migration...");

      createTables();

      ensureColumn('transactions', 'currency', "currency TEXT DEFAULT 'INR'");
      ensureColumn('transactions', 'originalAmount', 'originalAmount REAL');
      ensureColumn('transactions', 'originalCurrency', "originalCurrency TEXT DEFAULT 'INR'");
      ensureColumn('transactions', 'amountINR', 'amountINR REAL');
      ensureColumn('transactions', 'amountUSD', 'amountUSD REAL');
      ensureColumn('transactions', 'exchangeRate', 'exchangeRate REAL');
      ensureColumn('transactions', 'exchangeRateTimestamp', 'exchangeRateTimestamp TEXT');
      ensureColumn('transactions', 'bankAccount', 'bankAccount TEXT');

      db.execute(
        `INSERT OR REPLACE INTO app_meta (key, value)
         VALUES (?, ?);`,
        ["db_version", DB_VERSION.toString()]
      );

      console.log("✅ Database Migration Completed");
    } else {
      console.log("✅ Database Already Updated");
    }
  } catch (error) {
    console.log("❌ Migration Error:", error);
  }
};
