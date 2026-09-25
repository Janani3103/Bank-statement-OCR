import React from 'react';
import { ArrowDownRight, ArrowUpRight, DollarSign, Layers, PieChart } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/csv';

interface AnalyticsSummaryProps {
  transactions: Transaction[];
  currency: string;
}

export const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ transactions, currency }) => {
  const totalDeposits = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netCashflow = totalDeposits - totalExpenses;

  // Category breakdown
  const categoryMap: { [cat: string]: number } = {};
  transactions
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      const cat = (t.category || 'other').toLowerCase();
      categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(t.amount);
    });

  const sortedCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Deposits */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Deposits (Inflow)</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-400">
          {formatCurrency(totalDeposits, currency)}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {transactions.filter((t) => t.amount > 0).length} positive deposit rows
        </div>
      </div>

      {/* Total Expenses */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Expenses (Outflow)</span>
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-rose-400">
          {formatCurrency(-totalExpenses, currency)}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {transactions.filter((t) => t.amount < 0).length} expense / withdrawal rows
        </div>
      </div>

      {/* Net Cash Flow */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Net Cash Flow</span>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            netCashflow >= 0 ? 'bg-teal-500/10 text-teal-400' : 'bg-amber-500/10 text-amber-400'
          }`}>
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-teal-400' : 'text-amber-400'}`}>
          {formatCurrency(netCashflow, currency)}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {transactions.length} total extracted rows
        </div>
      </div>

      {/* Top Expense Categories */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Top Spending</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1.5">
          {sortedCategories.length > 0 ? (
            sortedCategories.map(([cat, amount]) => {
              const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
              return (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 capitalize truncate max-w-[100px]">{cat}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-mono text-[11px]">${amount.toFixed(0)}</span>
                    <span className="text-slate-500 text-[10px] w-7 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-slate-500 py-1">No expense data</div>
          )}
        </div>
      </div>
    </div>
  );
};
