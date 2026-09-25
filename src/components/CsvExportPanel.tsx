import React, { useState } from 'react';
import { Copy, Check, Download, FileSpreadsheet, ExternalLink, Eye, EyeOff, Sparkles, HelpCircle, Columns } from 'lucide-react';
import { Transaction } from '../types';
import { generateCsv, generateTsv, downloadCsvFile, copyForSpreadsheet } from '../utils/csv';

interface CsvExportPanelProps {
  transactions: Transaction[];
  statementName?: string;
}

export const CsvExportPanel: React.FC<CsvExportPanelProps> = ({ transactions, statementName }) => {
  const [copiedSpreadsheet, setCopiedSpreadsheet] = useState(false);
  const [copiedRawCsv, setCopiedRawCsv] = useState(false);
  const [showRawPreview, setShowRawPreview] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const csvString = generateCsv(transactions);

  // Primary Copy: Works directly with Google Sheets / Excel / Numbers
  // Injects both HTML <table> and TSV so Ctrl+V immediately populates columns A, B, C, D, E, F!
  const handleCopyForSpreadsheet = async () => {
    try {
      await copyForSpreadsheet(transactions);
      setCopiedSpreadsheet(true);
      setTimeout(() => setCopiedSpreadsheet(false), 2400);
    } catch (err) {
      console.error('Failed to copy spreadsheet table:', err);
    }
  };

  // Optional: Copy as raw comma text
  const handleCopyRawCsv = async () => {
    try {
      await navigator.clipboard.writeText(csvString);
      setCopiedRawCsv(true);
      setTimeout(() => setCopiedRawCsv(false), 2200);
    } catch (err) {
      console.error('Failed to copy raw CSV:', err);
    }
  };

  const handleDownloadCsv = () => {
    const filename = `${(statementName || 'bank_statement').toLowerCase().replace(/\s+/g, '_')}_transactions.csv`;
    downloadCsvFile(transactions, filename);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <span>Google Sheets & Excel Ready</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {transactions.length} rows • 6 columns
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Formats data across 6 discrete columns: <code className="text-emerald-400 font-mono text-[11px]">A:Date</code> | <code className="text-emerald-400 font-mono text-[11px]">B:Description</code> | <code className="text-emerald-400 font-mono text-[11px]">C:Amount</code> | <code className="text-emerald-400 font-mono text-[11px]">D:Category</code> | <code className="text-emerald-400 font-mono text-[11px]">E:Balance</code> | <code className="text-emerald-400 font-mono text-[11px]">F:notes</code>
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Action: Copy for Google Sheets (Cell & Column split) */}
          <button
            onClick={handleCopyForSpreadsheet}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            {copiedSpreadsheet ? (
              <>
                <Check className="w-4 h-4 mr-1.5 text-slate-950 stroke-[3]" />
                Copied for Google Sheets!
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5 text-slate-950" />
                Copy for Google Sheets (All Columns)
              </>
            )}
          </button>

          {/* Copy CSV / Spreadsheet table */}
          <button
            onClick={handleCopyForSpreadsheet}
            className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
          >
            {copiedSpreadsheet ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Table Copied!
              </>
            ) : (
              <>
                <Columns className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                Copy CSV Table
              </>
            )}
          </button>

          {/* Download CSV File */}
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Download .CSV
          </button>

          {/* Raw / Help Dropdown */}
          <button
            onClick={() => setShowTroubleshoot(!showTroubleshoot)}
            className="inline-flex items-center px-2.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 transition"
            title="Google Sheets paste tips"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Paste Help
          </button>
        </div>
      </div>

      {/* Quick Google Sheets Paste Hint Bar */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>
            Click <strong>"Copy for Google Sheets"</strong>, switch to your Google Sheet, select cell <strong>A1</strong>, and press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Ctrl+V</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">⌘+V</kbd>). All values will instantly fill columns A, B, C, D, E, F!
          </span>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <a
            href="https://sheets.new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-teal-400 hover:text-teal-300 hover:underline"
          >
            Open blank Google Sheet <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      </div>

      {/* Troubleshooting & Guide Box (Shows how to fix if already pasted into 1 column) */}
      {showTroubleshoot && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center">
              <Columns className="w-4 h-4 mr-1.5 text-emerald-400" />
              How Google Sheets column pasting works:
            </span>
            <button
              onClick={() => setShowTroubleshoot(false)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Close
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              1. <strong>Why did it paste into a single column before?</strong> Google Sheets treats plain comma-separated text (<code className="text-slate-200">Date,Description,Amount...</code>) as single-cell lines unless formatted as table data.
            </p>
            <p>
              2. <strong>Instant Solution:</strong> Click <strong>"Copy for Google Sheets (All Columns)"</strong> above. Our updated clipboard injector copies rich table data (<code className="text-slate-200">text/html</code> + tab-delimited values). When pasted into cell <strong>A1</strong>, Google Sheets automatically creates 6 separate columns!
            </p>
            <p>
              3. <strong>If you already pasted into Column A in Google Sheets:</strong> You can also split it in Google Sheets right now:
              <br />
              <span className="text-slate-400 pl-3 block mt-1">
                &rarr; Select Column <strong>A</strong> &rarr; Click top menu <strong>Data</strong> &rarr; Click <strong>Split text to columns</strong> &rarr; Choose <strong>Comma</strong> as the separator.
              </span>
            </p>
          </div>

          <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Need raw text without spreadsheet formatting?</span>
            <button
              onClick={handleCopyRawCsv}
              className="text-slate-400 hover:text-slate-200 underline"
            >
              {copiedRawCsv ? 'Raw CSV copied!' : 'Copy raw comma-separated text'}
            </button>
          </div>
        </div>
      )}

      {/* Raw CSV Text Preview Drawer */}
      {showRawPreview && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">CSV Output Preview (RFC-4180):</span>
            <span className="text-[11px] text-slate-500 font-mono">{csvString.split('\n').length} lines</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre select-all">
            {csvString}
          </div>
        </div>
      )}
    </div>
  );
};
