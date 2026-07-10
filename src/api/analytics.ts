import apiClient from './client';
import { ApiResponse } from '../types';

export interface CategoryAnalytic {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface MonthlyReport {
  _id: { month?: number; day?: number };
  income: number;
  expense: number;
}

export interface YearlyComparison {
  thisYear: { totalIncome: number; totalExpense: number; savings: number };
  lastYear: { totalIncome: number; totalExpense: number; savings: number };
  growthRate: number;
}

export interface BudgetUtilization {
  budgetLimit: number;
  currentSpent: number;
  utilizationPercentage: number;
  savingsPercentage: number;
  daysRemaining: number;
}

// Category-wise spending
export const fetchCategoryAnalytics = async (range: string = 'monthly'): Promise<ApiResponse<CategoryAnalytic[]>> => {
  try {
    const response = await apiClient.get(`/analytics/category?range=${range}`);
    return response.data;
  } catch (error: any) {
    console.warn('Category analytics API error:', error.message);
    return { success: true, data: [] };
  }
};

// Monthly analytics
export const fetchAnalyticsReport = async (range: string = 'monthly'): Promise<ApiResponse<MonthlyReport[]>> => {
  try {
    const response = await apiClient.get(`/analytics/monthly?range=${range}`);
    return response.data;
  } catch (error: any) {
    console.warn('Analytics API error:', error.message);
    return { success: true, data: [] };
  }
};

// Yearly comparison report
export const fetchYearlyComparison = async (): Promise<ApiResponse<YearlyComparison>> => {
  try {
    const response = await apiClient.get('/analytics/yearly');
    return response.data;
  } catch (error: any) {
    console.warn('Yearly comparison API error:', error.message);
    return { success: false, data: undefined as any };
  }
};

// Budget utilization and savings stats
export const fetchBudgetUtilization = async (range: string = 'monthly'): Promise<ApiResponse<BudgetUtilization>> => {
  try {
    const response = await apiClient.get(`/analytics/budget?range=${range}`);
    return response.data;
  } catch (error: any) {
    console.warn('Budget utilization API error:', error.message);
    return { success: true, data: undefined as any };
  }
};
