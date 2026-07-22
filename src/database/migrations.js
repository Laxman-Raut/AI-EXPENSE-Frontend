import db from "./database";
import { createTables } from "./schema";

const DB_VERSION = 1;

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