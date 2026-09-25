import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode2, Sparkles, BookOpen } from 'lucide-react';

interface ExtractionCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtractionCodeModal: React.FC<ExtractionCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'python' | 'nodejs' | 'prompt'>('python');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const pythonCode = `# ==========================================================
# Bank Statement OCR Parser with Gemini Vision (Python)
# Requirements: pip install google-genai
# ==========================================================
import os
import json
import csv
from google import genai
from google.genai import types

# 1. Initialize client with your Gemini API Key
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

def extract_bank_statements(file_paths: list[str], output_csv: str = "transactions.csv"):
    """
    Extracts and consolidates transactions across multiple PDFs or image scans.
    Outputs clean CSV with: Date | Description | Amount | Category | Balance | notes
    """
    contents_parts = []
    
    # Add each file as an inline part (multi-page PDF, PNG, JPG)
    for path in file_paths:
        mime_type = "application/pdf" if path.lower().endswith(".pdf") else "image/png"
        with open(path, "rb") as f:
            contents_parts.append(types.Part.from_bytes(data=f.read(), mime_type=mime_type))

    system_prompt = """
    You are an expert financial document OCR parser.
    Extract EVERY transaction row across ALL provided statement files/pages.
    
    CRITICAL RULES:
    1. Columns: Date (YYYY-MM-DD), Description, Amount, Category, Balance, notes.
    2. Multi-File: Scan every uploaded page in order and merge all transactions into one master list.
    3. Amount: POSITIVE (+) for deposits/income/credits. NEGATIVE (-) for expenses/debits/withdrawals.
    4. Category: Auto-detect (groceries, dining, transport, salary, bills, shopping, health, entertainment, investment, transfer, fee, software, other).
    5. Balance: Running balance if printed on row, else null.
    6. Exclude: Skip all header rows, summary boxes (Beginning/Ending balance, Total Deposits), page numbers, ads.
    """

    contents_parts.append(system_prompt)
    print(f"Analyzing {len(file_paths)} file(s) with Gemini Vision...")

    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=contents_parts,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1
        )
    )

    data = json.loads(response.text)
    transactions = data.get("transactions", [])
    print(f"Extracted {len(transactions)} transactions successfully across all files.")

    # Write to standard RFC-4180 CSV
    with open(output_csv, mode="w", newline="", encoding="utf-8-sig") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["Date", "Description", "Amount", "Category", "Balance", "notes"])
        for t in transactions:
            writer.writerow([
                t.get("date", ""),
                t.get("description", ""),
                f"{float(t.get('amount', 0)):.2f}",
                t.get("category", "other"),
                f"{float(t.get('balance')):.2f}" if t.get("balance") is not None else "",
                t.get("notes", "")
            ])

    print(f"Saved CSV ready for Google Sheets to {output_csv}")
    return transactions

if __name__ == "__main__":
    # Example: pass multiple PDF pages or image scans
    extract_bank_statements(["page_1.png", "page_2.png", "statement_summary.pdf"])
`;

  const nodeCode = `// ==========================================================
// Bank Statement OCR Parser with Gemini Vision (Node.js/TS)
// Requirements: npm install @google/genai dotenv
// ==========================================================
import { GoogleGenAI, Type } from "@google/genai";
import * as fs from "fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function extractBankStatements(filePaths: string[], outputCsvPath: string = "transactions.csv") {
  // Build parts array containing all files (PDFs, PNGs, JPEGs)
  const parts: any[] = filePaths.map((filePath) => {
    const mimeType = filePath.endsWith(".pdf") ? "application/pdf" : "image/png";
    const fileBase64 = fs.readFileSync(filePath, { encoding: "base64" });
    return { inlineData: { mimeType, data: fileBase64 } };
  });

  const prompt = \`
  Extract all bank transaction rows across ALL uploaded files/pages into structured JSON:
  - Date strictly formatted as YYYY-MM-DD
  - Amount positive for deposits/credits, negative for expenses/withdrawals
  - Category auto-detected (groceries, dining, transport, salary, bills, etc.)
  - Balance running balance if present
  - Notes check number or reference ID
  - Exclude headers, starting/ending summary blocks, and non-transaction text
  - Consolidate all files in sequence into a single unified list
  \`;
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: { parts },
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transactions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                category: { type: Type.STRING },
                balance: { type: Type.NUMBER },
                notes: { type: Type.STRING }
              },
              required: ["date", "description", "amount", "category"]
            }
          }
        },
        required: ["transactions"]
      }
    }
  });

  const parsed = JSON.parse(response.text!);
  const transactions = parsed.transactions || [];

  // Generate CSV rows
  const header = "Date,Description,Amount,Category,Balance,notes";
  const rows = transactions.map((t: any) => [
    t.date,
    \`"\${t.description.replace(/"/g, '""')}"\`,
    t.amount.toFixed(2),
    t.category,
    t.balance !== null && t.balance !== undefined ? t.balance.toFixed(2) : "",
    \`"\${(t.notes || "").replace(/"/g, '""')}"\`
  ].join(","));

  fs.writeFileSync(outputCsvPath, [header, ...rows].join("\\n"), "utf-8");
  console.log(\`Extracted \${transactions.length} transactions across \${filePaths.length} files to \${outputCsvPath}\`);
}
`;

  const promptText = `SYSTEM INSTRUCTION & OCR PROMPT SPECIFICATION:

Role: Expert Financial Document & Bank Statement OCR Parser.

Input: Multi-page PDF or high-resolution photo/scan of bank or credit card statements.

Output Format: Strict JSON response containing an array of transactions with exact keys:
- date: YYYY-MM-DD
- description: string (Merchant / Payee / ACH description)
- amount: number (POSITIVE for deposits/refunds/inflow, NEGATIVE for expenses/fees/outflow)
- category: string (groceries, dining, transport, salary, bills, shopping, health, entertainment, investment, transfer, fee, software, other)
- balance: number or null (running account balance on that row)
- notes: string (check #, reference ID, terminal ID, merchant location)

Exclusion Criteria:
1. Skip table header rows (Date, Description, Debits, Credits, Balance).
2. Skip summary cards & account overviews (Beginning Balance, Total Deposits, Total Withdrawals, Ending Balance).
3. Skip page numbers, bank footer disclaimers, fee schedules, interest calculation tables.
4. Skip pending or cancelled transaction drafts if labeled as non-posted.

Multi-page Handling:
- Process pages in sequence.
- Ensure no transactions at page junctions or headers are skipped or duplicated.
- Concatenate multi-line transaction descriptions into a single clean line.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Extraction Code & Instructions</h2>
              <p className="text-xs text-slate-400">
                Implementation code to run bank statement OCR with Gemini Vision in your own scripts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('python')}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition ${
                activeTab === 'python'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Python Script
            </button>
            <button
              onClick={() => setActiveTab('nodejs')}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition ${
                activeTab === 'nodejs'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Node.js / TypeScript
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition ${
                activeTab === 'prompt'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Prompt & System Instructions
            </button>
          </div>

          <button
            onClick={() => {
              const textToCopy =
                activeTab === 'python' ? pythonCode : activeTab === 'nodejs' ? nodeCode : promptText;
              handleCopy(textToCopy, activeTab);
            }}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 transition border border-slate-700 mb-2"
          >
            {copied === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Copy Code
              </>
            )}
          </button>
        </div>

        {/* Modal Body / Code View */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-950">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre overflow-x-auto select-all p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            {activeTab === 'python' && pythonCode}
            {activeTab === 'nodejs' && nodeCode}
            {activeTab === 'prompt' && promptText}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Uses Gemini Vision with native PDF and image parsing capabilities.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
