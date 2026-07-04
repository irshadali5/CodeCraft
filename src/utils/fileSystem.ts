import type { FileNode } from '@/types';

// Generate unique ID
let idCounter = 0;
export function generateId(): string {
  return `node-${++idCounter}-${Date.now().toString(36)}`;
}

// File extension to language mapping
export const EXTENSION_MAP: Record<string, string> = {
  // JavaScript/TypeScript
  'js': 'javascript', 'jsx': 'jsx', 'ts': 'typescript', 'tsx': 'tsx', 'mjs': 'javascript', 'cjs': 'javascript',
  // Web
  'html': 'html', 'htm': 'html', 'css': 'css', 'scss': 'scss', 'sass': 'sass', 'less': 'less',
  'json': 'json', 'xml': 'xml', 'svg': 'svg', 'yaml': 'yaml', 'yml': 'yaml',
  // Python
  'py': 'python', 'pyw': 'python', 'ipynb': 'json',
  // Java
  'java': 'java', 'kt': 'kotlin', 'scala': 'scala', 'groovy': 'groovy',
  // C-family
  'c': 'c', 'h': 'c', 'cpp': 'cpp', 'hpp': 'cpp', 'cc': 'cpp', 'cxx': 'cpp',
  'cs': 'csharp', 'go': 'go', 'rs': 'rust', 'swift': 'swift', 'm': 'objectivec',
  // Ruby
  'rb': 'ruby', 'erb': 'erb',
  // PHP
  'php': 'php', 'phtml': 'php',
  // Shell
  'sh': 'bash', 'bash': 'bash', 'zsh': 'bash', 'fish': 'bash', 'ps1': 'powershell',
  // Database
  'sql': 'sql', 'sqlite': 'sql',
  // Config/Data
  'toml': 'toml', 'ini': 'ini', 'conf': 'ini', 'cfg': 'ini', 'env': 'bash',
  // Documentation
  'md': 'markdown', 'mdx': 'markdown', 'rst': 'rst', 'txt': 'text',
  // Other
  'dockerfile': 'dockerfile', 'makefile': 'makefile', 'cmake': 'cmake',
  'lua': 'lua', 'r': 'r', 'pl': 'perl', 'pm': 'perl', 'ex': 'elixir', 'exs': 'elixir',
  'dart': 'dart', 'elm': 'elm', 'erl': 'erlang', 'fs': 'fsharp', 'hs': 'haskell',
  'jl': 'julia', 'pas': 'pascal', 'nim': 'nim', 'cr': 'crystal', 'coffee': 'coffeescript',
};

// File type info for icons and colors
export function getFileTypeInfo(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const language = EXTENSION_MAP[ext] || 'text';
  
  const colorMap: Record<string, string> = {
    javascript: '#f7df1e', typescript: '#3178c6', jsx: '#61dafb', tsx: '#3178c6',
    html: '#e34c26', css: '#264de4', scss: '#cc6699', json: '#292929',
    python: '#3776ab', java: '#007396', kotlin: '#7f52ff', go: '#00add8',
    rust: '#dea584', c: '#555555', cpp: '#f34b7d', csharp: '#239120',
    ruby: '#cc342d', php: '#777bb4', bash: '#89e051', powershell: '#012456',
    sql: '#e38c00', markdown: '#083fa1', yaml: '#cb171e',
    dockerfile: '#2496ed', vue: '#4fc08d', svelte: '#ff3e00', angular: '#dd0031',
    swift: '#ffac45', dart: '#00b4ab', lua: '#000080', r: '#198ce7',
  };
  
  const iconMap: Record<string, string> = {
    javascript: 'file-code', typescript: 'file-code', jsx: 'file-code', tsx: 'file-code',
    html: 'file-code', css: 'file-code', scss: 'file-code', json: 'file-json',
    python: 'file-code', java: 'file-code', kotlin: 'file-code', go: 'file-code',
    rust: 'file-code', c: 'file-code', cpp: 'file-code', csharp: 'file-code',
    ruby: 'file-code', php: 'file-code', bash: 'terminal', powershell: 'terminal',
    sql: 'database', markdown: 'file-text', yaml: 'file-json', dockerfile: 'container',
    vue: 'file-code', svelte: 'file-code', text: 'file',
  };
  
  return {
    language,
    color: colorMap[language] || '#94a3b8',
    icon: iconMap[language] || 'file',
  };
}

// Create a file node from a File object
export async function createFileNode(file: File, path: string = ''): Promise<FileNode> {
  const fullPath = path ? `${path}/${file.name}` : file.name;
  const typeInfo = getFileTypeInfo(file.name);
  
  return {
    id: generateId(),
    name: file.name,
    type: 'file',
    path: fullPath,
    content: await file.text(),
    language: typeInfo.language,
    children: [],
    isSelected: true,
    isExpanded: false,
    size: file.size,
    lastModified: new Date(file.lastModified),
  };
}

