import { Code2, HelpCircle, Settings, FolderOpen, FilePlus, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/hooks/useFileStore';
import { getSelectedFiles } from '@/utils/fileSystem';

interface HeaderProps {
  onImportFolder: () => void;
  onImportFiles: () => void;
  onExport: () => void;
}

export function Header({ onImportFolder, onImportFiles, onExport }: HeaderProps) {
  const { rootNode, isExporting, removeSelectedFiles } = useFileStore();
  
  const selectedCount = rootNode ? getSelectedFiles(rootNode).length : 0;
  
  return (
    <header className="h-14 bg-[#0a0e17]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Code2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold text-slate-100 leading-tight">CodeCraft</span>
          <span className="text-[10px] text-slate-500 leading-tight">Converter</span>
        </div>
      </div>
      
      {/* Center actions */}
      {rootNode && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onImportFolder}
            className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 h-8 gap-1.5 text-xs"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import Folder</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onImportFiles}
            className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 h-8 gap-1.5 text-xs"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import Files</span>
          </Button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={removeSelectedFiles}
            disabled={selectedCount === 0}
            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 gap-1.5 text-xs disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Remove</span>
          </Button>
        </div>
      )}
      
      {/* Right actions */}
      <div className="flex items-center gap-2">
        {rootNode && (
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs text-slate-500">
              {selectedCount} file{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <Button
              onClick={onExport}
              disabled={isExporting || selectedCount === 0}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 h-8 gap-1.5 text-xs font-semibold rounded-full px-4"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-200 h-8 w-8"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-200 h-8 w-8"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
