let NetInfo;
try {
  NetInfo = require('@react-native-community/netinfo').default || require('@react-native-community/netinfo');
} catch (e) {
  NetInfo = null;
}

/**
 * Safely checks if the device has network connectivity.
 * If NetInfo is unlinked or unavailable, defaults to true.
 */
export const checkIsConnected = async () => {
  try {
    if (NetInfo && typeof NetInfo.fetch === 'function') {
      const state = await NetInfo.fetch();
      return !!state.isConnected;
    }
  } catch (err) {
    console.warn('NetInfo fetch check failed:', err);
  }
  return true;
};
