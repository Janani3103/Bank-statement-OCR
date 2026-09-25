import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High payload limits to accommodate multiple multi-page PDFs and high-res image scans
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  balance: number | null;
  notes: string;
}

export interface StatementMetadata {
  bankName?: string;
  accountNumber?: string;
  statementPeriod?: string;
  currency?: string;
  totalPagesProcessed?: number;
  confidenceScore?: number;
}

// Extraction endpoint
app.post('/api/extract-statement', async (req, res) => {
  try {
    const { files, modelChoice, options } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one PDF or image file.' });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please set it in Settings > Secrets.',
      });
    }

    // Default to gemini-3.8-flash for vision extraction
    const selectedModel = modelChoice === 'gemini-3.1-pro-preview' ? 'gemini-3.1-pro-preview' : 'gemini-3.8-flash';

    // Prepare contents parts
    const parts: any[] = [];
    const validFileNames: string[] = [];

    for (const file of files) {
      if (!file.data || !file.mimeType) continue;
      // Strip potential data URL prefix if sent
      const cleanBase64 = file.data.includes('base64,') ? file.data.split('base64,')[1] : file.data;
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: cleanBase64,
        },
      });
      validFileNames.push(file.name || 'document');
    }

    if (parts.length === 0) {
      return res.status(400).json({ error: 'No valid file data received.' });
    }

    const isMultiFile = parts.length > 1;

    const extractionPrompt = `
You are a specialized financial document OCR parser for bank statements, credit card statements, and financial accounts.
Your mission is to extract EVERY valid transaction row from the provided document(s) with 100% precision.

${isMultiFile ? `
IMPORTANT - MULTI-FILE / MULTI-PAGE ANALYSIS INSTRUCTIONS:
- The user has uploaded ${parts.length} files/pages: ${validFileNames.join(', ')}.
- These files may be individual page scans (e.g. Page 1, Page 2, Page 3 in PNG/JPEG format), multiple PDF files, or a mix of PDFs and images covering a multi-page statement or consecutive statement periods.
- You MUST thoroughly scan and parse transactions from EVERY single uploaded file and page in the order provided.
- Do NOT stop parsing after the first file or page.
- Consolidate all extracted transactions across ALL uploaded files into a single unified chronological list.
- If overlapping transactions appear between adjacent page boundaries, reconcile and deduplicate them so each unique transaction is recorded once.
- Maintain running balances across pages where available.
` : `
IMPORTANT - MULTI-PAGE PDF/DOCUMENT ACCURACY:
- If this document contains multiple pages, parse all pages sequentially from first to last without skipping any transactions.
`}

EXTRACTION INSTRUCTIONS & RULES:
1. Target Columns:
   - Date: STRICT format YYYY-MM-DD. Standardize month names (e.g., "Jan 14", "14/01/2025", "01-14-25" -> "2025-01-14"). If year is missing on individual transaction lines, determine the year from the statement header or statement date range.
   - Description: The clear merchant name, payee, or transaction description (e.g. "Trader Joe's", "Payroll Direct Deposit ACME Corp", "Uber Trip Help.Uber.Com").
   - Amount: CRITICAL SIGN RULE:
     * Deposits, credits, payroll, refunds, incoming wire transfers MUST be POSITIVE numbers (e.g., 2500.00, 45.20).
     * Expenses, purchases, withdrawals, payments, service charges, debits, ATM cash withdrawals MUST be NEGATIVE numbers (e.g., -84.32, -15.00).
     * If an amount is listed in a "Withdrawals", "Debits", "Payments", or "Charges" column, or displayed in parentheses like (45.00) or with CR/DR suffixes, apply the negative sign correctly.
   - Category: Automatically categorize the transaction into one of these standard tags:
     * groceries (supermarkets, food marts, Costco, Trader Joe's)
     * dining (restaurants, cafes, fast food, coffee shops, delivery)
     * transport (gas, ride sharing, public transit, flights, parking, tolls)
     * salary (payroll, employer deposits, direct deposits)
     * bills (electric, water, gas, internet, phone, insurance)
     * shopping (retail, electronics, clothing, Amazon, home goods)
     * entertainment (movies, concerts, games, streaming Netflix/Spotify)
     * health (pharmacy, doctor, gym, fitness, dental)
     * investment (brokerage, dividends, interest earned, stocks)
     * transfer (internal account transfers, Zelle, Venmo, card payments)
     * fee (overdraft fee, monthly maintenance, ATM surcharge, late fee)
     * software (subscriptions, cloud hosting, SaaS)
     * other (any unclassified transaction)
   - Balance: The running balance on that specific row if provided in the statement; if none is present, set to null.
   - Notes: Additional transaction details if present (e.g., check number, transaction ID/reference code, merchant location city/state, foreign currency details).

2. ROWS TO EXCLUDE:
   - DO NOT extract table headers ("Date", "Description", "Debits", "Credits", "Balance").
   - DO NOT extract summary blocks ("Beginning Balance", "Starting Balance", "Total Deposits", "Total Withdrawals", "Ending Balance", "Interest Summary").
   - DO NOT extract page headers, footers, page numbering, promotional ads, or disclosures.

3. MULTI-PAGE ACCURACY:
   - Parse all pages sequentially without skipping or repeating any transaction.
   - If a transaction spans across page breaks or multiple lines, combine the description into a single coherent entry.
`;

    parts.push({ text: extractionPrompt });

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: { parts },
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bankName: {
              type: Type.STRING,
              description: 'Name of the bank or financial institution (e.g., Chase, Bank of America, Wells Fargo)',
            },
            accountNumber: {
              type: Type.STRING,
              description: 'Masked account number (e.g. ************4821)',
            },
            statementPeriod: {
              type: Type.STRING,
              description: 'Statement period date range (e.g. Jan 01, 2025 - Jan 31, 2025)',
            },
            currency: {
              type: Type.STRING,
              description: 'Currency code or symbol (e.g., USD, EUR, GBP)',
            },
            transactions: {
              type: Type.ARRAY,
              description: 'All extracted transactions in chronological order',
              items: {
                type: Type.OBJECT,
                properties: {
                  date: {
                    type: Type.STRING,
                    description: 'Transaction date strictly formatted as YYYY-MM-DD',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'Transaction description or merchant name',
                  },
                  amount: {
                    type: Type.NUMBER,
                    description: 'Positive number for deposits/credits, negative number for expenses/withdrawals',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Categorized category (groceries, dining, transport, salary, bills, shopping, health, entertainment, investment, transfer, fee, software, other)',
                  },
                  balance: {
                    type: Type.NUMBER,
                    description: 'Running account balance after this transaction, or null if omitted in statement',
                  },
                  notes: {
                    type: Type.STRING,
                    description: 'Optional notes like check #, reference code, city/location',
                  },
                },
                required: ['date', 'description', 'amount', 'category'],
              },
            },
          },
          required: ['transactions'],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini returned an empty response. Please check the uploaded document quality.');
    }

    const parsedData = JSON.parse(responseText);

    return res.json({
      success: true,
      modelUsed: selectedModel,
      bankName: parsedData.bankName || 'Detected Statement',
      accountNumber: parsedData.accountNumber || '',
      statementPeriod: parsedData.statementPeriod || '',
      currency: parsedData.currency || 'USD',
      transactions: parsedData.transactions || [],
      count: parsedData.transactions ? parsedData.transactions.length : 0,
      filesCount: parts.length,
      fileNames: validFileNames,
    });
  } catch (error: any) {
    console.error('Error in /api/extract-statement:', error);
    return res.status(500).json({
      error: error.message || 'Failed to extract transactions from the document. Please try a clearer image or PDF.',
    });
  }
});

// Provide extraction code snippet & instructions for developers/users
app.get('/api/extraction-instructions', (req, res) => {
  res.json({
    pythonCode: `# Python Extraction Code using Google GenAI SDK
from google import genai
from google.genai import types
import json

client = genai.Client()

def extract_bank_statement(file_path: str, mime_type: str = "application/pdf"):
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=[
            types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
            "Extract all bank transactions into a CSV format with columns: Date, Description, Amount, Category, Balance, notes. Ensure dates are YYYY-MM-DD, positive for deposits, negative for expenses."
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1
        )
    )
    return json.loads(response.text)
`,
    nodeCode: `// Node.js Extraction Code using @google/genai SDK
import { GoogleGenAI, Type } from "@google/genai";
import * as fs from "fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function extractStatement(filePath, mimeType = "application/pdf") {
  const fileBase64 = fs.readFileSync(filePath, { encoding: "base64" });

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: {
      parts: [
        { inlineData: { mimeType, data: fileBase64 } },
        { text: "Extract all transaction rows. Date format YYYY-MM-DD. Amount positive for deposits, negative for expenses. Auto-categorize each row. Exclude headers and totals." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      temperature: 0.1
    }
  });

  return JSON.parse(response.text);
}
`,
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
