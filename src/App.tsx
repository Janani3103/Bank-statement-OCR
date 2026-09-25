/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { StatementUploader } from './components/StatementUploader';
import { TransactionTable } from './components/TransactionTable';
import { CsvExportPanel } from './components/CsvExportPanel';
import { AnalyticsSummary } from './components/AnalyticsSummary';
import { StatementCalculations } from './components/StatementCalculations';
import { ExtractionCodeModal } from './components/ExtractionCodeModal';
import { DocumentViewer } from './components/DocumentViewer';
import { Transaction, UploadedFileItem } from './types';
import { SAMPLE_STATEMENTS, SampleStatementPreset } from './data/sampleStatements';
import { Sparkles, Building2, Calendar, FileSpreadsheet, ShieldAlert, Calculator, Table } from 'lucide-react';

export default function App() {
  // Initialize with Chase Checking sample so user sees an active, complete table immediately
  const initialPreset = SAMPLE_STATEMENTS[0];

  const [transactions, setTransactions] = useState<Transaction[]>(initialPreset.transactions);
  const [bankName, setBankName] = useState<string>(initialPreset.bankName);
  const [accountNumber, setAccountNumber] = useState<string>(initialPreset.accountNumber);
  const [statementPeriod, setStatementPeriod] = useState<string>(initialPreset.statementPeriod);
  const [currency, setCurrency] = useState<string>(initialPreset.currency);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [sampleTextPreview, setSampleTextPreview] = useState<string>(initialPreset.documentTextPreview);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'calculations' | 'table'>('calculations');

  // Handle live extraction with server endpoint
  const handleExtract = async (files: UploadedFileItem[], modelChoice: string) => {
    setIsLoading(true);
    setApiError(null);
    setUploadedFiles(files);
    setSampleTextPreview('');

    try {
      setLoadingStep('Uploading documents to server...');
      
      const payloadFiles = files.map((f) => ({
        name: f.name,
        mimeType: f.type,
        data: f.base64Data,
      }));

      setLoadingStep('Gemini Vision reading document layout & OCR...');

      const response = await fetch('/api/extract-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: payloadFiles,
          modelChoice,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to extract transactions from document.');
      }

      setLoadingStep('Auto-categorizing & structuring CSV rows...');

      const formattedTransactions: Transaction[] = (result.transactions || []).map((t: any, index: number) => ({
        id: `gemini-tx-${Date.now()}-${index}`,
        date: t.date || '',
        description: t.description || 'Unknown Payee',
        amount: typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0,
        category: (t.category || 'other').toLowerCase(),
        balance: t.balance !== null && t.balance !== undefined ? parseFloat(t.balance) : null,
        notes: t.notes || '',
      }));

      setTransactions(formattedTransactions);
      setBankName(result.bankName || 'Detected Statement');
      setAccountNumber(result.accountNumber || '');
      setStatementPeriod(result.statementPeriod || '');
      setCurrency(result.currency || 'USD');
    } catch (err: any) {
      console.error('Extraction error:', err);
      setApiError(err.message || 'Error occurred while contacting Gemini Vision API.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Handle Selecting a Pre-loaded Sample
  const handleSelectSample = (preset: SampleStatementPreset) => {
    setTransactions(preset.transactions);
    setBankName(preset.bankName);
    setAccountNumber(preset.accountNumber);
    setStatementPeriod(preset.statementPeriod);
    setCurrency(preset.currency);
    setSampleTextPreview(preset.documentTextPreview);
    setUploadedFiles([]);
    setApiError(null);
  };

  // Transaction mutations
  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar onOpenCodeModal={() => setIsCodeModalOpen(true)} />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Bank Statement OCR to CSV</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Extract every transaction into: <code className="text-emerald-400 font-mono text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">Date | Description | Amount | Category | Balance | notes</code>
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center space-x-3 text-xs bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
            <div className="flex items-center text-slate-300">
              <Building2 className="w-4 h-4 text-emerald-400 mr-1.5" />
              <span>{bankName}</span>
            </div>
            {accountNumber && (
              <>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-slate-400">{accountNumber}</span>
              </>
            )}
            {statementPeriod && (
              <>
                <span className="text-slate-600">•</span>
                <div className="flex items-center text-slate-400">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  <span>{statementPeriod}</span>
                </div>
              </>
            )}
            {uploadedFiles.length > 1 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-medium">
                  {uploadedFiles.length} Files Merged
                </span>
              </>
            )}
          </div>
        </div>

        {/* Global Error Banner if API fails */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-200">Extraction Error</p>
              <p className="mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <StatementUploader
          onExtract={handleExtract}
          onSelectSample={handleSelectSample}
          isLoading={isLoading}
          loadingStep={loadingStep}
        />

        {/* Original Document Source Viewer */}
        <DocumentViewer
          files={uploadedFiles}
          sampleTextPreview={sampleTextPreview}
          bankName={bankName}
          statementPeriod={statementPeriod}
        />

        {/* Analytics Summary KPI Cards */}
        {transactions.length > 0 && (
          <AnalyticsSummary transactions={transactions} currency={currency} />
        )}

        {/* Google Sheets / CSV Copy & Download Panel */}
        {transactions.length > 0 && (
          <CsvExportPanel
            transactions={transactions}
            statementName={`${bankName}_${statementPeriod || 'Statement'}`}
          />
        )}

        {/* View Mode Switcher Tab Bar */}
        {transactions.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3">
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveView('calculations')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeView === 'calculations'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Calculations & Spending Breakdown</span>
              </button>

              <button
                onClick={() => setActiveView('table')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeView === 'table'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Table className="w-4 h-4" />
                <span>Transaction Table ({transactions.length})</span>
              </button>
            </div>

            <div className="text-xs text-slate-400">
              {activeView === 'calculations' ? (
                <span>Showing spending calculations, total income, and record counts</span>
              ) : (
                <span>Showing raw CSV rows with inline editing</span>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Section: Statement Calculations vs Transaction Table */}
        {transactions.length > 0 && activeView === 'calculations' && (
          <StatementCalculations
            transactions={transactions}
            currency={currency}
            bankName={bankName}
            statementPeriod={statementPeriod}
          />
        )}

        {transactions.length > 0 && activeView === 'table' && (
          <TransactionTable
            transactions={transactions}
            currency={currency}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onAddTransaction={handleAddTransaction}
          />
        )}
      </main>

      {/* Extraction Code Modal for Developers */}
      <ExtractionCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        <p>Bank Statement OCR & CSV Extractor • Powered by Gemini Vision Multimodal AI</p>
      </footer>
    </div>
  );
}
