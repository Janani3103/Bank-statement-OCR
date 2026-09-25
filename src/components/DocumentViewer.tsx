import React, { useState } from 'react';
import { Eye, FileText, ChevronDown, ChevronUp, Image as ImageIcon, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { UploadedFileItem } from '../types';

interface DocumentViewerProps {
  files: UploadedFileItem[];
  sampleTextPreview?: string;
  bankName?: string;
  statementPeriod?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  files,
  sampleTextPreview,
  bankName,
  statementPeriod,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const activeFile = files[selectedFileIndex] || files[0];

  if (files.length === 0 && !sampleTextPreview) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6 shadow-xl">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 bg-slate-900/90 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition select-none"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-200 flex items-center space-x-2">
              <span>Original Statement Source Files</span>
              {files.length > 1 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {files.length} Files Analyzed
                </span>
              )}
              {bankName && (
                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                  ({bankName} • {statementPeriod || 'Statement'})
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isExpanded
                ? 'Click to collapse source documents view'
                : files.length > 1
                ? `Click to inspect all ${files.length} uploaded statement files/pages`
                : 'Click to inspect original bank statement document'}
            </p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-white p-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-4">
          {/* Multi-file Navigation Bar */}
          {files.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-xs font-medium text-slate-300">
                  Inspecting File {selectedFileIndex + 1} of {files.length}:
                </span>
                <span className="text-xs font-mono text-emerald-400 truncate max-w-xs">
                  {activeFile?.name}
                </span>
              </div>

              <div className="flex items-center space-x-1 self-end sm:self-auto">
                <button
                  onClick={() => setSelectedFileIndex((prev) => Math.max(0, prev - 1))}
                  disabled={selectedFileIndex === 0}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded bg-slate-900 border border-slate-800"
                  title="Previous file"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] text-slate-500 font-mono px-2">
                  {selectedFileIndex + 1}/{files.length}
                </span>
                <button
                  onClick={() => setSelectedFileIndex((prev) => Math.min(files.length - 1, prev + 1))}
                  disabled={selectedFileIndex === files.length - 1}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded bg-slate-900 border border-slate-800"
                  title="Next file"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Multi-file Tab Bar */}
          {files.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-1">
              {files.map((f, idx) => {
                const isPdf = f.type.includes('pdf') || f.name.toLowerCase().endsWith('.pdf');
                const isSelected = selectedFileIndex === idx;

                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFileIndex(idx)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap border shrink-0 ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    {isPdf ? (
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    <span>Page/File #{idx + 1}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({isPdf ? 'PDF' : 'IMG'})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Preview Canvas */}
          {activeFile ? (
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900 flex items-center justify-center min-h-[300px] max-h-[600px] relative">
              {activeFile.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(activeFile.name) ? (
                <img
                  src={
                    activeFile.previewUrl ||
                    (activeFile.base64Data
                      ? `data:${activeFile.type || 'image/png'};base64,${activeFile.base64Data}`
                      : '')
                  }
                  alt={activeFile.name}
                  className="max-h-[580px] w-auto object-contain mx-auto"
                />
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <FileText className="w-14 h-14 mx-auto text-rose-400 mb-3 opacity-90" />
                  <p className="text-sm font-semibold text-slate-200">{activeFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Multi-page PDF document parsed directly by Gemini Vision multimodal parser.
                  </p>
                </div>
              )}
            </div>
          ) : sampleTextPreview ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
                <span>Statement Transcript & Layout:</span>
                <span className="text-[10px] text-emerald-400">Verified Layout</span>
              </div>
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {sampleTextPreview}
              </pre>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
