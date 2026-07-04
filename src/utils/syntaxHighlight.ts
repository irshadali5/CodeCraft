import Prism from 'prismjs';

// Import common language components for Prism
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-dart';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-r';
import 'prismjs/components/prism-perl';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-vim';

/**
 * Highlight code using Prism.js
 */
export function highlightCode(code: string, language: string): string {
  const grammar = Prism.languages[language] || Prism.languages.plaintext;
  return Prism.highlight(code, grammar, language);
}

/**
 * Get Prism grammar for a language
 */
export function getLanguageGrammar(language: string): Prism.Grammar | undefined {
  return Prism.languages[language];
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Wrap highlighted code in HTML structure with line numbers
 */
export function wrapWithLineNumbers(
  highlightedCode: string,
  options: { showLineNumbers: boolean; startLine?: number }
): string {
  if (!options.showLineNumbers) {
    return `<pre class="code-block"><code>${highlightedCode}</code></pre>`;
  }

  const lines = highlightedCode.split('\n');
  const startLine = options.startLine || 1;
  
  let result = '<div class="code-container">';
  result += '<table class="code-table">';
  
  lines.forEach((line, index) => {
    const lineNum = startLine + index;
    const lineContent = line || ' ';
    result += `<tr>`;
    result += `<td class="line-number">${lineNum}</td>`;
    result += `<td class="line-content"><pre>${lineContent}</pre></td>`;
    result += `</tr>`;
  });
  
  result += '</table>';
  result += '</div>';
  
  return result;
}

/**
 * Generate CSS styles for syntax highlighting
 */
export function generateHighlightStyles(): string {
  return `
    .code-container {
      overflow-x: auto;
      background: #0d1117;
      border-radius: 8px;
      padding: 16px;
    }
    
    .code-table {
      border-collapse: collapse;
      width: 100%;
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.6;
    }
    
    .code-table td {
      padding: 0;
      vertical-align: top;
    }
    
    .line-number {
      color: #484f58;
      text-align: right;
      padding-right: 16px !important;
      padding-left: 8px !important;
      min-width: 40px;
      user-select: none;
      border-right: 1px solid #21262d;
    }
    
    .line-content {
      padding-left: 16px !important;
      color: #c9d1d9;
    }
    
    .line-content pre {
      margin: 0;
      white-space: pre;
      word-wrap: normal;
    }
    
    /* Token colors - GitHub Dark inspired */
    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      color: #8b949e;
    }
    
    .token.punctuation {
      color: #c9d1d9;
    }
    
    .token.property,
    .token.tag,
    .token.boolean,
    .token.number,
    .token.constant,
    .token.symbol,
    .token.deleted {
      color: #79c0ff;
    }
    
    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin,
    .token.inserted {
      color: #a5d6ff;
    }
    
    .token.operator,
    .token.entity,
    .token.url,
    .language-css .token.string,
    .style .token.string {
      color: #d2a8ff;
    }
    
    .token.atrule,
    .token.attr-value,
    .token.keyword {
      color: #ff7b72;
    }
    
    .token.function,
    .token.class-name {
      color: #d2a8ff;
    }
    
    .token.regex,
    .token.important,
    .token.variable {
      color: #ffa657;
    }
    
    .token.important,
    .token.bold {
      font-weight: bold;
    }
    
    .token.italic {
      font-style: italic;
    }
    
    .token.entity {
      cursor: help;
    }
    
    /* TypeScript/JavaScript specific */
    .token-parameter {
      color: #ffa657;
    }
    
    .token.interpolation {
      color: #79c0ff;
    }
    
    .token.interpolation-punctuation {
      color: #79c0ff;
    }
    
    /* JSX/TSX specific */
    .token.script-punctuation {
      color: #ff7b72;
    }
    
    .token.spread {
      color: #ff7b72;
    }
    
    /* Special highlighting for different languages */
    .language-python .token.keyword {
      color: #ff7b72;
    }
    
    .language-python .token.builtin {
      color: #79c0ff;
    }
    
    .language-python .token.decorator {
      color: #ffa657;
    }
    
    .language-rust .token.keyword {
      color: #ff7b72;
    }
    
    .language-rust .token.macro {
      color: #d2a8ff;
    }
    
    .language-go .token.keyword {
      color: #ff7b72;
    }
    
    .language-go .token.builtin {
      color: #79c0ff;
    }
    
    .language-java .token.keyword {
      color: #ff7b72;
    }
    
    .language-java .token.annotation {
      color: #ffa657;
    }
  `;
}

/**
 * Generate CSS for PDF export (light theme)
 */
export function generatePDFStyles(): string {
  return `
    @page {
      margin: 15mm;
      size: A4 portrait;
    }
    
    body {
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 10px;
      line-height: 1.5;
      color: #1f2937;
      background: white;
    }
    
    .file-header {
      background: #f3f4f6;
      border-left: 4px solid #3b82f6;
      padding: 12px 16px;
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      page-break-inside: avoid;
    }
    
    .file-path {
      font-size: 11px;
      color: #6b7280;
      font-weight: 400;
      margin-top: 4px;
    }
    
    .code-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      white-space: pre;
      font-size: 9px;
      line-height: 1.5;
      page-break-inside: avoid;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    .directory-section {
      margin-bottom: 32px;
    }
    
    /* Light theme token colors */
    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      color: #6b7280;
    }
    
    .token.punctuation {
      color: #374151;
    }
    
    .token.property,
    .token.tag,
    .token.boolean,
    .token.number,
    .token.constant,
    .token.symbol,
    .token.deleted {
      color: #2563eb;
    }
    
    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin,
    .token.inserted {
      color: #059669;
    }
    
    .token.operator,
    .token.entity,
    .token.url {
      color: #7c3aed;
    }
    
    .token.atrule,
    .token.attr-value,
    .token.keyword {
      color: #dc2626;
    }
    
    .token.function,
    .token.class-name {
      color: #7c3aed;
    }
    
    .token.regex,
    .token.important,
    .token.variable {
      color: #d97706;
    }
    
    /* Cover page */
    .cover-page {
      text-align: center;
      padding: 80px 40px;
      page-break-after: always;
    }
    
    .cover-title {
      font-size: 32px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 16px;
    }
    
    .cover-meta {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .cover-date {
      font-size: 12px;
      color: #9ca3af;
    }
    
    /* Table of contents */
    .toc {
      page-break-after: always;
    }
    
    .toc-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 24px;
      color: #111827;
    }
    
    .toc-item {
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 12px;
    }
    
    .toc-path {
      color: #6b7280;
    }
    
    .toc-page {
      float: right;
      color: #9ca3af;
    }
  `;
}
