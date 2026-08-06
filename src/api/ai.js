import apiClient from './client';

/**
 * Detect whether a file object is a PDF based on MIME type or filename.
 */
const isPdf = (fileOrUrl) => {
  if (typeof fileOrUrl === 'string') return false;
  const type = (fileOrUrl.type || fileOrUrl.mimeType || '').toLowerCase();
  const name = (fileOrUrl.name || fileOrUrl.fileName || '').toLowerCase();
  return type.includes('pdf') || name.endsWith('.pdf');
};

/**
 * Detect whether a URI is an Android content:// or a local file:// path
 * that requires react-native-blob-util to read (not a remote http URL).
 */
const isLocalUri = (uri) => {
  if (!uri || typeof uri !== 'string') return false;
  return uri.startsWith('content://') || uri.startsWith('file://') || uri.startsWith('/');
};

export const scanReceipt = async (fileOrUrl) => {
  // ── PATH 1: URL string ────────────────────────────────────────────
  // Existing behaviour — send receiptUrl as JSON. Unchanged.
  if (typeof fileOrUrl === 'string') {
    console.log('[scanReceipt] PATH 1 — URL string:', fileOrUrl);
    const response = await apiClient.post('ai/scan-receipt', { receiptUrl: fileOrUrl });
    return response.data;
  }

  const uri = fileOrUrl.uri;
  const mimeType = fileOrUrl.type || fileOrUrl.mimeType || 'application/octet-stream';
  const fileName = fileOrUrl.name || fileOrUrl.fileName || 'file';

  console.log(`[scanReceipt] File object — uri: ${uri}, mimeType: ${mimeType}, name: ${fileName}`);

  // ── PATH 2: PDF via local URI (content:// or file://) ─────────────
  // Use react-native-blob-util to read the bytes as base64 so we bypass
  // the broken FormData + content:// URI combination for binary PDF files.
  if (isPdf(fileOrUrl) && isLocalUri(uri)) {
    console.log('[scanReceipt] PATH 2 — PDF local URI detected, reading with react-native-blob-util');
    try {
      const RNBlobUtil = require('react-native-blob-util').default;

      let base64Data;

      if (uri.startsWith('content://')) {
        // content:// URI — use readStream or fetch to read bytes
        console.log('[scanReceipt] Reading content:// URI via RNBlobUtil.fs.readFile');
        // RNBlobUtil can read content:// URIs directly on Android
        base64Data = await RNBlobUtil.fs.readFile(uri, 'base64');
      } else {
        // file:// or bare path
        const filePath = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
        console.log('[scanReceipt] Reading file:// path via RNBlobUtil.fs.readFile:', filePath);
        base64Data = await RNBlobUtil.fs.readFile(filePath, 'base64');
      }

      console.log(`[scanReceipt] Read PDF as base64 — length: ${base64Data.length} chars`);

      const response = await apiClient.post('ai/scan-receipt', {
        pdfBase64: base64Data,
        mimeType: mimeType,
        fileName: fileName,
      });
      return response.data;
    } catch (blobError) {
      console.warn('[scanReceipt] react-native-blob-util read failed, falling back to FormData:', blobError.message);
      // Fall through to PATH 3 (FormData) as a last resort
    }
  }

  // ── PATH 3: Multipart FormData (images + PDFs with http:// URIs) ──
  // Original behaviour for camera/gallery images. Also serves as fallback.
  console.log('[scanReceipt] PATH 3 — FormData multipart upload');
  const formData = new FormData();
  formData.append('image', fileOrUrl);

  const response = await apiClient.post('ai/scan-receipt', formData, {
    transformRequest: (data, headers) => {
      // Strip Content-Type so Axios auto-generates multipart/form-data with correct boundary
      delete headers['Content-Type'];
      return data;
    },
  });

  return response.data;
};

/**
 * Fetches AI-powered financial insights by aggregating data from analytics endpoints.
 * Computes health score, category breakdown, trends, and actionable tips.
 */
export const fetchAIInsights = async () => {
  try {
    const [monthlyRes, categoryRes] = await Promise.all([
      apiClient.get('analytics/monthly?range=monthly'),
      apiClient.get('analytics/category?range=monthly'),
    ]);

    const monthly = monthlyRes.data?.data || {};
    const categories = categoryRes.data?.data || [];

    // Compute health score based on spending patterns
    const totalIncome = monthly.totalIncome || 0;
    const totalExpense = monthly.totalExpense || 0;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 50;
    const healthScore = Math.min(100, Math.max(0, Math.round(savingsRate + 30)));

    // Build category breakdown with percentages
    const totalSpent = categories.reduce((sum, c) => sum + (c.amount || 0), 0);
    const categoryBreakdown = categories.map((c) => ({
      name: c.category || c.name,
      amount: c.amount || 0,
      percentage: totalSpent > 0 ? Math.round(((c.amount || 0) / totalSpent) * 100) : 0,
      color: c.color || '#8A3FFC',
      icon: c.icon || 'ellipse',
    }));

    // Generate spending trend
    const dailyData = monthly.dailyTrend || [];
    const spendingTrend = dailyData.map((d) => ({
      date: d.date || d.label,
      amount: d.expense || d.value || 0,
    }));

    // Generate actionable tips
    const tips = [];
    if (savingsRate < 20) {
      tips.push({ icon: 'alert-circle', text: 'Your savings rate is below 20%. Try to cut discretionary spending.' });
    }
    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown[0];
      tips.push({ icon: 'trending-up', text: `${topCategory.name} is your highest expense at ${topCategory.percentage}% of total spending.` });
    }
    if (savingsRate >= 30) {
      tips.push({ icon: 'checkmark-circle', text: 'Great job! You\'re saving over 30% of your income this month.' });
    }
    if (tips.length === 0) {
      tips.push({ icon: 'bulb', text: 'Add more transactions to get personalized financial insights.' });
    }

    return {
      success: true,
      data: {
        healthScore,
        totalIncome,
        totalExpense,
        savingsRate: Math.round(savingsRate),
        categoryBreakdown,
        spendingTrend,
        tips,
        monthlyBudget: monthly.monthlyBudget || 0,
        budgetUtilization: monthly.budgetUtilization || 0,
      },
    };
  } catch (error) {
    console.error('fetchAIInsights error:', error);
    throw error;
  }
};
