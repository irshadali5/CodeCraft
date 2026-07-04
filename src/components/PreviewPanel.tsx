import { useMemo } from 'react';
import { FileCode, FileText, Eye } from 'lucide-react';
import { useFileStore } from '@/hooks/useFileStore';
import { highlightCode, generateHighlightStyles } from '@/utils/syntaxHighlight';
import { getAllFiles, getFileTypeInfo } from '@/utils/fileSystem';

export function PreviewPanel() {
  const { rootNode, selectedFileId } = useFileStore();
  
  // Find selected file
  const selectedFile = useMemo(() => {
    if (!rootNode || !selectedFileId) return null;
    const allFiles = getAllFiles(rootNode);
    return allFiles.find(f => f.id === selectedFileId) || allFiles[0] || null;
  }, [rootNode, selectedFileId]);
  
  // Get file type info
  const fileInfo = useMemo(() => {
    if (!selectedFile) return null;
    return getFileTypeInfo(selectedFile.name);
  }, [selectedFile]);
  
  // Highlighted code
  const highlightedCode = useMemo(() => {
    if (!selectedFile) return '';
    return highlightCode(
      selectedFile.content || '',
      selectedFile.language || 'text'
    );
  }, [selectedFile]);
  
  // Breadcrumb path
  const breadcrumb = useMemo(() => {
    if (!selectedFile) return '';
    return selectedFile.path;
  }, [selectedFile]);
  
  if (!rootNode) {
    return (
      <div className="flex-1 flex flex-col bg-[#0a0e17]">
        <Toolbar breadcrumb="" fileCount={0} />
        <div className="flex-1 flex items-center justify-center">
          <NoPreviewState />
        </div>
      </div>
    );
  }
  
  const allFiles = getAllFiles(rootNode);
  const fileCount = allFiles.length;
  
  return (
    <div className="flex-1 flex flex-col bg-[#0a0e17] min-w-0">
      <Toolbar breadcrumb={breadcrumb} fileCount={fileCount} />
      
      {selectedFile ? (
        <div className="flex-1 overflow-auto custom-scrollbar">
          {/* File info bar */}
          <div className="px-6 py-3 border-b border-white/5 flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${fileInfo?.color}15` }}
            >
              <FileCode className="w-4 h-4" style={{ color: fileInfo?.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-slate-200 truncate">
                {selectedFile.name}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {selectedFile.path} · {selectedFile.language} · {formatSize(selectedFile.size || 0)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-600 bg-slate-800/80 px-2 py-1 rounded-full">
                {selectedFile.language}
              </span>
            </div>
          </div>
          
          {/* Code preview */}
          <div className="p-6">
            <style>{generateHighlightStyles()}</style>
            <CodePreview 
              code={selectedFile.content || ''}
              highlightedCode={highlightedCode}
              language={selectedFile.language || 'text'}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-12 h-12 text-slate-800 mx-auto mb-3" />
            <p className="text-sm text-slate-600">Select a file to preview</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface ToolbarProps {
  breadcrumb: string;
  fileCount: number;
}

function Toolbar({ breadcrumb, fileCount }: ToolbarProps) {
  return (
    <div className="h-12 bg-[#111827] border-b border-white/5 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
          <Eye className="w-3.5 h-3.5 flex-shrink-0" />
          {breadcrumb ? (
            <span className="truncate">{breadcrumb}</span>
          ) : (
            <span>Preview</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] text-slate-600">
          {fileCount} file{fileCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

interface CodePreviewProps {
  code: string;
  highlightedCode: string;
  language: string;
}

function CodePreview({ highlightedCode, language }: CodePreviewProps) {
  const lines = highlightedCode.split('\n');
  
  return (
    <div className="rounded-xl overflow-hidden bg-[#0d1117] border border-white/5">
      {/* Code header */}
      <div className="px-4 py-2.5 bg-[#161b22] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[10px] text-slate-600 ml-2 font-mono">{language}</span>
        </div>
      </div>
      
      {/* Code content */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((_line, index) => (
              <tr key={index} className="hover:bg-white/[0.02]">
                <td className="text-right py-0 pr-4 pl-4 select-none w-12">
                  <span className="text-xs text-[#484f58] font-mono">{index + 1}</span>
                </td>
                <td className="py-0 pr-4">
                  <pre className="m-0">
                    <code 
                      className="text-[13px] font-mono leading-6 text-[#c9d1d9]"
                      dangerouslySetInnerHTML={{ 
                        __html: lines[index] || ' ' 
                      }}
                    />
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function NoPreviewState() {
  return (
    <div className="text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-800/30 flex items-center justify-center mx-auto mb-4">
        <FileCode className="w-10 h-10 text-slate-700" />
      </div>
      <h3 className="text-base font-medium text-slate-500 mb-2">No Files to Preview</h3>
      <p className="text-sm text-slate-600 max-w-[300px] mx-auto">
        Import a folder or files to start previewing and exporting your code
      </p>
    </div>
  );
}
