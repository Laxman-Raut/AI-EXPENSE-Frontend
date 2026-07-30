import apiClient from '../api/client';

/**
 * Generate UPI Deep Link for a Split Request
 * @param {string} splitRequestId
 * @returns {Promise<{success: boolean, message: string, data: {deepLink: string, amount: number, receiver: string, upiId: string}}>}
 */
export const generateDeepLink = async (splitRequestId) => {
  try {
    const response = await apiClient.post('/upi/deeplink', { splitRequestId });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw {
        ...error.response.data,
        message: error.response.data.message || 'Failed to generate UPI payment link.',
        isNetworkError: false,
      };
    }
    throw {
      success: false,
      message: error.message || 'Network error. Please check your connection.',
      isNetworkError: true,
    };
  }
};

export default {
  generateDeepLink,
};
