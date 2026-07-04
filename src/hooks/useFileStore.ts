import { create } from 'zustand';
import type { FileNode, AppSettings, ExportFormat, ExportProgress } from '@/types';

interface FileStore {
  // File tree
  rootNode: FileNode | null;
  selectedFileId: string | null;
  
  // Settings
  settings: AppSettings;
  
  // UI State
  isImporting: boolean;
  isExporting: boolean;
  exportProgress: ExportProgress | null;
  showOptions: boolean;
  
  // Actions
  setRootNode: (node: FileNode | null) => void;
  setSelectedFileId: (id: string | null) => void;
  updateNode: (node: FileNode) => void;
  toggleNodeSelection: (nodeId: string) => void;
  toggleNodeExpand: (nodeId: string) => void;
  selectAll: (selected: boolean) => void;
  removeNode: (nodeId: string) => void;
  removeSelectedFiles: () => void;
  setSettings: (settings: Partial<AppSettings>) => void;
  updatePDFSettings: (settings: Partial<AppSettings['pdf']>) => void;
  updateMarkdownSettings: (settings: Partial<AppSettings['markdown']>) => void;
  updateMetadata: (metadata: Partial<AppSettings['metadata']>) => void;
  setFormat: (format: ExportFormat) => void;
  setIsImporting: (value: boolean) => void;
  setIsExporting: (value: boolean) => void;
  setExportProgress: (progress: ExportProgress | null) => void;
  toggleOptions: () => void;
  reset: () => void;
}

const defaultSettings: AppSettings = {
  format: 'pdf',
  pdf: {
    pageSize: 'a4',
    orientation: 'portrait',
    lineNumbers: true,
    syntaxHighlighting: true,
    tableOfContents: true,
    pageNumbers: true,
    headerFooter: false,
    fontSize: 9,
    theme: 'dark',
  },
  markdown: {
    includeFrontmatter: true,
    fileHeaders: true,
    codeFenceLanguage: true,
    directoryTree: true,
    separatorStyle: 'hr',
  },
  metadata: {
    title: '',
    author: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  },
};

// Ensure node has children array
function ensureChildren(node: FileNode): FileNode {
  return {
    ...node,
    children: node.children || [],
  };
}

// Ensure entire tree has children arrays
function ensureTreeChildren(node: FileNode): FileNode {
  const ensured = ensureChildren(node);
  if (ensured.children.length > 0) {
    ensured.children = ensured.children.map(ensureTreeChildren);
  }
  return ensured;
}

