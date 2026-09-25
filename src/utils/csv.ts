import { Transaction } from '../types';

/**
 * Format transactions into clean CSV string
 * Header: Date,Description,Amount,Category,Balance,notes
 */
export function generateCsv(transactions: Transaction[]): string {
  const headers = ['Date', 'Description', 'Amount', 'Category', 'Balance', 'notes'];

  const rows = transactions.map((t) => {
    const formattedAmount = t.amount.toFixed(2);
    const formattedBalance = t.balance !== null && t.balance !== undefined ? t.balance.toFixed(2) : '';

    return [
      escapeCsvField(t.date || ''),
      escapeCsvField(t.description || ''),
      escapeCsvField(formattedAmount),
      escapeCsvField(t.category || 'other'),
      escapeCsvField(formattedBalance),
      escapeCsvField(t.notes || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Format transactions into clean TSV (Tab-Separated Values)
 * When copied to clipboard and pasted into Google Sheets, TSV will automatically
 * populate separate columns across rows without requiring the "Split text to columns" tool.
 */
export function generateTsv(transactions: Transaction[]): string {
  const headers = ['Date', 'Description', 'Amount', 'Category', 'Balance', 'notes'];

  const rows = transactions.map((t) => {
    const formattedAmount = t.amount.toFixed(2);
    const formattedBalance = t.balance !== null && t.balance !== undefined ? t.balance.toFixed(2) : '';

    return [
      cleanTsvField(t.date || ''),
      cleanTsvField(t.description || ''),
      cleanTsvField(formattedAmount),
      cleanTsvField(t.category || 'other'),
      cleanTsvField(formattedBalance),
      cleanTsvField(t.notes || ''),
    ].join('\t');
  });

  return [headers.join('\t'), ...rows].join('\n');
}

function escapeCsvField(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function cleanTsvField(val: string): string {
  // Replace tabs and newlines with spaces to maintain TSV structure
  return val.replace(/\t/g, ' ').replace(/[\r\n]+/g, ' ');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate HTML table markup for clipboard
 * Google Sheets, Excel, and LibreOffice natively recognize text/html tables
 * and immediately paste every value into distinct columns (A, B, C, D, E, F) and cells!
 */
export function generateHtmlTable(transactions: Transaction[]): string {
  const headers = ['Date', 'Description', 'Amount', 'Category', 'Balance', 'notes'];
  const headerHtml = `<tr>${headers.map((h) => `<th style="font-weight:bold;border:1px solid #ccc;padding:4px;">${escapeHtml(h)}</th>`).join('')}</tr>`;

  const rowsHtml = transactions
    .map((t) => {
      const formattedAmount = t.amount.toFixed(2);
      const formattedBalance = t.balance !== null && t.balance !== undefined ? t.balance.toFixed(2) : '';

      return (
        `<tr>` +
        `<td style="border:1px solid #ccc;padding:4px;">${escapeHtml(t.date || '')}</td>` +
        `<td style="border:1px solid #ccc;padding:4px;">${escapeHtml(t.description || '')}</td>` +
        `<td style="border:1px solid #ccc;padding:4px;text-align:right;">${escapeHtml(formattedAmount)}</td>` +
        `<td style="border:1px solid #ccc;padding:4px;">${escapeHtml(t.category || 'other')}</td>` +
        `<td style="border:1px solid #ccc;padding:4px;text-align:right;">${escapeHtml(formattedBalance)}</td>` +
        `<td style="border:1px solid #ccc;padding:4px;">${escapeHtml(t.notes || '')}</td>` +
        `</tr>`
      );
    })
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
}

/**
 * Copy to clipboard formatted specifically so Google Sheets and Excel
 * paste cleanly across columns (A through F) and individual cells.
 */
export async function copyForSpreadsheet(transactions: Transaction[]): Promise<boolean> {
  const tsv = generateTsv(transactions);
  const html = generateHtmlTable(transactions);

  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      const textBlob = new Blob([tsv], { type: 'text/plain' });
      const htmlBlob = new Blob([html], { type: 'text/html' });

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob,
        }),
      ]);
      return true;
    }
  } catch (err) {
    console.warn('ClipboardItem rich format write failed, falling back to TSV text/plain:', err);
  }

  // Fallback: write TSV directly, which Google Sheets also splits into columns
  await navigator.clipboard.writeText(tsv);
  return true;
}

/**
 * Trigger download of CSV file
 */
export function downloadCsvFile(transactions: Transaction[], filename: string = 'bank_statement_transactions.csv') {
  const csvContent = '\uFEFF' + generateCsv(transactions); // UTF-8 BOM for Excel/Sheets compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format currency with proper + / - signs
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  const isNegative = amount < 0;
  const abs = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (isNegative) {
    return `-${symbol}${abs}`;
  }
  return `+${symbol}${abs}`;
}
