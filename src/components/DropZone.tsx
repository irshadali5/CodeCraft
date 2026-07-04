import { useCallback, useState } from 'react';
import { Upload, FolderOpen, FilePlus } from 'lucide-react';
import { supportsFileSystemAccess } from '@/utils/fileSystem';

interface DropZoneProps {
  onDrop: (items: DataTransferItemList) => void;
  onImportFolder: () => void;
  onImportFiles: () => void;
  isImporting: boolean;
}

export function DropZone({ onDrop, onImportFolder, onImportFiles, isImporting }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      onDrop(e.dataTransfer.items);
    }
  }, [onDrop]);
  
  return (
    <div className="p-3 space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]' 
            : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
          }
        `}
      >
        <div className={`
          w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all duration-200
          ${isDragOver ? 'bg-cyan-500/20' : 'bg-slate-800'}
        `}>
          <Upload className={`
            w-6 h-6 transition-all duration-200
            ${isDragOver ? 'text-cyan-400' : 'text-slate-500'}
          `} />
        </div>
        
        <p className={`
          text-sm font-medium transition-colors duration-200
          ${isDragOver ? 'text-cyan-400' : 'text-slate-400'}
        `}>
          {isDragOver ? 'Drop to import' : 'Drop folder or files here'}
        </p>
        <p className="text-xs text-slate-600 mt-1">or click to browse</p>
        
        {isImporting && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-2 text-cyan-400">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Importing...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Import buttons */}
      <div className="flex gap-2">
        <button
          onClick={onImportFolder}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800/50 border border-slate-700/50 
                     text-slate-400 text-xs font-medium hover:bg-slate-700/50 hover:text-slate-300 hover:border-slate-600
                     transition-all duration-150"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Import Folder
        </button>
        <button
          onClick={onImportFiles}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800/50 border border-slate-700/50 
                     text-slate-400 text-xs font-medium hover:bg-slate-700/50 hover:text-slate-300 hover:border-slate-600
                     transition-all duration-150"
        >
          <FilePlus className="w-3.5 h-3.5" />
          Import Files
        </button>
      </div>
      
      {supportsFileSystemAccess() && (
        <p className="text-[10px] text-slate-600 text-center">
          Using File System Access API for better folder support
        </p>
      )}
    </div>
  );
}
