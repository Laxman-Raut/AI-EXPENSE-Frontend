import { useState, useEffect, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import syncService from '../services/syncService';

/**
 * Auto-sync hook that monitors network connectivity and syncs
 * unsynced local SQLite transactions to the cloud when the device
 * transitions from offline to online.
 */
export const useAutoSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const wasConnectedRef = useRef(true);
  const queryClient = useQueryClient();

  const performSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncService.syncOfflineDataToCloud();
      setLastSyncResult(result);
      if (result.success && result.syncedCount > 0) {
        // Invalidate React Query caches so UI reflects synced data
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
        queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
        queryClient.invalidateQueries({ queryKey: ['monthlyAnalytics'] });
        console.log(`✅ Auto-sync complete: ${result.syncedCount} transactions synced`);
      }
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
      setLastSyncResult({ success: false, error: error.message });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, queryClient]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = !!state.isConnected;
      const wasConnected = wasConnectedRef.current;

      // Detect offline → online transition
      if (!wasConnected && isConnected) {
        console.log('📶 Network restored — triggering auto-sync...');
        performSync();
      }

      wasConnectedRef.current = isConnected;
    });

    return () => unsubscribe();
  }, [performSync]);

  return { isSyncing, lastSyncResult, manualSync: performSync };
};

export default useAutoSync;
