import { open } from 'react-native-quick-sqlite';

const db = open({
  name: 'AIExpenseTracker.db',
  location: 'default',
});

export default db;