export interface User {
  _id: string;
  fullName: string;
  email: string;
  avatar: string;
  isVerified: boolean;
  currency: string;
  monthlyBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  user: string;
  type: 'expense' | 'income';
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet' | 'Bank Transfer';
  transactionDate: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  type: 'expense' | 'income';
  category: string;
  description: string;
  amount: number;
  paymentMethod?: string;
  transactionDate?: string;
  note?: string;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface MonthlyAnalytics {
  _id: { month: number };
  income: number;
  expense: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet' | 'Bank Transfer';

export type TransactionType = 'expense' | 'income';

export interface Subscription {
  plan: 'free' | 'pro_monthly' | 'pro_yearly' | 'pro';
  status: 'active' | 'inactive' | 'trialing' | 'cancelled';
  provider: 'none' | 'razorpay' | 'manual';
  startDate: string | null;
  endDate: string | null;
  autoRenew: boolean;
}

export interface SubscriptionState extends Subscription {
  loading: boolean;
  error: string | null;
  upgradeSuccess: boolean;
}

export interface CreateOrderResponse {
  order: {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: any[];
    created_at: number;
  };
  payment: {
    _id: string;
    userId: string;
    amount: number;
    currency: string;
    plan: string;
    provider: string;
    status: string;
    razorpayOrderId: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

