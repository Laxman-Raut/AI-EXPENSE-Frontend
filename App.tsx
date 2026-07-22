import { useEffect } from 'react';
import { createTables } from './src/database/schema';

useEffect(() => {
  createTables();
}, []);