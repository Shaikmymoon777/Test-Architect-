
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { ProjectMetadata } from '../types';

interface ResultViewProps {
  content: string;
  metadata: ProjectMetadata;
  onReset: () => void;
}

interface VerificationStatus {
  verified: boolean;
  issues: string[];
  stats: {
    tables: number;
    lists: number;
    headings: number;
  };
}

declare const html2pdf: any;

const ResultView: React.FC<ResultViewProps> = ({ content, metadata, onReset }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifStatus, setVerifStatus] = useState<VerificationStatus | null>(null);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveHeading(targetId);
    }
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyExportIntegrity = (): VerificationStatus => {
    const issues: string[] = [];
    const stats = { tables: 0, lists: 0, headings: 0 };
    
    if (!reportRef.current) return { verified: false, issues: ['Report element not found'], stats };

    const element = reportRef.current;
    const containerWidth = element.offsetWidth;

    const tables = element.querySelectorAll('table');
    stats.tables = tables.length;
    tables.forEach((table, idx) => {
      if (table.offsetWidth > containerWidth + 20) {
        issues.push(`Table ${idx + 1} may exceed printable area.`);
      }
    });

    const lists = element.querySelectorAll('ul, ol, div[class*="list-container"]');
    stats.lists = lists.length;

    const headings = element.querySelectorAll('h1, h2, h3');
    stats.headings = headings.length;
    
    return {
      verified: issues.length === 0,
      issues,
      stats
    };
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    setIsVerifying(true);
    const element = reportRef.current;
    
    const status = verifyExportIntegrity();
    
    // Inject print-only styles to ensure proper layout and prevent truncation
    // Fix: Ensure the captured element doesn't inherit parent shifts
    const style = document.createElement('style');
    style.innerHTML = `
      h1 { page-break-before: always !important; margin-top: 0 !important; }
      .cover { page-break-before: avoid !important; margin-top: 0 !important; }
      table { page-break-inside: auto !important; width: 100% !important; margin-bottom: 24px !important; table-layout: fixed !important; }
      thead { display: table-header-group !important; }
      tr { page-break-inside: avoid !important; page-break-after: auto !important; }
      h2, h3, h4 { page-break-after: avoid !important; margin-top: 32px !important; }
      .list-container { page-break-inside: auto !important; }
      .list-item { page-break-inside: avoid !important; }
      p { page-break-inside: auto !important; orphans: 3; widows: 3; }
      /* Ensure absolute positioning doesn't interfere with capture */
      #root { overflow: visible !important; }
    `;
    document.head.appendChild(style);

    const opt = {
      margin: [0.75, 0.75, 0.75, 0.75],
      filename: `Test_Plan_${metadata.projectName.replace(/\s+/g, '_')}_v${metadata.version}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false,
        // CRITICAL: Prevent layout shift by resetting scroll positions during capture
        scrollX: 0,
        scrollY: 0,
        // CRITICAL: Control the capture width to ensure content is centered
        windowWidth: 850 
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait', compress: true },
      pagebreak: { 
        mode: ['css', 'legacy'],
        avoid: ['h1', 'h2', 'h3', 'tr']
      }
    };

    try {
      // Execute capture
      await html2pdf().set(opt).from(element).save();
      setVerifStatus(status);
      setTimeout(() => setVerifStatus(null), 8000);
    } catch (err) {
      console.error("PDF Export failed:", err);
    } finally {
      document.head.removeChild(style);
      setIsVerifying(false);
    }
  };

  const handleDownloadWord = () => {
    if (!reportRef.current) return;
    
    const styles = `
      <style>
        @page { size: 8.5in 11in; margin: 1in; mso-header-margin: .5in; mso-footer-margin: .5in; }
        body { font-family: 'Segoe UI', 'Calibri', 'Arial', sans-serif; color: #1a1a1a; line-height: 1.5; }
        
        h1 { 
          color: #1e40af; 
          border-bottom: 3.0pt solid #2563eb; 
          padding-top: 18pt; 
          padding-bottom: 12pt; 
          font-size: 24pt; 
          font-weight: bold;
          text-transform: uppercase; 
          page-break-before: always; 
          margin-top: 36pt; 
          margin-bottom: 24pt;
        }
        h2 { 
          color: #1e3a8a; 
          border-left: 10pt solid #3b82f6; 
          padding-left: 12pt; 
          padding-top: 12pt;
          padding-bottom: 12pt;
          font-size: 18pt; 
          font-weight: bold;
          margin-top: 28pt; 
          margin-bottom: 14pt;
          background-color: #f8fafc;
        }
        h3 {
          color: #334155;
          font-size: 14pt;
          font-weight: bold;
          margin-top: 22pt;
          margin-bottom: 10pt;
          border-bottom: 1pt solid #e2e8f0;
          padding-bottom: 4pt;
        }

        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin-top: 12pt; 
          margin-bottom: 12pt; 
          border: 1pt solid #cbd5e1;
        }
        th { 
          background-color: #f1f5f9; 
          border: 1pt solid #cbd5e1; 
          padding: 8pt; 
          font-weight: bold; 
          font-size: 10pt; 
          color: #1e293b;
          text-align: left;
        }
        td { 
          border: 1pt solid #e2e8f0; 
          padding: 8pt; 
          font-size: 10pt; 
          vertical-align: top;
          color: #334155;
        }

        p { margin-bottom: 10pt; font-size: 11pt; text-align: justify; }
        ul, ol { margin-bottom: 12pt; margin-left: 24pt; }
        li { margin-bottom: 6pt; font-size: 11pt; }
        
        .cover { text-align: center; margin-bottom: 120pt; padding-top: 80pt; }
        .cover h1 { border: none; font-size: 42pt; page-break-before: avoid; margin-top: 0; }
        
        .footer { 
          margin-top: 60pt; 
          border-top: 1.5pt solid #e2e8f0; 
          padding-top: 12pt; 
          font-size: 9pt; 
          color: #64748b; 
        }
      </style>
    `;

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head><meta charset='utf-8'><title>Test Plan Document</title>${styles}</head><body>`;
    const footer = "</body></html>";
    const sourceHTML = header + reportRef.current.innerHTML + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Test_Plan_${metadata.projectName.replace(/\s+/g, '_')}_v${metadata.version}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tableOfContents = useMemo(() => {
    const lines = content.split('\n');
    return lines
      .filter(line => line.startsWith('# ') || line.startsWith('## '))
      .map(line => ({
        text: line.replace(/^#+\s+/, ''),
        level: line.startsWith('# ') ? 1 : 2,
        id: slugify(line.replace(/^#+\s+/, ''))
      }));
  }, [content]);

  const renderedContent = useMemo(() => {
    if (!content) return null;
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    const processBoldAndLinks = (str: string) => {
      const linkParts = str.split(/(\[.*?\]\(#.*?\))/g);
      return linkParts.map((part, lIdx) => {
        const linkMatch = part.match(/\[(.*?)\]\(#(.*?)\)/);
        if (linkMatch) {
          const targetId = linkMatch[2];
          return (
            <a key={`link-${lIdx}`} href={`#${targetId}`} onClick={(e) => handleAnchorClick(e, targetId)} className="text-blue-600 hover:underline font-medium">
              {linkMatch[1]}
            </a>
          );
        }
        const boldParts = part.split(/(\*\*.*?\*\*)/g);
        return boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('**') && bPart.endsWith('**')) {
            return <strong key={`bold-${lIdx}-${bIdx}`} className="font-bold text-slate-900">{bPart.slice(2, -2)}</strong>;
          }
          return bPart;
        });
      });
    };

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('|')) {
        const tableRows: string[][] = [];
        let j = i;
        while (j < lines.length && lines[j].trim().startsWith('|')) {
          const cells = lines[j].split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
          if (!cells.every(c => c.match(/^[:\s\-]+$/))) tableRows.push(cells);
          j++;
        }
        if (tableRows.length > 0) {
          elements.push(
            <div key={`table-${i}`} className="my-8 w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm print:overflow-visible">
              <table className="min-w-full divide-y divide-slate-200 border-collapse table-auto">
                <thead className="bg-slate-50">
                  <tr>
                    {tableRows[0]?.map((cell, idx) => (
                      <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase border border-slate-200 bg-slate-100">
                        {processBoldAndLinks(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {tableRows.slice(1).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-3 text-xs text-slate-600 align-top border border-slate-100 break-words">
                          {processBoldAndLinks(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        i = j;
        continue;
      }

      if (line.startsWith('# ')) {
        const text = line.replace('# ', '');
        elements.push(<h1 id={slugify(text)} key={i} className="text-3xl font-black text-slate-900 border-b-4 border-blue-600 pb-3 mt-16 mb-8 uppercase tracking-tight">{processBoldAndLinks(text)}</h1>);
      } else if (line.startsWith('## ')) {
        const text = line.replace('## ', '');
        elements.push(<h2 id={slugify(text)} key={i} className="text-2xl font-bold text-slate-800 mt-12 mb-6 border-l-8 border-blue-500 pl-4 py-1">{processBoldAndLinks(text)}</h2>);
      } else if (line.startsWith('### ')) {
        const text = line.replace('### ', '');
        elements.push(<h3 id={slugify(text)} key={i} className="text-xl font-bold text-slate-700 mt-8 mb-4 flex items-center gap-3"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span>{processBoldAndLinks(text)}</h3>);
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || /^\d+\.\s/.test(trimmedLine)) {
        const listItems: { text: string; type: 'bullet' | 'number'; indent: number }[] = [];
        let j = i;
        while (j < lines.length) {
          const l = lines[j];
          const trimmed = l.trim();
          const indent = l.search(/\S/);
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            listItems.push({ text: trimmed.replace(/^[-*]\s/, ''), type: 'bullet', indent });
          } else if (/^\d+\.\s/.test(trimmed)) {
            listItems.push({ text: trimmed.replace(/^\d+\.\s/, ''), type: 'number', indent });
          } else break;
          j++;
        }
        elements.push(
          <div key={`list-container-${i}`} className="my-6 space-y-2 list-container">
            {listItems.map((item, idx) => (
              <div key={idx} className="flex gap-3 text-slate-700 leading-relaxed text-sm md:text-base list-item" style={{ marginLeft: `${item.indent * 0.75}rem` }}>
                <span className="text-blue-500 font-black shrink-0">{item.type === 'bullet' ? '•' : `${idx + 1}.`}</span>
                <span>{processBoldAndLinks(item.text)}</span>
              </div>
            ))}
          </div>
        );
        i = j - 1;
      } else if (trimmedLine !== '') {
        elements.push(<p key={i} className="text-slate-700 leading-relaxed mb-4 text-justify">{processBoldAndLinks(line)}</p>);
      }
      i++;
    }
    return elements;
  }, [content]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 relative">
      <aside className="hidden lg:block w-72 shrink-0 no-print">
        <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Navigation</h3>
          <nav className="space-y-1">
            {tableOfContents.map((item, idx) => (
              <a
                key={idx}
                href={`#${item.id}`}
                onClick={(e) => handleAnchorClick(e, item.id)}
                className={`block py-1.5 text-sm transition-all ${
                  item.level === 1 ? 'font-bold text-slate-900 mt-3 border-b border-slate-50' : 'pl-4 text-slate-500 hover:text-blue-600'
                } ${activeHeading === item.id ? 'text-blue-600 border-l-2 border-blue-600 pl-4 bg-blue-50/50' : ''}`}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-grow space-y-8 max-w-full lg:max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 no-print">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Test Report</h2>
            <p className="text-slate-500 font-medium text-sm">IEEE 829 Engineering Document</p>
          </div>
          <div className="flex flex-wrap gap-2 relative">
            <button
              onClick={handleCopyMarkdown}
              className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm ${copied ? 'bg-green-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            >
              {copied ? 'Copied!' : 'Markdown'}
            </button>
            <button
              onClick={handleDownloadWord}
              className="px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 transition shadow-sm font-bold flex items-center gap-2"
            >
              Word
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isVerifying}
              className={`px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-bold flex items-center gap-2 group ${isVerifying ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isVerifying ? 'Processing...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {verifStatus && (
          <div className={`p-4 rounded-xl border no-print animate-in slide-in-from-top-2 ${verifStatus.verified ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            <div className="flex items-center gap-2 font-bold text-sm mb-1 uppercase tracking-wider">
              <span className={`w-2 h-2 rounded-full ${verifStatus.verified ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              Integrity Status: {verifStatus.verified ? 'Verified for Printing' : 'Formatting Warning'}
            </div>
            <p className="text-xs opacity-90">{verifStatus.verified ? 'Document validated for professional standard layout.' : `Issues detected: ${verifStatus.issues.join(', ')}`}</p>
          </div>
        )}

        <div className="relative group mx-auto">
          <div 
            ref={reportRef}
            id="test-plan-container"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 md:p-16 print:p-0 min-h-[1100px] text-slate-800"
            style={{ fontFamily: "'Inter', sans-serif", lineHeight: '1.6' }}
          >
            <div className="mb-24 pb-16 border-b-8 border-blue-600 text-center cover">
              <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-10">
                Official Quality Assurance Document
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 uppercase tracking-tight leading-none break-words">
                {metadata.projectName}
              </h1>
              <div className="h-2 w-48 bg-blue-600 mx-auto mb-12"></div>
              <h2 className="text-3xl md:text-4xl text-slate-500 font-bold tracking-tight mb-20">SYSTEM TEST PLAN</h2>
              
              <div className="mt-20 grid grid-cols-2 max-w-lg mx-auto gap-y-8 text-sm md:text-base border-y border-slate-100 py-12">
                <div className="text-slate-400 text-right pr-8 uppercase tracking-widest text-[10px] font-black">Release Version</div>
                <div className="text-slate-900 text-left pl-8 font-black">{metadata.version}</div>
                <div className="text-slate-400 text-right pr-8 uppercase tracking-widest text-[10px] font-black">Generation Date</div>
                <div className="text-slate-900 text-left pl-8 font-black">{metadata.date}</div>
                <div className="text-slate-400 text-right pr-8 uppercase tracking-widest text-[10px] font-black">Lead Architect</div>
                <div className="text-slate-900 text-left pl-8 font-black">{metadata.preparedBy}</div>
              </div>
            </div>

            <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24">
              {renderedContent}
            </div>

            <div className="mt-32 pt-16 border-t-2 border-slate-100 footer">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                <div className="space-y-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Authored By</p>
                  <p className="text-sm font-black text-slate-800">{metadata.preparedBy}</p>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Authorized By</p>
                  <p className="text-sm font-black text-slate-800">{metadata.approvedBy || 'Pending Signature'}</p>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Document Ref</p>
                  <p className="text-sm font-mono text-slate-500 uppercase font-black">#TP-{Date.now().toString(36).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-16 no-print">
          <button
            onClick={onReset}
            className="group px-12 py-5 bg-slate-900 text-white rounded-2xl hover:bg-black font-black flex items-center gap-4 transition-all transform hover:scale-105 shadow-2xl"
          >
            Generate New Architecture
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
