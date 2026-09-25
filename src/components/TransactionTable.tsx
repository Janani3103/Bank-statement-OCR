import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Plus, Trash2, ArrowUpDown, ArrowUp, ArrowDown, 
  Check, Edit2, X, Tag
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/csv';

interface TransactionTableProps {
  transactions: Transaction[];
  currency: string;
  onUpdateTransaction: (updated: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddTransaction: (newTx: Transaction) => void;
}

type SortField = 'date' | 'description' | 'amount' | 'category' | 'balance';
type SortDirection = 'asc' | 'desc';

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  groceries: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  dining: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  transport: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  salary: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  bills: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  shopping: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  entertainment: { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
  health: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  investment: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
  transfer: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  fee: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  software: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  other: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
};

const STANDARD_CATEGORIES = [
  'groceries', 'dining', 'transport', 'salary', 'bills', 
  'shopping', 'entertainment', 'health', 'investment', 
  'transfer', 'fee', 'software', 'other'
];

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  currency,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Transaction | null>(null);

  // Available unique categories
  const categoriesInList = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category.toLowerCase());
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & Sort Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDesc = t.description.toLowerCase().includes(q);
          const matchNotes = t.notes.toLowerCase().includes(q);
          const matchDate = t.date.includes(q);
          const matchCat = t.category.toLowerCase().includes(q);
          if (!matchDesc && !matchNotes && !matchDate && !matchCat) return false;
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (t.category.toLowerCase() !== selectedCategory) return false;
        }

        // Type filter (Inflow / Outflow)
        if (typeFilter === 'inflow' && t.amount <= 0) return false;
        if (typeFilter === 'outflow' && t.amount >= 0) return false;

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'date') {
          comp = a.date.localeCompare(b.date);
        } else if (sortField === 'description') {
          comp = a.description.localeCompare(b.description);
        } else if (sortField === 'amount') {
          comp = a.amount - b.amount;
        } else if (sortField === 'category') {
          comp = (a.category || '').localeCompare(b.category || '');
        } else if (sortField === 'balance') {
          const balA = a.balance !== null ? a.balance : -Infinity;
          const balB = b.balance !== null ? b.balance : -Infinity;
          comp = balA - balB;
        }
        return sortDirection === 'asc' ? comp : -comp;
      });
  }, [transactions, searchQuery, selectedCategory, typeFilter, sortField, sortDirection]);

  // Editing Row logic
  const startEditing = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditFormData({ ...tx });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const saveEditing = () => {
    if (editFormData) {
      onUpdateTransaction(editFormData);
      setEditingId(null);
      setEditFormData(null);
    }
  };

  const handleAddNewRow = () => {
    const today = new Date().toISOString().split('T')[0];
    const newTx: Transaction = {
      id: `manual-${Date.now()}`,
      date: today,
      description: 'New Transaction',
      amount: -10.00,
      category: 'other',
      balance: null,
      notes: '',
    };
    onAddTransaction(newTx);
    startEditing(newTx);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Control Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Search input */}
        <div className="flex flex-1 items-center space-x-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search description, notes, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categoriesInList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Inflow / Outflow Filter */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-md transition ${
                typeFilter === 'all'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('inflow')}
              className={`px-2.5 py-1 rounded-md transition ${
                typeFilter === 'inflow'
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Deposits (+)
            </button>
            <button
              onClick={() => setTypeFilter('outflow')}
              className={`px-2.5 py-1 rounded-md transition ${
                typeFilter === 'outflow'
                  ? 'bg-rose-500/20 text-rose-400 font-medium'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Expenses (-)
            </button>
          </div>
        </div>

        {/* Right: Add Row and Count */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredTransactions.length}</strong> of{' '}
            <strong className="text-white">{transactions.length}</strong>
          </span>
          <button
            onClick={handleAddNewRow}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Row
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <th className="py-3 px-4 w-32 cursor-pointer hover:text-white select-none" onClick={() => handleSort('date')}>
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {sortField === 'date' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 min-w-[200px] cursor-pointer hover:text-white select-none" onClick={() => handleSort('description')}>
                <div className="flex items-center space-x-1">
                  <span>Description</span>
                  {sortField === 'description' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 w-36 text-right cursor-pointer hover:text-white select-none" onClick={() => handleSort('amount')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Amount</span>
                  {sortField === 'amount' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 w-36 cursor-pointer hover:text-white select-none" onClick={() => handleSort('category')}>
                <div className="flex items-center space-x-1">
                  <span>Category</span>
                  {sortField === 'category' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 w-32 text-right cursor-pointer hover:text-white select-none" onClick={() => handleSort('balance')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Balance</span>
                  {sortField === 'balance' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 min-w-[160px]">Notes</th>
              <th className="py-3 px-3 w-16 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-xs">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No transactions match your search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isEditing = editingId === tx.id;
                const catStyle = CATEGORY_COLORS[tx.category.toLowerCase()] || CATEGORY_COLORS['other'];

                if (isEditing && editFormData) {
                  return (
                    <tr key={tx.id} className="bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={editFormData.date}
                          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                          placeholder="YYYY-MM-DD"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.amount}
                          onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs text-right font-mono focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={editFormData.category}
                          onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:border-emerald-500 capitalize"
                        >
                          {STANDARD_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.balance !== null ? editFormData.balance : ''}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              balance: e.target.value === '' ? null : parseFloat(e.target.value),
                            })
                          }
                          placeholder="Optional"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs text-right font-mono focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={editFormData.notes}
                          onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                          placeholder="Notes or ref #"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={saveEditing}
                            className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const isDeposit = tx.amount > 0;

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-800/30 transition group cursor-default"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {tx.date || '—'}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-slate-100 font-medium">
                      <div className="flex items-center justify-between">
                        <span>{tx.description}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td
                      className={`py-3 px-4 text-right font-mono font-semibold whitespace-nowrap ${
                        isDeposit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(tx.amount, currency)}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${catStyle.bg} ${catStyle.text} ${catStyle.border} capitalize`}
                      >
                        {tx.category || 'other'}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="py-3 px-4 text-right font-mono text-slate-400 whitespace-nowrap">
                      {tx.balance !== null && tx.balance !== undefined
                        ? `$${tx.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '—'}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate text-[11px]">
                      {tx.notes || <span className="text-slate-600 italic">None</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => startEditing(tx)}
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
