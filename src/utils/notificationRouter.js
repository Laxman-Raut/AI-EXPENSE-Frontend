/**
 * Maps any notification (backend auto-alert or admin broadcast campaign)
 * to its corresponding app screen based on explicit payload data or title/body intent.
 */
export const resolveNotificationRoute = (notification) => {
  const type = String(notification?.type || '').toLowerCase();
  const data = notification?.data || {};
  const title = String(notification?.title || '').toLowerCase();
  const body = String(notification?.body || '').toLowerCase();
  const combined = `${title} ${body}`;

  // 1. Explicit screen from data payload
  if (data.screen) {
    if (data.screen === 'Budget') {
      return {
        screen: 'Budget',
        actionLabel: 'View Budget',
        badgeLabel: 'Budget',
        icon: 'wallet-outline',
        color: '#FF9500',
      };
    }
    if (data.screen === 'RecurringTransactions') {
      return {
        screen: 'Profile',
        params: { screen: 'RecurringTransactions' },
        actionLabel: 'View Recurring',
        badgeLabel: 'Recurring',
        icon: 'alarm-outline',
        color: '#5856D6',
      };
    }
    if (data.screen === 'AddTransaction') {
      return {
        screen: 'AddTransaction',
        actionLabel: 'Add Expense',
        badgeLabel: 'Expense',
        icon: 'add-circle-outline',
        color: '#FF4D67',
      };
    }
    if (data.screen === 'Subscription') {
      return {
        screen: 'Subscription',
        actionLabel: 'Upgrade Plan',
        badgeLabel: 'Pro',
        icon: 'diamond-outline',
        color: '#AF52DE',
      };
    }
    return {
      screen: data.screen,
      params: data.params,
      actionLabel: 'Open',
      badgeLabel: type || 'System',
      icon: 'information-circle-outline',
      color: '#5AC8FA',
    };
  }

  // 2. Specific Transaction ID
  if (data.transactionId) {
    return {
      screen: 'TransactionDetail',
      params: { id: data.transactionId },
      actionLabel: 'View Transaction',
      badgeLabel: type === 'income' ? 'Income' : 'Expense',
      icon: type === 'income' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline',
      color: type === 'income' ? '#00D26A' : '#FF4D67',
    };
  }

  // 3. Smart Keyword & Intent Detection:
  // A. Track / Add expenses (e.g. "Don't forget to track your expenses today", "Add today's expenses")
  if (
    combined.includes('track your expense') ||
    combined.includes('track expense') ||
    combined.includes('add today') ||
    combined.includes('log your expense') ||
    combined.includes('log expense') ||
    combined.includes('record expense') ||
    combined.includes('enter expense') ||
    combined.includes('forget to track') ||
    combined.includes('record today')
  ) {
    return {
      screen: 'AddTransaction',
      actionLabel: 'Add Expense',
      badgeLabel: 'Expense',
      icon: 'add-circle-outline',
      color: '#FF4D67',
    };
  }

  // B. Budget alert / warning / limit / burn
  if (
    type === 'budget' ||
    combined.includes('budget') ||
    combined.includes('spending limit')
  ) {
    return {
      screen: 'Budget',
      actionLabel: 'View Budget',
      badgeLabel: 'Budget',
      icon: 'wallet-outline',
      color: '#FF9500',
    };
  }

  // C. Recurring payments / EMI / Bills / Subscriptions due
  if (
    type === 'reminder' ||
    combined.includes('recurring') ||
    combined.includes('emi') ||
    combined.includes('bill due') ||
    combined.includes('payment due') ||
    combined.includes('upcoming payment') ||
    combined.includes('auto-recorded') ||
    combined.includes('due tomorrow') ||
    combined.includes('due today')
  ) {
    return {
      screen: 'Profile',
      params: { screen: 'RecurringTransactions' },
      actionLabel: 'View Recurring',
      badgeLabel: 'Recurring',
      icon: 'alarm-outline',
      color: '#5856D6',
    };
  }

  // D. Subscription / Upgrade / Pro Plan
  if (
    type === 'subscription' ||
    combined.includes('upgrade') ||
    combined.includes('pro plan') ||
    combined.includes('subscription') ||
    combined.includes('premium') ||
    combined.includes('renew plan') ||
    combined.includes('unlock')
  ) {
    return {
      screen: 'Subscription',
      actionLabel: 'Upgrade Plan',
      badgeLabel: 'Pro',
      icon: 'diamond-outline',
      color: '#AF52DE',
    };
  }

  // E. AI Insights / Reports / Analytics
  if (
    type === 'ai' ||
    combined.includes('ai') ||
    combined.includes('insight') ||
    combined.includes('report') ||
    combined.includes('summary') ||
    combined.includes('analysis')
  ) {
    return {
      screen: 'Analytics',
      params: { screen: 'AIInsights' },
      actionLabel: 'View Insights',
      badgeLabel: 'AI',
      icon: 'sparkles-outline',
      color: '#AF52DE',
    };
  }

  // F. Savings / Jars / Goal
  if (
    type === 'savings' ||
    combined.includes('saving') ||
    combined.includes('jar') ||
    combined.includes('goal')
  ) {
    return {
      screen: 'Savings',
      actionLabel: 'View Savings',
      badgeLabel: 'Savings',
      icon: 'archive-outline',
      color: '#34C759',
    };
  }

  // G. Friends / Split
  if (
    combined.includes('split') ||
    combined.includes('friend') ||
    combined.includes('group')
  ) {
    return {
      screen: 'Friends',
      params: { screen: 'FriendsHome' },
      actionLabel: 'View Friends',
      badgeLabel: 'Social',
      icon: 'people-outline',
      color: '#5AC8FA',
    };
  }

  // H. Bank Accounts
  if (
    combined.includes('bank') ||
    combined.includes('account linked')
  ) {
    return {
      screen: 'BankAccounts',
      actionLabel: 'View Accounts',
      badgeLabel: 'Bank',
      icon: 'business-outline',
      color: '#007AFF',
    };
  }

  // I. Transactions list / Wallet
  if (
    type === 'expense' ||
    type === 'income' ||
    combined.includes('transaction') ||
    combined.includes('spent') ||
    combined.includes('received')
  ) {
    return {
      screen: 'Wallet',
      params: { screen: 'TransactionsList' },
      actionLabel: 'View Transactions',
      badgeLabel: type === 'income' ? 'Income' : 'Expense',
      icon: type === 'income' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline',
      color: type === 'income' ? '#00D26A' : '#FF4D67',
    };
  }

  // J. Profile / Security
  if (
    type === 'security' ||
    combined.includes('password') ||
    combined.includes('security')
  ) {
    return {
      screen: 'Profile',
      params: { screen: 'ProfileHome' },
      actionLabel: 'Security Settings',
      badgeLabel: 'Security',
      icon: 'shield-checkmark-outline',
      color: '#FF3B30',
    };
  }

  // Default fallback -> Today (Dashboard)
  return {
    screen: 'Today',
    params: { screen: 'TodayHome' },
    actionLabel: 'View Dashboard',
    badgeLabel: 'Notice',
    icon: 'information-circle-outline',
    color: '#5AC8FA',
  };
};
