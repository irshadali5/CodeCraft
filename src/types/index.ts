// File system tree types
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  language?: string;
  children: FileNode[];
  isSelected: boolean;
  isExpanded: boolean;
  size?: number;
  lastModified?: Date;
}

// Export settings
export type ExportFormat = 'pdf' | 'markdown' | 'zip';

export interface PDFSettings {
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  lineNumbers: boolean;
  syntaxHighlighting: boolean;
  tableOfContents: boolean;
  pageNumbers: boolean;
  headerFooter: boolean;
  fontSize: 8 | 9 | 10 | 11 | 12;
  theme: 'dark' | 'light';
}

export interface MarkdownSettings {
  includeFrontmatter: boolean;
  fileHeaders: boolean;
  codeFenceLanguage: boolean;
  directoryTree: boolean;
  separatorStyle: 'hr' | 'page-break' | 'comment';
}

export interface ExportMetadata {
  title: string;
  author: string;
  date: string;
  description: string;
}

export interface AppSettings {
  format: ExportFormat;
  pdf: PDFSettings;
  markdown: MarkdownSettings;
  metadata: ExportMetadata;
}

// File type mapping
export interface FileTypeInfo {
  icon: string;
  color: string;
  language: string;
}

// Export progress
export interface ExportProgress {
  step: number;
  totalSteps: number;
  message: string;
  percentage: number;
  isComplete: boolean;
}
