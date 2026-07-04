import type { FileNode, ExportProgress, ExportMetadata, PDFSettings, MarkdownSettings } from '@/types';
import { getSelectedFiles, generateTreeText } from './fileSystem';
import { highlightCode, escapeHtml, generateHighlightStyles, generatePDFStyles } from './syntaxHighlight';

/**
 * Generate Markdown content from selected files
 */
export function generateMarkdown(
  rootNode: FileNode,
  settings: MarkdownSettings,
  metadata: ExportMetadata
): string {
  const selectedFiles = getSelectedFiles(rootNode);
  
  let markdown = '';
  
  // Frontmatter
  if (settings.includeFrontmatter) {
    markdown += '---\n';
    if (metadata.title) markdown += `title: "${metadata.title}"\n`;
    if (metadata.author) markdown += `author: "${metadata.author}"\n`;
    if (metadata.date) markdown += `date: "${metadata.date}"\n`;
    if (metadata.description) markdown += `description: "${metadata.description}"\n`;
    markdown += `generated: "${new Date().toISOString()}"\n`;
    markdown += `files: ${selectedFiles.length}\n`;
    markdown += '---\n\n';
  }
  
  // Title
  if (metadata.title) {
    markdown += `# ${metadata.title}\n\n`;
  }
  
  // Metadata
  if (metadata.author || metadata.date) {
    if (metadata.author) markdown += `**Author:** ${metadata.author}\n\n`;
    if (metadata.date) markdown += `**Date:** ${metadata.date}\n\n`;
    if (metadata.description) markdown += `${metadata.description}\n\n`;
    markdown += '---\n\n';
  }
  
  // Directory tree
  if (settings.directoryTree) {
    markdown += '## Directory Structure\n\n';
    markdown += '```\n';
    markdown += generateTreeText(rootNode);
    markdown += '```\n\n';
    markdown += '---\n\n';
  }
  
  // Files
  selectedFiles.forEach((file, index) => {
    // File header
    if (settings.fileHeaders) {
      markdown += `## \`${file.path}\`\n\n`;
    }
    
    // Code block
    const lang = settings.codeFenceLanguage ? (file.language || '') : '';
    markdown += `\`\`\`${lang}\n`;
    markdown += file.content || '';
    markdown += '\n\`\`\`\n';
    
    // Separator
    if (index < selectedFiles.length - 1) {
      switch (settings.separatorStyle) {
        case 'hr':
          markdown += '\n---\n\n';
          break;
        case 'page-break':
          markdown += '\n<div style="page-break-after: always;"></div>\n\n';
          break;
        case 'comment':
          markdown += `\n<!-- end of ${file.path} -->\n\n`;
          break;
      }
    }
  });
  
  return markdown;
}

/**
 * Generate ZIP bundle with Markdown files preserving structure
 */
