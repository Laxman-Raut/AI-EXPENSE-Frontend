import apiClient from './client';
import { ApiResponse, CreateOrderResponse, VerifyPaymentPayload } from '../types';

/**
 * Create a new payment order.
 * POST /api/payment/create-order
 */
export const createPaymentOrder = async (
  plan: string,
  couponCode?: string
): Promise<ApiResponse<CreateOrderResponse>> => {
  const response = await apiClient.post('payment/create-order', { plan, couponCode });
  return response.data;
};

/**
 * Validate a coupon code before payment.
 * POST /api/payment/validate-coupon
 */
export const validateCoupon = async (
  code: string,
  planSlug: string
): Promise<ApiResponse<any>> => {
  const response = await apiClient.post('payment/validate-coupon', { code, planSlug });
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
