import XLSX from 'xlsx';
import RNBlobUtil from 'react-native-blob-util';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import dayjs from 'dayjs';

const { dirs } = RNBlobUtil.fs;

// Format a transaction row for both Excel and PDF
const formatRow = (txn) => ({
  Date: dayjs(txn.transactionDate).format('DD MMM YYYY'),
  Description: txn.description || '-',
  Category: txn.category || '-',
  Type: txn.type === 'income' ? 'Income' : 'Expense',
  'Payment Method': txn.paymentMethod || '-',
  Amount: txn.type === 'income' ? `+${txn.amount}` : `-${txn.amount}`,
});

// ──────────────── EXCEL EXPORT ────────────────
export const exportToExcel = async (transactions, currency = '₹') => {
  try {
    const rows = transactions.map(formatRow);

    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto column widths
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String(r[key]).length)) + 2,
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    const fileName = `transactions_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`;
    const filePath = `${dirs.DocumentDir}/${fileName}`;

    await RNBlobUtil.fs.writeFile(filePath, base64, 'base64');

    await Share.open({
      title: 'Export Transactions - Excel',
      url: `file://${filePath}`,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: fileName,
      failOnCancel: false,
    });

    return { success: true };
  } catch (error) {
    if (error?.message?.includes('User did not share')) return { success: false, cancelled: true };
    throw error;
  }
};

// ──────────────── PDF EXPORT ────────────────
const buildHtml = (transactions, currency = '₹') => {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const rows = transactions
    .map((t) => {
      const isIncome = t.type === 'income';
      const color = isIncome ? '#00C48C' : '#FF647C';
      const sign = isIncome ? '+' : '-';
      return `
        <tr>
          <td>${dayjs(t.transactionDate).format('DD MMM YYYY')}</td>
          <td>${t.description || '-'}</td>
          <td>${t.category || '-'}</td>
          <td>${t.paymentMethod || '-'}</td>
          <td style="color:${color}; font-weight:600;">${sign}${currency}${t.amount.toLocaleString()}</td>
        </tr>`;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #0F1117; color: #E4E7EF; padding: 32px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
        .logo { font-size: 22px; font-weight: 800; color: #4B8CFF; letter-spacing: -0.5px; }
        .date { font-size: 12px; color: #8891A5; }
        .title { font-size: 18px; font-weight: 700; color: #E4E7EF; margin-bottom: 20px; }
        .summary { display: flex; gap: 16px; margin-bottom: 28px; }
        .stat-box { flex: 1; background: #1A1D27; border-radius: 10px; padding: 16px; border: 1px solid #2A2D3A; }
        .stat-label { font-size: 11px; color: #8891A5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
        .stat-val { font-size: 20px; font-weight: 700; }
        .income { color: #00C48C; }
        .expense { color: #FF647C; }
        .savings { color: #4B8CFF; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        thead tr { background: #1A1D27; }
        th { padding: 12px 14px; text-align: left; color: #8891A5; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; font-size: 10px; }
        td { padding: 11px 14px; color: #C5CAD8; border-bottom: 1px solid #1E2130; }
        tr:nth-child(even) td { background: #13161F; }
        .footer { margin-top: 24px; font-size: 11px; color: #8891A5; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <span class="logo">💰 AET</span>
        <span class="date">Exported ${dayjs().format('DD MMM YYYY, hh:mm A')}</span>
      </div>
      <div class="title">Transaction History (${transactions.length} records)</div>
      <div class="summary">
        <div class="stat-box">
          <div class="stat-label">Total Income</div>
          <div class="stat-val income">${currency}${totalIncome.toLocaleString()}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total Expense</div>
          <div class="stat-val expense">${currency}${totalExpense.toLocaleString()}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Net Savings</div>
          <div class="stat-val savings">${currency}${Math.max(totalIncome - totalExpense, 0).toLocaleString()}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Payment</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">AI Expense Tracker &bull; Generated on ${dayjs().format('DD MMMM YYYY')}</div>
    </body>
    </html>`;
};

export const exportToPDF = async (transactions, currency = '₹') => {
  try {
    const html = buildHtml(transactions, currency);
    const fileName = `transactions_${dayjs().format('YYYY-MM-DD_HH-mm')}`;

    const result = await RNHTMLtoPDF.convert({
      html,
      fileName,
      directory: 'Documents',
      base64: false,
    });

    const filePath = result.filePath;

    await Share.open({
      title: 'Export Transactions - PDF',
      url: `file://${filePath}`,
      type: 'application/pdf',
      filename: `${fileName}.pdf`,
      failOnCancel: false,
    });

    return { success: true };
  } catch (error) {
    if (error?.message?.includes('User did not share')) return { success: false, cancelled: true };
    throw error;
  }
};
