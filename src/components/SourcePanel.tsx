import { useCallback, useEffect, useRef } from 'react';
import { FileCode, FolderTree } from 'lucide-react';
import { DropZone } from './DropZone';
import { FileTree } from './FileTree';
import { useFileStore } from '@/hooks/useFileStore';
import { 
  processDroppedItems, 
  buildFileTree, 
  createFileNode, 
  supportsFileSystemAccess,
  getAllFiles,
} from '@/utils/fileSystem';
import { toast } from 'sonner';

export function SourcePanel() {
  const { rootNode, setRootNode, setSelectedFileId, isImporting, setIsImporting } = useFileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file drop
  const handleDrop = useCallback(async (items: DataTransferItemList) => {
    setIsImporting(true);
    try {
      const fileNodes = await processDroppedItems(items);
      if (fileNodes.length > 0) {
        const newRoot = buildFileTree(fileNodes);
        setRootNode(newRoot);
        
        // Select first file
        const allFiles = getAllFiles(newRoot);
        if (allFiles.length > 0) {
          setSelectedFileId(allFiles[0].id);
        }
        
        toast.success(`Imported ${fileNodes.length} file${fileNodes.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import files');
    } finally {
      setIsImporting(false);
    }
  }, [setRootNode, setSelectedFileId, setIsImporting]);
  
  // Handle import folder
  const handleImportFolder = useCallback(async () => {
    if (supportsFileSystemAccess()) {
      try {
        // @ts-ignore - File System Access API
        const handle = await window.showDirectoryPicker();
        setIsImporting(true);
        
        const fileNodes: any[] = [];
        
        async function readDirectoryRecursive(dirHandle: any, path: string = '') {
          // @ts-ignore
          for await (const entry of dirHandle.values()) {
            const entryPath = path ? `${path}/${entry.name}` : entry.name;
            
            if (entry.kind === 'directory') {
              await readDirectoryRecursive(entry, entryPath);
            } else {
              const file = await entry.getFile();
              const node = await createFileNode(file, path);
              node.path = entryPath;
              fileNodes.push(node);
            }
          }
        }
        
        await readDirectoryRecursive(handle);
        
        if (fileNodes.length > 0) {
          const newRoot = buildFileTree(fileNodes);
          setRootNode(newRoot);
          
          const allFiles = getAllFiles(newRoot);
          if (allFiles.length > 0) {
            setSelectedFileId(allFiles[0].id);
          }
          
          toast.success(`Imported ${fileNodes.length} file${fileNodes.length > 1 ? 's' : ''}`);
        }
        
        setIsImporting(false);
      } catch (error) {
        console.error('Directory picker error:', error);
        // Fallback to input
        folderInputRef.current?.click();
        setIsImporting(false);
      }
    } else {
      folderInputRef.current?.click();
    }
  }, [setRootNode, setSelectedFileId, setIsImporting]);
  
  // Handle import files
  const handleImportFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  // Handle file input change
  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsImporting(true);
    try {
      const fileNodes = await Promise.all(
        Array.from(files).map(file => createFileNode(file))
      );
      
      if (fileNodes.length > 0) {
        const newRoot = buildFileTree(fileNodes);
        setRootNode(newRoot);
        
        const allFiles = getAllFiles(newRoot);
        if (allFiles.length > 0) {
          setSelectedFileId(allFiles[0].id);
        }
        
        toast.success(`Imported ${fileNodes.length} file${fileNodes.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('File import error:', error);
      toast.error('Failed to import files');
    } finally {
      setIsImporting(false);
      e.target.value = ''; // Reset input
    }
  }, [setRootNode, setSelectedFileId, setIsImporting]);
  
  // Handle folder input change
  const handleFolderInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsImporting(true);
    try {
      const fileNodes = await Promise.all(
        Array.from(files).map(file => {
          // Extract relative path from webkitRelativePath
          const relativePath = file.webkitRelativePath;
          const dirPath = relativePath.split('/').slice(0, -1).join('/');
          return createFileNode(file, dirPath);
        })
      );
      
      if (fileNodes.length > 0) {
        const newRoot = buildFileTree(fileNodes);
        setRootNode(newRoot);
        
        const allFiles = getAllFiles(newRoot);
        if (allFiles.length > 0) {
          setSelectedFileId(allFiles[0].id);
        }
        
        toast.success(`Imported ${fileNodes.length} file${fileNodes.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Folder import error:', error);
      toast.error('Failed to import folder');
    } finally {
      setIsImporting(false);
      e.target.value = ''; // Reset input
    }
  }, [setRootNode, setSelectedFileId, setIsImporting]);
  
  // Listen for custom file-import events
  useEffect(() => {
    const handleFileImport = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { files } = customEvent.detail;
      if (files && files.length > 0) {
        setIsImporting(true);
        try {
          const fileNodes = await Promise.all(
            Array.from(files).map((file: any) => createFileNode(file))
          );
          
          if (fileNodes.length > 0) {
            const newRoot = buildFileTree(fileNodes);
            setRootNode(newRoot);
            
            const allFiles = getAllFiles(newRoot);
            if (allFiles.length > 0) {
              setSelectedFileId(allFiles[0].id);
            }
            
            toast.success(`Imported ${fileNodes.length} file${fileNodes.length > 1 ? 's' : ''}`);
          }
        } catch (error) {
          console.error('Import error:', error);
          toast.error('Failed to import files');
        } finally {
          setIsImporting(false);
        }
      }
    };
    
    window.addEventListener('file-import', handleFileImport);
    return () => window.removeEventListener('file-import', handleFileImport);
  }, [setRootNode, setSelectedFileId, setIsImporting]);
  
  return (
    <div className="w-[300px] flex-shrink-0 bg-[#0d1117] border-r border-white/5 flex flex-col">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        {...{ webkitdirectory: 'true', directory: 'true' } as any}
        className="hidden"
        onChange={handleFolderInputChange}
      />
      
      {/* Drop zone */}
      <DropZone 
        onDrop={handleDrop}
        onImportFolder={handleImportFolder}
        onImportFiles={handleImportFiles}
        isImporting={isImporting}
      />
      
      {/* Divider */}
      <div className="border-t border-white/5" />
      
      {/* File tree or empty state */}
      <div className="flex-1 overflow-hidden">
        {rootNode ? (
          <FileTree node={rootNode} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
        <FolderTree className="w-8 h-8 text-slate-700" />
      </div>
      <h3 className="text-sm font-medium text-slate-500 mb-1">No files imported</h3>
      <p className="text-xs text-slate-600 max-w-[200px]">
        Import a folder or files using the controls above to get started
      </p>
      
      <div className="mt-6 space-y-2 w-full">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <FileCode className="w-3.5 h-3.5" />
          <span>Supports all programming languages</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <FolderTree className="w-3.5 h-3.5" />
          <span>Preserves directory structure</span>
        </div>
      </div>
    </div>
  );
}
