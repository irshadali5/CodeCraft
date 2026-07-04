import { useCallback, useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Header } from '@/components/Header';
import { SourcePanel } from '@/components/SourcePanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { OptionsPanel } from '@/components/OptionsPanel';
import { ExportModal } from '@/components/ExportModal';
import { useFileStore } from '@/hooks/useFileStore';
import { generatePDF, generateMarkdown } from '@/utils/exportEngine';
import type { ExportProgress } from '@/types';
import { saveAs } from 'file-saver';

function AppContent() {
  const { rootNode, settings, isExporting, setIsExporting, setExportProgress } = useFileStore();

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [currentProgress, setCurrentProgress] = useState<ExportProgress | null>(null);

  // Handle import folder (delegated to SourcePanel)
  const handleImportFolder = useCallback(() => {}, []);

  // Handle import files (delegated to SourcePanel)
  const handleImportFiles = useCallback(() => {}, []);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!rootNode) {
      toast.error('No files to export');
      return;
    }

    setIsExporting(true);
    setExportModalOpen(true);
    setExportComplete(false);
    setExportError(null);

    try {
      const onProgress = (progress: ExportProgress) => {
        setCurrentProgress(progress);
        setExportProgress(progress);
      };

      let blob: Blob;
      let filename: string;

      const timestamp = new Date().toISOString().split('T')[0];
      const title = settings.metadata.title || 'export';

      switch (settings.format) {
        case 'pdf':
          try {
            blob = await generatePDF(rootNode, settings.pdf, settings.metadata, onProgress);
          } catch (pdfError) {
            console.warn('Advanced PDF failed, falling back to basic PDF:', pdfError);
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            const allFiles = getAllFilesFlat(rootNode);

            let y = 20;
            allFiles.forEach((file) => {
              if (y > 250) {
                doc.addPage();
                y = 20;
              }
              doc.setFontSize(12);
              doc.text(file.name, 20, y);
              y += 10;
              doc.setFontSize(9);
              const lines = doc.splitTextToSize(file.content || '', 170);
              doc.text(lines, 20, y);
              y += lines.length * 5 + 15;
            });

            blob = doc.output('blob');
          }
          filename = `${title}-${timestamp}.pdf`;
          break;

        case 'markdown':
          onProgress({
            step: 1,
            totalSteps: 3,
            message: 'Generating Markdown content...',
            percentage: 30,
            isComplete: false,
          });

          const markdownContent = generateMarkdown(rootNode, settings.markdown, settings.metadata);
          blob = new Blob([markdownContent], { type: 'text/markdown' });
          filename = `${title}-${timestamp}.md`;
          break;

        case 'zip':
          onProgress({
            step: 1,
            totalSteps: 5,
            message: 'Creating ZIP archive...',
            percentage: 20,
            isComplete: false,
          });

          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();

          // Generate combined README
          const combinedMarkdown = generateMarkdown(rootNode, settings.markdown, settings.metadata);
          zip.file('README.md', combinedMarkdown);

          // Generate individual files preserving structure
          const allFiles = getAllFilesFlat(rootNode);
          allFiles.forEach((file) => {
            const markdownPath = file.path.replace(/\.[^/.]+$/, '') + '.md';

            let content = '';
            if (settings.markdown.includeFrontmatter) {
              content += '---\n';
              content += `source: "${file.path}"\n`;
              content += `language: "${file.language || 'text'}"\n`;
              content += `generated: "${new Date().toISOString()}"\n`;
              content += '---\n\n';
            }

            if (settings.markdown.fileHeaders) {
              content += `# ${file.name}\n\n`;
              content += `**Source:** \`${file.path}\`\n\n`;
            }

            const lang = settings.markdown.codeFenceLanguage ? (file.language || '') : '';
            content += `\`\`\`${lang}\n`;
            content += file.content || '';
            content += '\n\`\`\`\n';

            zip.file(markdownPath, content);
          });

          // Generate directory tree file
          if (settings.markdown.directoryTree) {
            const { generateTreeText } = await import('@/utils/fileSystem');
            zip.file('DIRECTORY_TREE.txt', generateTreeText(rootNode));
          }

          blob = await zip.generateAsync({ type: 'blob' });
          filename = `${title}-${timestamp}.zip`;
          break;

        default:
          throw new Error('Unknown export format');
      }

      onProgress({
        step: 5,
        totalSteps: 5,
        message: 'Downloading...',
        percentage: 100,
        isComplete: true,
      });

      saveAs(blob, filename);

      setExportComplete(true);
      toast.success(`${settings.format.toUpperCase()} exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setExportError(errorMessage);
      toast.error(`Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }, [rootNode, settings, setIsExporting, setExportProgress]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (!isExporting && rootNode) {
          handleExport();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExport, isExporting, rootNode]);

  return (
    <div className="h-screen flex flex-col bg-[#0a0e17] text-slate-200 overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            color: '#f1f5f9',
          },
        }}
      />

      <Header
        onImportFolder={handleImportFolder}
        onImportFiles={handleImportFiles}
        onExport={handleExport}
      />

      <div className="flex-1 flex overflow-hidden">
        <SourcePanel />
        <PreviewPanel />
        <OptionsPanel onExport={handleExport} />
      </div>

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => {
          setExportModalOpen(false);
          setExportComplete(false);
          setExportError(null);
        }}
        progress={currentProgress}
        isComplete={exportComplete}
        error={exportError}
      />
    </div>
  );
}

// Helper function to flatten all files from tree
function getAllFilesFlat(node: { type: string; children?: any[] }): any[] {
  const files: any[] = [];
  if (node.type === 'file') {
    files.push(node);
  }
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      files.push(...getAllFilesFlat(child));
    }
  }
  return files;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
