export interface Transaction {
  id: string;
  date: string;         // YYYY-MM-DD
  description: string;
  amount: number;       // Positive for deposits, negative for expenses
  category: string;     // groceries, dining, transport, salary, bills, etc.
  balance: number | null;
  notes: string;
}

export interface StatementExtractionResult {
  bankName: string;
  accountNumber?: string;
  statementPeriod?: string;
  currency: string;
  transactions: Transaction[];
  rawText?: string;
}

export interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  base64Data?: string;
}
