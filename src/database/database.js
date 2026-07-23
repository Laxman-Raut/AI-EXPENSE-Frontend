import { open } from 'react-native-quick-sqlite';

let db;
try {
  db = open({
    name: 'AIExpenseTracker.db',
    location: 'default',
  });
} catch (err) {
  console.warn('Failed to open QuickSQLite database:', err);
  db = {
    execute: () => ({ insertId: 0, rows: [] }),
  };
}

export default db;