export async function generateMarkdownZip(
  rootNode: FileNode,
  settings: MarkdownSettings,
  metadata: ExportMetadata
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  const selectedFiles = getSelectedFiles(rootNode);
  
  // Generate combined README
  const combinedMarkdown = generateMarkdown(rootNode, settings, metadata);
  zip.file('README.md', combinedMarkdown);
  
  // Generate individual files preserving structure
  selectedFiles.forEach(file => {
    const markdownPath = file.path.replace(/\.[^/.]+$/, '') + '.md';
    
    let content = '';
    if (settings.includeFrontmatter) {
      content += '---\n';
      content += `source: "${file.path}"\n`;
      content += `language: "${file.language || 'text'}"\n`;
      content += `generated: "${new Date().toISOString()}"\n`;
      content += '---\n\n';
    }
    
    if (settings.fileHeaders) {
      content += `# ${file.name}\n\n`;
      content += `**Source:** \`${file.path}\`\n\n`;
    }
    
    const lang = settings.codeFenceLanguage ? (file.language || '') : '';
    content += `\`\`\`${lang}\n`;
    content += file.content || '';
    content += '\n\`\`\`\n';
    
    zip.file(markdownPath, content);
  });
  
  // Generate directory tree file
  if (settings.directoryTree) {
    zip.file('DIRECTORY_TREE.txt', generateTreeText(rootNode));
  }
  
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Generate PDF from selected files
 */
export async function generatePDF(
  rootNode: FileNode,
  settings: PDFSettings,
  metadata: ExportMetadata,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const selectedFiles = getSelectedFiles(rootNode);
  const totalSteps = 4 + selectedFiles.length;
  
  const updateProgress = (step: number, message: string) => {
    if (onProgress) {
      onProgress({
        step,
        totalSteps,
        message,
        percentage: Math.round((step / totalSteps) * 100),
        isComplete: false,
      });
    }
  };
  
  updateProgress(1, 'Initializing PDF document...');
  
  // Create PDF document
  const doc = new jsPDF({
    orientation: settings.orientation,
    unit: 'mm',
    format: settings.pageSize,
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  const lineHeight = settings.fontSize * 0.352778 * 1.5;
  
  updateProgress(2, 'Generating cover page...');
  
  // Cover page
  if (metadata.title || metadata.author) {
    generateCoverPage(doc, metadata, pageWidth, pageHeight);
    doc.addPage();
  }
  
  // Table of contents
  if (settings.tableOfContents) {
    updateProgress(3, 'Generating table of contents...');
    generateTableOfContents(doc, selectedFiles, pageWidth, margin);
    doc.addPage();
  }
  
  // Process each file
  let currentY = margin;
  let pageNumber = settings.tableOfContents ? 3 : (metadata.title ? 2 : 1);
  
  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    updateProgress(4 + i, `Processing ${file.name}...`);
    
    // Check if we need a new page
    if (currentY > pageHeight - margin - 20) {
      doc.addPage();
      currentY = margin;
      pageNumber++;
    }
    
    // File header
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, currentY, contentWidth, 10, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, margin, currentY + 10);
    
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(file.name, margin + 5, currentY + 6.5);
    
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(file.path, margin + 5, currentY + 10.5);
    
    currentY += 16;
    
    // Code content
    const content = file.content || '';
    const lines = content.split('\n');
    
    doc.setFontSize(settings.fontSize);
    doc.setTextColor(31, 41, 55);
    doc.setFont('courier', 'normal');
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const lineText = lines[lineIndex];
      
      // Check page overflow
      if (currentY > pageHeight - margin - 5) {
        if (settings.pageNumbers) {
          addPageNumber(doc, pageNumber, pageWidth, pageHeight, margin);
        }
        doc.addPage();
        currentY = margin;
        pageNumber++;
      }
      
      // Line number
      if (settings.lineNumbers) {
        doc.setTextColor(156, 163, 175);
        doc.setFontSize(settings.fontSize - 2);
        doc.text(String(lineIndex + 1), margin, currentY + lineHeight * 0.7);
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(settings.fontSize);
      }
      
      // Line content
      const lineX = settings.lineNumbers ? margin + 10 : margin;
      const maxLineWidth = contentWidth - (settings.lineNumbers ? 10 : 0);
      
      // Truncate long lines
      const truncatedLine = truncateLine(lineText, maxLineWidth, settings.fontSize, doc);
      doc.text(truncatedLine, lineX, currentY + lineHeight * 0.7);
      
      currentY += lineHeight;
    }
    
    // Page break between files
    if (i < selectedFiles.length - 1) {
      doc.addPage();
      currentY = margin;
      pageNumber++;
    }
  }
  
  // Final page number
  if (settings.pageNumbers) {
    addPageNumber(doc, pageNumber, pageWidth, pageHeight, margin);
  }
  
  updateProgress(totalSteps, 'Finalizing PDF...');
  
  return doc.output('blob');
}

/**
 * Generate HTML document for PDF rendering via html2canvas
 */