// Build tree from flat file list
export function buildFileTree(files: FileNode[]): FileNode {
  const root: FileNode = {
    id: generateId(),
    name: 'root',
    type: 'directory',
    path: '',
    children: [],
    isSelected: true,
    isExpanded: true,
  };
  
  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;
    let currentPath = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (i === parts.length - 1) {
        // This is the file
        file.path = currentPath;
        current.children.push(file);
      } else {
        // This is a directory
        let dir = current.children.find(c => c.name === part && c.type === 'directory');
        if (!dir) {
          dir = {
            id: generateId(),
            name: part,
            type: 'directory',
            path: currentPath,
            children: [],
            isSelected: true,
            isExpanded: true,
          };
          current.children.push(dir);
        }
        current = dir;
      }
    }
  }
  
  // Sort: directories first, then files, alphabetically
  sortFileTree(root);
  
  return root;
}

// Sort tree nodes
function sortFileTree(node: FileNode): void {
  if (node.children) {
    node.children.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortFileTree);
  }
}

// Get all file nodes (flatten)
export function getAllFiles(node: FileNode): FileNode[] {
  const files: FileNode[] = [];
  if (node.type === 'file') {
    files.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      files.push(...getAllFiles(child));
    }
  }
  return files;
}

// Get selected files
export function getSelectedFiles(node: FileNode): FileNode[] {
  return getAllFiles(node).filter(f => f.isSelected);
}

// Count total files
export function countFiles(node: FileNode): number {
  return getAllFiles(node).length;
}

// Toggle selection for a node
export function toggleSelection(node: FileNode, nodeId: string): FileNode {
  const newNode = { ...node, children: node.children?.map(c => toggleSelection(c, nodeId)) };
  if (newNode.id === nodeId) {
    newNode.isSelected = !newNode.isSelected;
    // Propagate to children
    propagateSelection(newNode, newNode.isSelected);
  }
  return newNode;
}

// Propagate selection state to all children
function propagateSelection(node: FileNode, selected: boolean): void {
  node.isSelected = selected;
  if (node.children) {
    for (const child of node.children) {
      propagateSelection(child, selected);
    }
  }
}

// Toggle expand/collapse
export function toggleExpand(node: FileNode, nodeId: string): FileNode {
  const newNode = { ...node, children: node.children?.map(c => toggleExpand(c, nodeId)) };
  if (newNode.id === nodeId && newNode.type === 'directory') {
    newNode.isExpanded = !newNode.isExpanded;
  }
  return newNode;
}

// Select all files
export function selectAll(node: FileNode, selected: boolean = true): FileNode {
  const newNode = { ...node, isSelected: selected };
  if (newNode.children) {
    newNode.children = newNode.children.map(c => selectAll(c, selected));
  }
  return newNode;
}

// Remove a node from tree
export function removeNode(node: FileNode, nodeId: string): FileNode | null {
  if (node.id === nodeId) return null;
  if (node.children) {
    node.children = node.children
      .map(c => removeNode(c, nodeId))
      .filter(Boolean) as FileNode[];
  }
  return node;
}

// Generate directory tree text (for Markdown export)
export function generateTreeText(node: FileNode, prefix: string = '', isLast: boolean = true): string {
  let result = '';
  const connector = isLast ? '\u2514\u2500\u2500 ' : '\u251c\u2500\u2500 ';
  
  if (node.name !== 'root') {
    result += `${prefix}${connector}${node.name}\n`;
  }
  
  if (node.children) {
    const newPrefix = prefix + (isLast ? '    ' : '\u2502   ');
    node.children.forEach((child, index) => {
      const childIsLast = index === node.children!.length - 1;
      result += generateTreeText(child, node.name === 'root' ? '' : newPrefix, childIsLast);
    });
  }
  
  return result;
}

// Read directory using File System Access API
export async function readDirectory(handle: FileSystemDirectoryHandle, path: string = ''): Promise<FileNode[]> {
  const files: FileNode[] = [];
  
  // @ts-ignore
  for await (const entry of handle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;
    
    if (entry.kind === 'directory') {
      // Recursively read subdirectory
      const subFiles = await readDirectory(entry, entryPath);
      files.push(...subFiles);
    } else {
      const file = await entry.getFile();
      const fileNode = await createFileNode(file, path);
      fileNode.path = entryPath;
      files.push(fileNode);
    }
  }
  
  return files;
}

// Process files from drag and drop
export async function processDroppedItems(items: DataTransferItemList): Promise<FileNode[]> {
  const fileNodes: FileNode[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        const nodes = await readEntry(entry);
        fileNodes.push(...nodes);
      }
    }
  }
  
  return fileNodes;
}

// Read a FileSystemEntry (file or directory)
async function readEntry(entry: FileSystemEntry, path: string = ''): Promise<FileNode[]> {
  const currentPath = path ? `${path}/${entry.name}` : entry.name;
  
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file(async (file) => {
        const node = await createFileNode(file, path);
        node.path = currentPath;
        resolve([node]);
      });
    });
  } else if (entry.isDirectory) {
    const dirReader = (entry as FileSystemDirectoryEntry).createReader();
    const allNodes: FileNode[] = [];
    
    const readEntries = (): Promise<void> => {
      return new Promise((resolve) => {
        dirReader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve();
            return;
          }
          
          for (const subEntry of entries) {
            const subNodes = await readEntry(subEntry, currentPath);
            allNodes.push(...subNodes);
          }
          
          // Continue reading (readEntries may return in batches)
          await readEntries();
          resolve();
        });
      });
    };
    
    await readEntries();
    return allNodes;
  }
  
  return [];
}

// Check if browser supports File System Access API
export function supportsFileSystemAccess(): boolean {
  return 'showDirectoryPicker' in window;
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
