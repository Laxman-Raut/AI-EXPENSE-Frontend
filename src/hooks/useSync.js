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
  // isSyncing ko ref se track karo — useCallback dependency se hataya
  // Warna performSync recreate hogi → listener baar baar re-register hoga
  const isSyncingRef = useRef(false);
  const queryClient = useQueryClient();

  const performSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
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
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  // isSyncing dependency hataya — ref use kar rahe hain ab
  }, [queryClient]);

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

