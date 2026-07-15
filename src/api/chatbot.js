import apiClient from './client';

/**
 * Send a message to the AI chatbot
 * @param {string} message 
 * @returns {Promise<{success: boolean, reply: string}>}
 */
export const sendChatbotMessage = async (message) => {
  const response = await apiClient.post('chatbot', { message });
  return response.data;
};

/**
 * Fetch the chat history for the authenticated user
 * @returns {Promise<{success: boolean, history: Array}>}
 */
export const getChatbotHistory = async () => {
  const response = await apiClient.get('chatbot/history');
  return response.data;
};

/**
 * Clear the chat history for the authenticated user
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const clearChatbotHistory = async () => {
  const response = await apiClient.delete('chatbot/history');
  return response.data;
};
