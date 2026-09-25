import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Image as ImageIcon, X, AlertCircle, Loader2, 
  Sparkles, CheckCircle2, ArrowRight, FileCheck, Plus, ArrowUp, ArrowDown, 
  Layers, ArrowDownUp, Info
} from 'lucide-react';
import { UploadedFileItem } from '../types';
import { SAMPLE_STATEMENTS, SampleStatementPreset } from '../data/sampleStatements';

interface StatementUploaderProps {
  onExtract: (files: UploadedFileItem[], modelChoice: string) => Promise<void>;
  onSelectSample: (preset: SampleStatementPreset) => void;
  isLoading: boolean;
  loadingStep: string;
}

export const StatementUploader: React.FC<StatementUploaderProps> = ({
  onExtract,
  onSelectSample,
  isLoading,
  loadingStep,
}) => {
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useState<'gemini-3.8-flash' | 'gemini-3.1-pro-preview'>('gemini-3.8-flash');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMimeType = (file: File): string => {
    if (file.type) return file.type;
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.png')) return 'image/png';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
    if (name.endsWith('.webp')) return 'image/webp';
    return 'application/octet-stream';
  };

  const handleFileProcess = async (selectedFiles: FileList | File[]) => {
    setErrorMessage(null);
    const newItems: UploadedFileItem[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const mime = getMimeType(file);

      // Validate format
      const isPdf = mime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = mime.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);

      if (!isPdf && !isImage) {
        setErrorMessage(`Unsupported format: "${file.name}". Please upload PDF or image files (PNG, JPG, JPEG, WEBP).`);
        continue;
      }

      // Read file as base64 for upload
      try {
        const base64Data = await readFileAsBase64(file);
        const previewUrl = isImage ? URL.createObjectURL(file) : '';

        newItems.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          type: mime,
          previewUrl,
          base64Data,
        });
      } catch (err) {
        console.error('File read error:', err);
      }
    }

    if (newItems.length > 0) {
      setFiles((prev) => [...prev, ...newItems]);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleMoveFile = (index: number, direction: 'up' | 'down') => {
    setFiles((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleSortByName = () => {
    setFiles((prev) => {
      return [...prev].sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
    });
  };

  const handleStartExtraction = () => {
    if (files.length === 0) {
      setErrorMessage('Please upload at least one bank statement PDF or image.');
      return;
    }
    onExtract(files, modelChoice);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const pdfCount = files.filter((f) => f.type.includes('pdf') || f.name.toLowerCase().endsWith('.pdf')).length;
  const imgCount = files.length - pdfCount;
  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Bank Statement OCR Ingestion</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Multi-File & Multi-Page Supported
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload multiple PDFs, multiple PNG/JPG image scans, or a mixed batch. Gemini Vision analyzes all files and merges the full statement into a single CSV.
          </p>
        </div>

        {/* Model Selector */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 px-2 flex items-center">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 mr-1" />
            Vision Engine:
          </span>
          <button
            type="button"
            onClick={() => setModelChoice('gemini-3.8-flash')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              modelChoice === 'gemini-3.8-flash'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gemini 3.8 Flash
          </button>
        </div>
      </div>

      {/* Hidden File Input allowing multiple files selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFileProcess(e.target.files);
          // Reset value so user can re-upload identical filename if needed
          e.target.value = '';
        }}
      />

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-6 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-500/5'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700/60 flex items-center justify-center text-slate-300 mb-3 shadow-inner">
          <Upload className="w-6 h-6 text-emerald-400" />
        </div>

        <p className="text-sm font-semibold text-slate-200">
          Upload single or multiple statement files (PDF, PNG, JPG)
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-lg">
          Select or drag multiple files at once (e.g. <strong className="text-slate-300">page_1.png, page_2.png, page_3.png</strong> or multiple statement <strong className="text-slate-300">PDFs</strong>). You can also add more files below anytime.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Multi-file consolidation
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Auto-skips headers & totals
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Auto-categorizes transactions
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Cross-page deduplication
          </span>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Uploaded Files Staging Area */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          {/* Batch Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-semibold text-slate-200">
                Staged Files for OCR ({files.length}):
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {formatFileSize(totalSizeBytes)} total
              </span>
              <span className="text-[11px] text-slate-400">
                ({pdfCount > 0 ? `${pdfCount} PDF${pdfCount > 1 ? 's' : ''}` : ''}
                {pdfCount > 0 && imgCount > 0 ? ', ' : ''}
                {imgCount > 0 ? `${imgCount} Image${imgCount > 1 ? 's' : ''}` : ''})
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              {files.length > 1 && (
                <button
                  type="button"
                  onClick={handleSortByName}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                  title="Sort files alphabetically (e.g. Page 1, Page 2, Page 3)"
                >
                  <ArrowDownUp className="w-3 h-3 mr-1 text-teal-400" />
                  Sort by Name
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 font-medium transition"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add More Files
              </button>

              <button
                type="button"
                onClick={() => setFiles([])}
                className="text-slate-400 hover:text-rose-400 transition px-2 py-1"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Multi-file Notice */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                All <strong>{files.length}</strong> file{files.length > 1 ? 's' : ''} will be analyzed in sequence below and merged into a single consolidated transaction table.
              </span>
            </div>
            {files.length > 1 && (
              <span className="text-[11px] text-slate-500 hidden md:inline">
                Use arrows to adjust page ordering
              </span>
            )}
          </div>

          {/* Staged Files Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {files.map((f, idx) => {
              const isPdf = f.type.includes('pdf') || f.name.toLowerCase().endsWith('.pdf');

              return (
                <div
                  key={f.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between group hover:border-slate-700 transition"
                >
                  <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                    {/* Index / Page Number */}
                    <span className="text-[10px] font-mono font-bold text-slate-500 w-4 shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Preview Thumbnail or PDF Icon */}
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/60 overflow-hidden flex items-center justify-center shrink-0">
                      {isPdf ? (
                        <FileText className="w-5 h-5 text-rose-400" />
                      ) : f.previewUrl ? (
                        <img
                          src={f.previewUrl}
                          alt={f.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-sky-400" />
                      )}
                    </div>

                    <div className="overflow-hidden min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate" title={f.name}>
                        {f.name}
                      </p>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                        <span className="uppercase font-mono">{isPdf ? 'PDF' : f.type.split('/')[1] || 'IMAGE'}</span>
                        <span>•</span>
                        <span>{formatFileSize(f.size)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Move Up, Move Down, Delete */}
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    {files.length > 1 && (
                      <div className="flex flex-col opacity-60 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => handleMoveFile(idx, 'up')}
                          disabled={idx === 0}
                          className="p-0.5 text-slate-400 hover:text-white disabled:opacity-20"
                          title="Move file earlier in sequence"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveFile(idx, 'down')}
                          disabled={idx === files.length - 1}
                          className="p-0.5 text-slate-400 hover:text-white disabled:opacity-20"
                          title="Move file later in sequence"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(f.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 transition rounded"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Ready to parse <strong className="text-white">{files.length}</strong> file{files.length > 1 ? 's' : ''} together.
            </span>

            <button
              onClick={handleStartExtraction}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-950" />
                  <span>{loadingStep || 'Extracting across all files with Gemini...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 text-slate-950" />
                  <span>
                    {files.length > 1
                      ? `Extract & Consolidate ${files.length} Files to CSV`
                      : 'Extract Statement to CSV'}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading Steps Indicator */}
      {isLoading && (
        <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-200">{loadingStep}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Reading layout, consolidating transactions across all pages, categorizing, and computing balances...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instant Test Presets */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center">
            <FileCheck className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
            Or Try with Pre-loaded Sample Statements (Instant):
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SAMPLE_STATEMENTS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectSample(preset)}
              disabled={isLoading}
              className="text-left bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3.5 transition group flex items-start justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition">
                    {preset.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {preset.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{preset.description}</p>
                <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono">
                  <span>{preset.bankName}</span>
                  <span>•</span>
                  <span>{preset.statementPeriod}</span>
                </div>
              </div>
              <span className="text-xs font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transition shrink-0 ml-3 pt-1">
                Load &rarr;
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
