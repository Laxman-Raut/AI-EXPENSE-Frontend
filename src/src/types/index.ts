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