export async function generatePDFViaHTML(
  rootNode: FileNode,
  settings: PDFSettings,
  metadata: ExportMetadata,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const selectedFiles = getSelectedFiles(rootNode);
  const totalSteps = 3 + selectedFiles.length;
  
  const updateProgress = (step: number, message: string) => {
    if (onProgress) {
      onProgress({
        step,
        totalSteps,
        message,
        percentage: Math.round((step / totalSteps) * 100),
        isComplete: false,
      });
    }
  };
  
  updateProgress(1, 'Preparing HTML content...');
  
  // Generate HTML content
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${generatePDFStyles()}</style>
  <style>${generateHighlightStyles()}</style>
</head>
<body>`;
  
  // Cover page
  if (metadata.title) {
    html += `
    <div class="cover-page">
      <div class="cover-title">${escapeHtml(metadata.title)}</div>
      ${metadata.author ? `<div class="cover-meta">by ${escapeHtml(metadata.author)}</div>` : ''}
      ${metadata.date ? `<div class="cover-date">${escapeHtml(metadata.date)}</div>` : ''}
      ${metadata.description ? `<div class="cover-meta" style="margin-top: 32px; max-width: 400px;">${escapeHtml(metadata.description)}</div>` : ''}
    </div>`;
  }
  
  // Table of contents
  if (settings.tableOfContents) {
    html += `
    <div class="toc">
      <div class="toc-title">Table of Contents</div>`;
    selectedFiles.forEach((file, index) => {
      html += `<div class="toc-item"><span class="toc-path">${escapeHtml(file.path)}</span><span class="toc-page">${index + 1}</span></div>`;
    });
    html += `</div>`;
  }
  
  updateProgress(2, 'Processing code files...');
  
  // Files
  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    updateProgress(3 + i, `Highlighting ${file.name}...`);
    
    const highlightedCode = settings.syntaxHighlighting 
      ? highlightCode(file.content || '', file.language || 'text')
      : escapeHtml(file.content || '');
    
    html += `
    <div class="directory-section">
      <div class="file-header">
        ${escapeHtml(file.name)}
        <div class="file-path">${escapeHtml(file.path)}</div>
      </div>
      <div class="code-block">${highlightedCode}</div>
    </div>`;
    
    if (i < selectedFiles.length - 1) {
      html += '<div class="page-break"></div>';
    }
  }
  
  html += '</body></html>';
  
  updateProgress(totalSteps, 'Generating PDF...');
  
  // Create a hidden iframe to render the HTML
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    throw new Error('Could not access iframe document');
  }
  
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();
  
  // Wait for fonts to load
  await document.fonts.ready;
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate PDF using html2canvas
  const { default: html2canvas } = await import('html2canvas');
  const body = iframeDoc.body;
  
  const canvas = await html2canvas(body, {
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: 794,
  });
  
  document.body.removeChild(iframe);
  
  // Convert canvas to PDF
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: settings.orientation,
    unit: 'mm',
    format: settings.pageSize,
  });
  
  const imgWidth = doc.internal.pageSize.getWidth();
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  
  doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= doc.internal.pageSize.getHeight();
  
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    doc.addPage();
    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= doc.internal.pageSize.getHeight();
  }
  
  return doc.output('blob');
}

/**
 * Generate ZIP bundle with PDF files
 */
export async function generatePDFZip(
  rootNode: FileNode,
  settings: PDFSettings,
  metadata: ExportMetadata,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  const selectedFiles = getSelectedFiles(rootNode);
  
  // Generate combined PDF
  const combinedPDF = await generatePDF(rootNode, settings, metadata, onProgress);
  zip.file('combined.pdf', combinedPDF);
  
  // Generate individual PDFs
  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const singleFileRoot: FileNode = {
      ...rootNode,
      children: [],
    };
    
    // Create a minimal root with just this file
    const fileNode = { ...file };
    singleFileRoot.children = [fileNode];
    
    const fileMetadata = {
      ...metadata,
      title: file.name,
    };
    
    const pdfBlob = await generatePDF(singleFileRoot, settings, fileMetadata);
    const pdfPath = file.path.replace(/\.[^/.]+$/, '') + '.pdf';
    zip.file(pdfPath, pdfBlob);
  }
  
  return await zip.generateAsync({ type: 'blob' });
}

// Helper: Generate cover page
function generateCoverPage(
  doc: any,
  metadata: ExportMetadata,
  pageWidth: number,
  pageHeight: number
): void {
  const centerX = pageWidth / 2;
  let currentY = pageHeight / 3;
  
  if (metadata.title) {
    doc.setFontSize(24);
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.text(metadata.title, centerX, currentY, { align: 'center' });
    currentY += 15;
  }
  
  if (metadata.author) {
    doc.setFontSize(14);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(`by ${metadata.author}`, centerX, currentY, { align: 'center' });
    currentY += 10;
  }
  
  if (metadata.date) {
    doc.setFontSize(11);
    doc.setTextColor(156, 163, 175);
    doc.text(metadata.date, centerX, currentY, { align: 'center' });
    currentY += 15;
  }
  
  if (metadata.description) {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    const splitDesc = doc.splitTextToSize(metadata.description, pageWidth - 80);
    doc.text(splitDesc, centerX, currentY, { align: 'center' });
  }
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
}

// Helper: Generate table of contents
function generateTableOfContents(
  doc: any,
  files: FileNode[],
  pageWidth: number,
  margin: number
): void {
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', margin, margin + 10);
  
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  
  let currentY = margin + 25;
  
  files.forEach((file, index) => {
    // Check page overflow
    if (currentY > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      currentY = margin + 10;
    }
    
    doc.setTextColor(31, 41, 55);
    doc.text(file.path, margin, currentY);
    
    doc.setTextColor(156, 163, 175);
    doc.text(String(index + 1), pageWidth - margin, currentY, { align: 'right' });
    
    // Dotted line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    const textWidth = doc.getTextWidth(file.path);
    const pageNumWidth = doc.getTextWidth(String(index + 1));
    doc.line(
      margin + textWidth + 5,
      currentY - 1,
      pageWidth - margin - pageNumWidth - 5,
      currentY - 1
    );
    
    currentY += 8;
  });
}

// Helper: Add page number
function addPageNumber(
  doc: any,
  pageNum: number,
  pageWidth: number,
  pageHeight: number,
  margin: number
): void {
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  doc.text(
    String(pageNum),
    pageWidth / 2,
    pageHeight - margin + 5,
    { align: 'center' }
  );
}

// Helper: Truncate line to fit width
function truncateLine(
  line: string,
  maxWidth: number,
  fontSize: number,
  _doc: any
): string {
  const charWidth = fontSize * 0.352778 * 0.6;
  const maxChars = Math.floor(maxWidth / charWidth);
  
  if (line.length > maxChars) {
    return line.substring(0, maxChars - 3) + '...';
  }
  
  return line;
}
