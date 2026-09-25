import React from 'react';
import { FileSpreadsheet, Code2, Sparkles, ShieldCheck, HelpCircle } from 'lucide-react';

interface NavbarProps {
  onOpenCodeModal: () => void;
  onOpenHelpModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCodeModal }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <FileSpreadsheet className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white text-base tracking-tight">StatementOCR</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Gemini Vision
              </span>
            </div>
            <p className="text-xs text-slate-400">Bank Statement PDF & Image to Clean CSV</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mr-1.5" />
            <span>Server-side AI • Privacy Secured</span>
          </div>

          <button
            onClick={onOpenCodeModal}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition shadow-sm"
          >
            <Code2 className="w-4 h-4 mr-1.5 text-teal-400" />
            Extraction Code
          </button>
        </div>
      </div>
    </header>
  );
};
