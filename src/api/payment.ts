import apiClient from './client';
import { ApiResponse, CreateOrderResponse, VerifyPaymentPayload } from '../types';

/**
 * Create a new payment order.
 * POST /api/payment/create-order
 */
export const createPaymentOrder = async (
  plan: 'pro_monthly' | 'pro_yearly'
): Promise<ApiResponse<CreateOrderResponse>> => {
  const response = await apiClient.post('payment/create-order', { plan });
  return response.data;
};

/**
 * Verify payment signature from Razorpay.
 * POST /api/payment/verify
 */
export const verifyPayment = async (
  payload: VerifyPaymentPayload
): Promise<ApiResponse<any>> => {
  const response = await apiClient.post('payment/verify', payload);
  return response.data;
};