export const useFileStore = create<FileStore>((set, get) => ({
  // Initial state
  rootNode: null,
  selectedFileId: null,
  settings: { ...defaultSettings },
  isImporting: false,
  isExporting: false,
  exportProgress: null,
  showOptions: true,
  
  // Actions
  setRootNode: (node) => set({ rootNode: node ? ensureTreeChildren(node) : null }),
  
  setSelectedFileId: (id) => set({ selectedFileId: id }),
  
  updateNode: (updatedNode) => {
    const { rootNode } = get();
    if (!rootNode) return;
    
    const updateInTree = (node: FileNode): FileNode => {
      if (node.id === updatedNode.id) {
        return ensureChildren(updatedNode);
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateInTree),
        };
      }
      return node;
    };
    
    set({ rootNode: updateInTree(rootNode) });
  },
  
  toggleNodeSelection: (nodeId) => {
    const { rootNode } = get();
    if (!rootNode) return;
    
    const toggleInTree = (node: FileNode): FileNode => {
      const ensured = ensureChildren(node);
      if (ensured.id === nodeId) {
        const newSelected = !ensured.isSelected;
        return {
          ...ensured,
          isSelected: newSelected,
          children: ensured.children.map((child) => propagateSelection(ensureChildren(child), newSelected)),
        };
      }
      if (ensured.children.length > 0) {
        const newChildren = ensured.children.map(toggleInTree);
        const allSelected = newChildren.every((c) => c.isSelected);
        return {
          ...ensured,
          children: newChildren,
          isSelected: allSelected,
        };
      }
      return ensured;
    };
    
    set({ rootNode: toggleInTree(rootNode) });
  },
  
  toggleNodeExpand: (nodeId) => {
    const { rootNode } = get();
    if (!rootNode) return;
    
    const toggleInTree = (node: FileNode): FileNode => {
      const ensured = ensureChildren(node);
      if (ensured.id === nodeId && ensured.type === 'directory') {
        return { ...ensured, isExpanded: !ensured.isExpanded };
      }
      if (ensured.children.length > 0) {
        return {
          ...ensured,
          children: ensured.children.map(toggleInTree),
        };
      }
      return ensured;
    };
    
    set({ rootNode: toggleInTree(rootNode) });
  },
  
  selectAll: (selected) => {
    const { rootNode } = get();
    if (!rootNode) return;
    
    const selectAllInTree = (node: FileNode): FileNode => {
      const ensured = ensureChildren(node);
      return {
        ...ensured,
        isSelected: selected,
        children: ensured.children.map((child) => selectAllInTree(ensureChildren(child))),
      };
    };
    
    set({ rootNode: selectAllInTree(rootNode) });
  },
  
  removeNode: (nodeId) => {
    const { rootNode, selectedFileId } = get();
    if (!rootNode) return;
    
    const removeFromTree = (node: FileNode): FileNode | null => {
      if (node.id === nodeId) return null;
      if (node.children) {
        const filtered = node.children
          .map(removeFromTree)
          .filter(Boolean) as FileNode[];
        return { ...node, children: filtered };
      }
      return node;
    };
    
    const newRoot = removeFromTree(rootNode);
    set({
      rootNode: newRoot,
      selectedFileId: selectedFileId === nodeId ? null : selectedFileId,
    });
  },
  
  removeSelectedFiles: () => {
    const { rootNode, selectedFileId } = get();
    if (!rootNode) return;
    
    const removeSelected = (node: FileNode): FileNode | null => {
      if (node.type === 'file' && node.isSelected) return null;
      if (node.children) {
        const filtered = node.children
          .map(removeSelected)
          .filter(Boolean) as FileNode[];
        // Remove empty directories
        if (filtered.length === 0 && node.type === 'directory') return null;
        return { ...node, children: filtered };
      }
      return node;
    };
    
    const newRoot = removeSelected(rootNode);
    
    // Check if selected file still exists
    let newSelectedId = selectedFileId;
    if (selectedFileId && newRoot) {
      const stillExists = findNodeInTree(newRoot, selectedFileId);
      if (!stillExists) {
        newSelectedId = null;
      }
    }
    
    set({
      rootNode: newRoot,
      selectedFileId: newSelectedId,
    });
  },
  
  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
  
  updatePDFSettings: (pdfSettings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        pdf: { ...state.settings.pdf, ...pdfSettings },
      },
    })),
  
  updateMarkdownSettings: (mdSettings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        markdown: { ...state.settings.markdown, ...mdSettings },
      },
    })),
  
  updateMetadata: (metadata) =>
    set((state) => ({
      settings: {
        ...state.settings,
        metadata: { ...state.settings.metadata, ...metadata },
      },
    })),
  
  setFormat: (format) =>
    set((state) => ({
      settings: { ...state.settings, format },
    })),
  
  setIsImporting: (value) => set({ isImporting: value }),
  setIsExporting: (value) => set({ isExporting: value }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  toggleOptions: () => set((state) => ({ showOptions: !state.showOptions })),
  
  reset: () =>
    set({
      rootNode: null,
      selectedFileId: null,
      settings: { ...defaultSettings },
      isImporting: false,
      isExporting: false,
      exportProgress: null,
    }),
}));

// Helper: Propagate selection to children
function propagateSelection(node: FileNode, selected: boolean): FileNode {
  const ensured = ensureChildren(node);
  return {
    ...ensured,
    isSelected: selected,
    children: ensured.children.map((child) => propagateSelection(ensureChildren(child), selected)),
  };
}

// Helper: Find node in tree
function findNodeInTree(root: FileNode, nodeId: string): boolean {
  if (root.id === nodeId) return true;
  if (root.children) {
    return root.children.some((child) => findNodeInTree(child, nodeId));
  }
  return false;
}
