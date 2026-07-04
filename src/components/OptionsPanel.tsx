import { useState } from 'react';
import { FileText, FileCode, FileArchive, Settings2, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useFileStore } from '@/hooks/useFileStore';
import type { ExportFormat } from '@/types';
import { getSelectedFiles } from '@/utils/fileSystem';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export function OptionsPanel({ onExport }: { onExport: () => void }) {
  const { rootNode, settings, setFormat, updatePDFSettings, updateMarkdownSettings, updateMetadata, isExporting } = useFileStore();
  const [showMetadata, setShowMetadata] = useState(true);
  
  const selectedCount = rootNode ? getSelectedFiles(rootNode).length : 0;
  
  const formatOptions: { value: ExportFormat; label: string; icon: React.ReactNode; desc: string }[] = [
    { 
      value: 'pdf', 
      label: 'PDF', 
      icon: <FileText className="w-5 h-5" />,
      desc: 'Formatted document'
    },
    { 
      value: 'markdown', 
      label: 'Markdown', 
      icon: <FileCode className="w-5 h-5" />,
      desc: 'MD files'
    },
    { 
      value: 'zip', 
      label: 'ZIP Bundle', 
      icon: <FileArchive className="w-5 h-5" />,
      desc: 'Combined archive'
    },
  ];
  
  return (
    <div className="w-[320px] flex-shrink-0 bg-[#111827] border-l border-white/5 flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-white/5 flex items-center px-4">
        <Settings2 className="w-4 h-4 text-slate-500 mr-2" />
        <span className="text-sm font-semibold text-slate-300">Export Options</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-6">
          
          {/* Format Selection */}
          <section>
            <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
              Output Format
            </Label>
            <div className="space-y-2">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormat(option.value)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left",
                    settings.format === option.value
                      ? "border-cyan-500/40 bg-cyan-500/5"
                      : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    settings.format === option.value ? "bg-cyan-500/15 text-cyan-400" : "bg-slate-800 text-slate-500"
                  )}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-sm font-medium",
                      settings.format === option.value ? "text-slate-200" : "text-slate-400"
                    )}>
                      {option.label}
                    </div>
                    <div className="text-[10px] text-slate-600">{option.desc}</div>
                  </div>
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    settings.format === option.value ? "border-cyan-400" : "border-slate-600"
                  )}>
                    {settings.format === option.value && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
          
          <Separator className="bg-white/5" />
          
          {/* PDF Settings */}
          {settings.format === 'pdf' && (
            <section>
              <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
                PDF Settings
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Line Numbers</span>
                  <Switch
                    checked={settings.pdf.lineNumbers}
                    onCheckedChange={(checked) => updatePDFSettings({ lineNumbers: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Syntax Highlighting</span>
                  <Switch
                    checked={settings.pdf.syntaxHighlighting}
                    onCheckedChange={(checked) => updatePDFSettings({ syntaxHighlighting: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Table of Contents</span>
                  <Switch
                    checked={settings.pdf.tableOfContents}
                    onCheckedChange={(checked) => updatePDFSettings({ tableOfContents: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Page Numbers</span>
                  <Switch
                    checked={settings.pdf.pageNumbers}
                    onCheckedChange={(checked) => updatePDFSettings({ pageNumbers: checked })}
                  />
                </div>
                
                <div className="pt-2">
                  <Label className="text-[10px] text-slate-500 mb-1.5 block">Font Size</Label>
                  <div className="flex gap-1">
                    {[8, 9, 10, 11, 12].map((size) => (
                      <button
                        key={size}
                        onClick={() => updatePDFSettings({ fontSize: size as 8 | 9 | 10 | 11 | 12 })}
                        className={cn(
                          "flex-1 py-1.5 text-xs rounded-md transition-all duration-150 font-mono",
                          settings.pdf.fontSize === size
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                            : "bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:border-slate-600"
                        )}
                      >
                        {size}pt
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2">
                  <Label className="text-[10px] text-slate-500 mb-1.5 block">Page Size</Label>
                  <div className="flex gap-1">
                    {['a4', 'letter', 'legal'].map((size) => (
                      <button
                        key={size}
                        onClick={() => updatePDFSettings({ pageSize: size as 'a4' | 'letter' | 'legal' })}
                        className={cn(
                          "flex-1 py-1.5 text-xs rounded-md transition-all duration-150 capitalize",
                          settings.pdf.pageSize === size
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                            : "bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:border-slate-600"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
          
          {/* Markdown Settings */}
          {(settings.format === 'markdown' || settings.format === 'zip') && (
            <section>
              <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
                Markdown Settings
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Frontmatter</span>
                  <Switch
                    checked={settings.markdown.includeFrontmatter}
                    onCheckedChange={(checked) => updateMarkdownSettings({ includeFrontmatter: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">File Headers</span>
                  <Switch
                    checked={settings.markdown.fileHeaders}
                    onCheckedChange={(checked) => updateMarkdownSettings({ fileHeaders: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Code Fence Language</span>
                  <Switch
                    checked={settings.markdown.codeFenceLanguage}
                    onCheckedChange={(checked) => updateMarkdownSettings({ codeFenceLanguage: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Directory Tree</span>
                  <Switch
                    checked={settings.markdown.directoryTree}
                    onCheckedChange={(checked) => updateMarkdownSettings({ directoryTree: checked })}
                  />
                </div>
                
                <div className="pt-2">
                  <Label className="text-[10px] text-slate-500 mb-1.5 block">Separator</Label>
                  <select
                    value={settings.markdown.separatorStyle}
                    onChange={(e) => updateMarkdownSettings({ separatorStyle: e.target.value as 'hr' | 'page-break' | 'comment' })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="hr">Horizontal Rule</option>
                    <option value="page-break">Page Break</option>
                    <option value="comment">HTML Comment</option>
                  </select>
                </div>
              </div>
            </section>
          )}
          
          <Separator className="bg-white/5" />
          
          {/* Metadata */}
          <section>
            <button 
              onClick={() => setShowMetadata(!showMetadata)}
              className="flex items-center justify-between w-full mb-3"
            >
              <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer">
                Document Metadata
              </Label>
              {showMetadata ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>
            
            {showMetadata && (
              <div className="space-y-3">
                <div>
                  <Label className="text-[10px] text-slate-600 mb-1 block">Title</Label>
                  <Input
                    value={settings.metadata.title}
                    onChange={(e) => updateMetadata({ title: e.target.value })}
                    placeholder="My Project"
                    className="h-8 bg-slate-800/50 border-slate-700/50 text-xs text-slate-300 placeholder:text-slate-600 focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-600 mb-1 block">Author</Label>
                  <Input
                    value={settings.metadata.author}
                    onChange={(e) => updateMetadata({ author: e.target.value })}
                    placeholder="Your Name"
                    className="h-8 bg-slate-800/50 border-slate-700/50 text-xs text-slate-300 placeholder:text-slate-600 focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-600 mb-1 block">Date</Label>
                  <Input
                    type="date"
                    value={settings.metadata.date}
                    onChange={(e) => updateMetadata({ date: e.target.value })}
                    className="h-8 bg-slate-800/50 border-slate-700/50 text-xs text-slate-300 placeholder:text-slate-600 focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-600 mb-1 block">Description</Label>
                  <textarea
                    value={settings.metadata.description}
                    onChange={(e) => updateMetadata({ description: e.target.value })}
                    placeholder="Project description..."
                    rows={2}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-md px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      
      {/* Export button */}
      <div className="p-4 border-t border-white/5">
        <Button
          onClick={onExport}
          disabled={isExporting || selectedCount === 0}
          className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg gap-2 disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export {settings.format.toUpperCase()}
            </>
          )}
        </Button>
        <p className="text-[10px] text-slate-600 text-center mt-2">
          {selectedCount} file{selectedCount !== 1 ? 's' : ''} will be exported
        </p>
      </div>
    </div>
  );
}
