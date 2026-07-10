// AI Insights service simulating future machine learning insights
export const fetchAIInsights = async () => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    success: true,
    data: {
      healthScore: 82, // AI Financial Health Score out of 100
      predictedExpense: 42800, // Predicted Monthly Expense
      predictedSavings: 7200,
      weeklySummary: 'Your spending is down by 8% compared to last week, primarily due to lower dining out and transport expenses.',
      monthlySummary: 'You are on track to save ₹12,000 this month. Entertainment is your fastest-growing category, showing a 15% increase month-on-month.',
      
      warnings: [
        {
          id: 'w1',
          type: 'danger',
          title: 'Budget Alert: Food & Dining',
          message: 'You have spent 92% of your dining budget (₹13,800/₹15,000) with 10 days remaining in the month.',
        },
        {
          id: 'w2',
          type: 'warning',
          title: 'Subscription Creep',
          message: 'We detected 3 recurring monthly digital subscriptions totaling ₹1,499. Consider reviewing unused services.',
        }
      ],

      suggestions: [
        {
          id: 's1',
          icon: 'bulb-outline',
          category: 'Food',
          title: 'Meal prep savings',
          message: 'Cooking at home on weekdays could save you roughly ₹3,500 this month based on your current order history.',
        },
        {
          id: 's2',
          icon: 'trending-down-outline',
          category: 'Transport',
          title: 'Commute optimization',
          message: 'Switching to metro/public transport or ridesharing for mid-week commutes could reduce transit costs by 22%.',
        },
        {
          id: 's3',
          icon: 'cash-outline',
          category: 'Investment',
          title: 'Automate micro-savings',
          message: 'Setup a round-up vault to auto-invest spare change from transactions. This could add ₹800/mo to your mutual funds.',
        }
      ],

      topSpendingCategory: 'Food & Dining (31% of total)',
    },
  };
};
