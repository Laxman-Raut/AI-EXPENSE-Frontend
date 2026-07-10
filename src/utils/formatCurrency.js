export const formatCurrency = (amount, currency = 'INR') => {
  const absAmount = Math.abs(amount);
  
  if (currency === 'INR') {
    const formatted = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return `₹${formatted}`;
  }
  
  return absAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export const formatCompactCurrency = (amount) => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 10000000) {
    return `₹${(absAmount / 10000000).toFixed(1)}Cr`;
  }
  if (absAmount >= 100000) {
    return `₹${(absAmount / 100000).toFixed(1)}L`;
  }
  if (absAmount >= 1000) {
    return `₹${(absAmount / 1000).toFixed(1)}K`;
  }
  return `₹${absAmount}`;
};
