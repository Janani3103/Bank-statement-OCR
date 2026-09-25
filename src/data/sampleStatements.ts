import { Transaction, StatementExtractionResult } from '../types';

export interface SampleStatementPreset {
  id: string;
  name: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  statementPeriod: string;
  currency: string;
  description: string;
  badge: string;
  pageCount: number;
  transactions: Transaction[];
  documentTextPreview: string;
}

export const SAMPLE_STATEMENTS: SampleStatementPreset[] = [
  {
    id: 'chase-checking-2025',
    name: 'Personal Checking Statement',
    bankName: 'JPMorgan Chase Bank',
    accountType: 'Total Checking',
    accountNumber: '****3892',
    statementPeriod: '2025-01-01 to 2025-01-31',
    currency: 'USD',
    badge: '14 Transactions',
    pageCount: 2,
    description: 'Personal account statement with payroll deposits, grocery expenses, utility bills, subscriptions, and dining.',
    documentTextPreview: `JPMorgan Chase Bank, N.A.
P.O. Box 182051, Columbus, OH 43218
Account Statement: Total Checking (ending in 3892)
Statement Period: Jan 01, 2025 through Jan 31, 2025

SUMMARY:
Beginning Balance: $4,210.50
Total Deposits: +$7,340.00
Total Withdrawals: -$3,812.35
Ending Balance: $7,738.15

TRANSACTION DETAIL:
01/02  DIRECT DEPOSIT - ACME CORP PAYROLL        $3,670.00    $7,880.50
01/03  WHOLE FOODS MARKET #1042 SAN FRANCISCO       -$124.60    $7,755.90
01/04  CHEVRON 0092144 GAS & OIL                     -$52.40    $7,703.50
01/06  PACIFIC GAS & ELECTRIC UTILITY BILL          -$185.30    $7,518.20
01/08  UBER TRIP HELP.UBER.COM                      -$28.50    $7,489.70
01/10  SWEETGREEN SOMA DINING                        -$19.85    $7,469.85
01/12  NETFLIX.COM STREAMING SUBSCRIPTION            -$17.99    $7,451.86
01/15  DIRECT DEPOSIT - ACME CORP PAYROLL        $3,670.00   $11,121.86
01/16  CHASE ATM CASH WITHDRAWAL #4812              -$200.00   $10,921.86
01/18  TRADER JOE'S GROCERY #554                     -$88.40   $10,833.46
01/21  BLUE BOTTLE COFFEE DINING                     -$11.50   $10,821.96
01/24  AMAZON.COM*DIGITAL SHOPPING                   -$64.90   $10,757.06
01/27  KAISER PERMANENTE HEALTH COPAY                -$45.00   $10,712.06
01/30  CON EDISON HOME FIBER INTERNET                -$85.00   $10,627.06`,
    transactions: [
      {
        id: 'tx-1',
        date: '2025-01-02',
        description: 'Direct Deposit - ACME Corp Payroll',
        amount: 3670.00,
        category: 'salary',
        balance: 7880.50,
        notes: 'ACH Direct Deposit PPD ID: 94821',
      },
      {
        id: 'tx-2',
        date: '2025-01-03',
        description: "Whole Foods Market #1042 San Francisco",
        amount: -124.60,
        category: 'groceries',
        balance: 7755.90,
        notes: 'POS Debit Card Purchase Term #1042',
      },
      {
        id: 'tx-3',
        date: '2025-01-04',
        description: 'Chevron 0092144 Gas & Oil',
        amount: -52.40,
        category: 'transport',
        balance: 7703.50,
        notes: 'Pump 04 authorization',
      },
      {
        id: 'tx-4',
        date: '2025-01-06',
        description: 'Pacific Gas & Electric Utility Bill',
        amount: -185.30,
        category: 'bills',
        balance: 7518.20,
        notes: 'Monthly electric and gas utility debit',
      },
      {
        id: 'tx-5',
        date: '2025-01-08',
        description: 'Uber Trip Help.Uber.Com',
        amount: -28.50,
        category: 'transport',
        balance: 7489.70,
        notes: 'Rideshare SFO to Downtown',
      },
      {
        id: 'tx-6',
        date: '2025-01-10',
        description: 'Sweetgreen SoMa Dining',
        amount: -19.85,
        category: 'dining',
        balance: 7469.85,
        notes: 'Lunch contactless payment',
      },
      {
        id: 'tx-7',
        date: '2025-01-12',
        description: 'Netflix.com Streaming Subscription',
        amount: -17.99,
        category: 'entertainment',
        balance: 7451.86,
        notes: 'Monthly recurring standard plan',
      },
      {
        id: 'tx-8',
        date: '2025-01-15',
        description: 'Direct Deposit - ACME Corp Payroll',
        amount: 3670.00,
        category: 'salary',
        balance: 11121.86,
        notes: 'ACH Direct Deposit PPD ID: 94821',
      },
      {
        id: 'tx-9',
        date: '2025-01-16',
        description: 'Chase ATM Cash Withdrawal #4812',
        amount: -200.00,
        category: 'other',
        balance: 10921.86,
        notes: 'ATM Market St branch ref 4812',
      },
      {
        id: 'tx-10',
        date: '2025-01-18',
        description: "Trader Joe's Grocery #554",
        amount: -88.40,
        category: 'groceries',
        balance: 10833.46,
        notes: 'In-store chip debit card',
      },
      {
        id: 'tx-11',
        date: '2025-01-21',
        description: 'Blue Bottle Coffee Dining',
        amount: -11.50,
        category: 'dining',
        balance: 10821.96,
        notes: 'Artisan roast cafe',
      },
      {
        id: 'tx-12',
        date: '2025-01-24',
        description: 'Amazon.com*Digital Shopping',
        amount: -64.90,
        category: 'shopping',
        balance: 10757.06,
        notes: 'Order #114-9982410-12',
      },
      {
        id: 'tx-13',
        date: '2025-01-27',
        description: 'Kaiser Permanente Health Copay',
        amount: -45.00,
        category: 'health',
        balance: 10712.06,
        notes: 'Medical clinic copayment',
      },
      {
        id: 'tx-14',
        date: '2025-01-30',
        description: 'Con Edison Home Fiber Internet',
        amount: -85.00,
        category: 'bills',
        balance: 10627.06,
        notes: 'Gigabit broadband auto-pay',
      },
    ],
  },
  {
    id: 'bofa-business-2025',
    name: 'Small Business Operating Account',
    bankName: 'Bank of America',
    accountType: 'Business Advantage Checking',
    accountNumber: '****9104',
    statementPeriod: '2025-02-01 to 2025-02-28',
    currency: 'USD',
    badge: 'Multi-Page Statement',
    pageCount: 3,
    description: 'Commercial bank statement featuring client invoice deposits, SaaS subscriptions, rent, and merchant payouts.',
    documentTextPreview: `BANK OF AMERICA BUSINESS ADVANTAGE
Account # ending in 9104 | Page 1 of 3
Statement Date: February 28, 2025

DEPOSITS & ADDITIONS:
02/03  CLIENT WIRE - NEXUS TECH CONSULTING      +$5,400.00
02/10  STRIPE PAYOUT MERCHANT TRANSFER          +$3,250.80
02/17  CLIENT WIRE - HORIZON VENTURES RETAINER  +$6,800.00
02/24  STRIPE PAYOUT MERCHANT TRANSFER          +$2,940.15

WITHDRAWALS & DEBITS:
02/01  REGUS OFFICE RENT LEASE                   -$1,850.00
02/04  AMAZON WEB SERVICES CLOUD HOSTING           -$482.10
02/05  GITHUB TEAM SUBSCRIPTION                     -$42.00
02/09  GOOGLE WORKSPACE CLOUD SEATS                 -$72.00
02/12  FEDEX OFFICE EXPRESS SHIPPING                -$64.25
02/14  DELTA AIRLINES SFO-JFK FLIGHT TICKET        -$584.20
02/18  SLACK TECHNOLOGIES ANNUAL SEATS             -$360.00
02/22  STAPLES COMMERCIAL OFFICE SUPPLIES          -$138.90
02/26  BANK MONTHLY ACCOUNT MAINTENANCE FEE         -$29.95`,
    transactions: [
      {
        id: 'biz-1',
        date: '2025-02-01',
        description: 'Regus Office Rent Lease',
        amount: -1850.00,
        category: 'bills',
        balance: 24150.00,
        notes: 'Commercial lease suites 400',
      },
      {
        id: 'biz-2',
        date: '2025-02-03',
        description: 'Client Wire - Nexus Tech Consulting',
        amount: 5400.00,
        category: 'salary',
        balance: 29550.00,
        notes: 'Invoice #INV-2025-014 wire received',
      },
      {
        id: 'biz-3',
        date: '2025-02-04',
        description: 'Amazon Web Services Cloud Hosting',
        amount: -482.10,
        category: 'software',
        balance: 29067.90,
        notes: 'AWS Account 88129-us-west-2',
      },
      {
        id: 'biz-4',
        date: '2025-02-05',
        description: 'GitHub Team Subscription',
        amount: -42.00,
        category: 'software',
        balance: 29025.90,
        notes: 'Team plan dev accounts',
      },
      {
        id: 'biz-5',
        date: '2025-02-09',
        description: 'Google Workspace Cloud Seats',
        amount: -72.00,
        category: 'software',
        balance: 28953.90,
        notes: 'Business Standard 6 users',
      },
      {
        id: 'biz-6',
        date: '2025-02-10',
        description: 'Stripe Payout Merchant Transfer',
        amount: 3250.80,
        category: 'transfer',
        balance: 32204.70,
        notes: 'Batch settlement STRIPE-PO-9912',
      },
      {
        id: 'biz-7',
        date: '2025-02-12',
        description: 'FedEx Office Express Shipping',
        amount: -64.25,
        category: 'transport',
        balance: 32140.45,
        notes: 'Overnight client contracts shipment',
      },
      {
        id: 'biz-8',
        date: '2025-02-14',
        description: 'Delta Airlines SFO-JFK Flight Ticket',
        amount: -584.20,
        category: 'transport',
        balance: 31556.25,
        notes: 'Client summit flight booking',
      },
      {
        id: 'biz-9',
        date: '2025-02-17',
        description: 'Client Wire - Horizon Ventures Retainer',
        amount: 6800.00,
        category: 'salary',
        balance: 38356.25,
        notes: 'Q1 technical advisory retainer',
      },
      {
        id: 'biz-10',
        date: '2025-02-18',
        description: 'Slack Technologies Annual Seats',
        amount: -360.00,
        category: 'software',
        balance: 37996.25,
        notes: 'Annual Pro workspace renewal',
      },
      {
        id: 'biz-11',
        date: '2025-02-22',
        description: 'Staples Commercial Office Supplies',
        amount: -138.90,
        category: 'shopping',
        balance: 37857.35,
        notes: 'Printers toner & supplies',
      },
      {
        id: 'biz-12',
        date: '2025-02-24',
        description: 'Stripe Payout Merchant Transfer',
        amount: 2940.15,
        category: 'transfer',
        balance: 40797.50,
        notes: 'Batch settlement STRIPE-PO-9945',
      },
      {
        id: 'biz-13',
        date: '2025-02-26',
        description: 'Bank Monthly Account Maintenance Fee',
        amount: -29.95,
        category: 'fee',
        balance: 40767.55,
        notes: 'Analyzed business checking charge',
      },
    ],
  },
];
