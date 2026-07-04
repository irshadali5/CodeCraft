import { X, CheckCircle2, AlertCircle, FileText, FileCode, FileArchive } from 'lucide-react';
import { useFileStore } from '@/hooks/useFileStore';
import type { ExportProgress } from '@/types';
import { cn } from '@/lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: ExportProgress | null;
  isComplete: boolean;
  error: string | null;
}

export function ExportModal({ isOpen, onClose, progress, isComplete, error }: ExportModalProps) {
  if (!isOpen) return null;
  
  const { settings } = useFileStore();
  const format = settings.format;
  
  const formatIcon = {
    pdf: <FileText className="w-8 h-8" />,
    markdown: <FileCode className="w-8 h-8" />,
    zip: <FileArchive className="w-8 h-8" />,
  }[format];
  
  const formatColor = {
    pdf: 'text-red-400 bg-red-500/10',
    markdown: 'text-blue-400 bg-blue-500/10',
    zip: 'text-amber-400 bg-amber-500/10',
  }[format];
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isComplete || error ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-[420px] bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            {isComplete ? 'Export Complete' : error ? 'Export Failed' : 'Exporting...'}
          </h3>
          {(isComplete || error) && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="px-6 py-6">
          {error ? (
            <ErrorState error={error} onClose={onClose} />
          ) : isComplete ? (
            <SuccessState format={format} onClose={onClose} />
          ) : (
            <ProgressState 
              progress={progress} 
              formatIcon={formatIcon}
              formatColor={formatColor}
              format={format}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressState({ 
  progress, 
  formatIcon, 
  formatColor,
  format 
}: { 
  progress: ExportProgress | null;
  formatIcon: React.ReactNode;
  formatColor: string;
  format: string;
}) {
  const percentage = progress?.percentage || 0;
  const steps = [
    'Collecting files...',
    'Processing content...',
    'Applying syntax highlighting...',
    'Generating document...',
    'Finalizing export...',
  ];
  
  return (
    <div className="space-y-5">
      {/* Icon */}
      <div className="flex justify-center">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", formatColor)}>
          {formatIcon}
        </div>
      </div>
      
      {/* Title */}
      <div className="text-center">
        <h4 className="text-base font-medium text-slate-200 mb-1">
          Exporting {format.toUpperCase()}
        </h4>
        <p className="text-sm text-slate-500">
          {progress?.message || 'Preparing...'}
        </p>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>{percentage}%</span>
          <span>{progress?.step || 0} of {progress?.totalSteps || 5} steps</span>
        </div>
      </div>
      
      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors duration-200",
              (progress?.step || 0) > index ? "text-cyan-400" : "text-slate-600"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
              (progress?.step || 0) > index 
                ? "bg-cyan-500/20" 
                : "bg-slate-800"
            )}>
              {(progress?.step || 0) > index ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              )}
            </div>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessState({ format, onClose }: { format: string; onClose: () => void }) {
  return (
    <div className="space-y-5">
      {/* Success icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
      </div>
      
      {/* Title */}
      <div className="text-center">
        <h4 className="text-base font-medium text-slate-200 mb-1">
          Export Successful!
        </h4>
        <p className="text-sm text-slate-500">
          Your {format.toUpperCase()} file has been downloaded
        </p>
      </div>
      
      {/* Action */}
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg text-sm transition-colors"
      >
        Done
      </button>
    </div>
  );
}

function ErrorState({ error, onClose }: { error: string; onClose: () => void }) {
  return (
    <div className="space-y-5">
      {/* Error icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
      </div>
      
      {/* Title */}
      <div className="text-center">
        <h4 className="text-base font-medium text-slate-200 mb-1">
          Export Failed
        </h4>
        <p className="text-sm text-red-400/80">
          {error}
        </p>
      </div>
      
      {/* Action */}
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-sm transition-colors"
      >
        Close
      </button>
    </div>
  );
}
