import { useCallback } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, FileCode, FileJson, FileText } from 'lucide-react';
import type { FileNode } from '@/types';
import { useFileStore } from '@/hooks/useFileStore';
import { getFileTypeInfo } from '@/utils/fileSystem';
import { cn } from '@/lib/utils';

interface FileTreeProps {
  node: FileNode;
  level?: number;
}

// File icon component based on file type
function FileIcon({ filename }: { filename: string }) {
  const info = getFileTypeInfo(filename);
  const iconClass = "w-4 h-4 flex-shrink-0";
  
  if (filename.endsWith('.json') || filename.endsWith('.yaml') || filename.endsWith('.yml')) {
    return <FileJson className={iconClass} style={{ color: info.color }} />;
  }
  if (filename.endsWith('.md') || filename.endsWith('.txt') || filename.endsWith('.rst')) {
    return <FileText className={iconClass} style={{ color: info.color }} />;
  }
  if (info.language !== 'text') {
    return <FileCode className={iconClass} style={{ color: info.color }} />;
  }
  
  return <File className={iconClass} style={{ color: '#64748b' }} />;
}

// Tree node component
function TreeNode({ node, level = 0 }: FileTreeProps) {
  const { selectedFileId, setSelectedFileId, toggleNodeSelection, toggleNodeExpand } = useFileStore();
  
  const isSelected = selectedFileId === node.id;
  const isDirectory = node.type === 'directory';
  const hasChildren = isDirectory && node.children && node.children.length > 0;
  
  const handleClick = useCallback(() => {
    if (isDirectory) {
      if (hasChildren) {
        toggleNodeExpand(node.id);
      }
    } else {
      setSelectedFileId(node.id);
    }
  }, [isDirectory, hasChildren, node.id, toggleNodeExpand, setSelectedFileId]);
  
  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNodeSelection(node.id);
  }, [node.id, toggleNodeSelection]);
  
  const indent = level * 16;
  
  return (
    <div>
      <div
        onClick={handleClick}
        className={cn(
          "group flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-all duration-150",
          isSelected 
            ? "bg-cyan-500/10 border-l-2 border-cyan-400" 
            : "border-l-2 border-transparent hover:bg-slate-800/60",
          node.isSelected ? "opacity-100" : "opacity-50"
        )}
        style={{ marginLeft: `${indent}px` }}
      >
        {/* Expand/collapse chevron for directories */}
        {isDirectory && hasChildren ? (
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {node.isExpanded ? (
              <ChevronDown className="w-3 h-3 text-slate-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-500" />
            )}
          </div>
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}
        
        {/* Checkbox */}
        <div
          onClick={handleCheckboxClick}
          className={cn(
            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-150",
            node.isSelected
              ? "bg-cyan-500 border-cyan-400"
              : "border-slate-600 bg-transparent group-hover:border-slate-500"
          )}
        >
          {node.isSelected && (
            <svg className="w-2.5 h-2.5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        
        {/* Icon */}
        {isDirectory ? (
          node.isExpanded ? (
            <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-blue-400/70 flex-shrink-0" />
          )
        ) : (
          <FileIcon filename={node.name} />
        )}
        
        {/* Name */}
        <span className={cn(
          "text-xs truncate flex-1 select-none",
          isSelected ? "text-cyan-400 font-medium" : "text-slate-300 group-hover:text-slate-200",
          !node.isSelected && "text-slate-400"
        )}>
          {node.name}
        </span>
        
        {/* File count badge for directories */}
        {isDirectory && hasChildren && (
          <span className="text-[10px] text-slate-600 bg-slate-800/80 px-1.5 py-0.5 rounded-full flex-shrink-0">
            {node.children?.length}
          </span>
        )}
        
        {/* File size for files */}
        {!isDirectory && node.size !== undefined && (
          <span className="text-[10px] text-slate-600 flex-shrink-0">
            {formatSize(node.size)}
          </span>
        )}
      </div>
      
      {/* Children */}
      {isDirectory && node.isExpanded && node.children && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// Main FileTree component
export function FileTree({ node }: { node: FileNode }) {
  const { selectAll } = useFileStore();
  const fileCount = countFiles(node);
  const selectedCount = countSelectedFiles(node);
  
  return (
    <div className="flex flex-col h-full">
      {/* Tree header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Files</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => selectAll(true)}
            className="text-[10px] text-slate-500 hover:text-cyan-400 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
          >
            All
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => selectAll(false)}
            className="text-[10px] text-slate-500 hover:text-cyan-400 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
          >
            None
          </button>
        </div>
      </div>
      
      {/* Tree content */}
      <div className="flex-1 overflow-y-auto py-1 px-1 custom-scrollbar">
        <TreeNode node={node} level={0} />
      </div>
      
      {/* Footer with count */}
      <div className="px-3 py-2 border-t border-white/5">
        <span className="text-[10px] text-slate-600">
          {selectedCount} of {fileCount} files selected
        </span>
      </div>
    </div>
  );
}

// Helper functions
function countFiles(node: FileNode): number {
  if (node.type === 'file') return 1;
  return node.children?.reduce((acc, child) => acc + countFiles(child), 0) || 0;
}

function countSelectedFiles(node: FileNode): number {
  if (node.type === 'file') return node.isSelected ? 1 : 0;
  return node.children?.reduce((acc, child) => acc + countSelectedFiles(child), 0) || 0;
}
