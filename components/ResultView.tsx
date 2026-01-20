
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { ProjectMetadata } from '../types';
import { updateTestPlan } from '../services/geminiService';

interface ResultViewProps {
  content: string;
  metadata: ProjectMetadata;
  onReset: () => void;
  onUpdate: (newContent: string) => void;
}

// Sub-component for animating text modification
const AnimatedText: React.FC<{ text: string; animate: boolean }> = ({ text, animate }) => {
  const [displayedText, setDisplayedText] = useState(animate ? "" : text);

  useEffect(() => {
    if (!animate) {
      setDisplayedText(text);
      return;
    }

    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 2); // Fast "letter modifying" speed

    return () => clearInterval(interval);
  }, [text, animate]);

  return <>{displayedText}</>;
};

declare const html2pdf: any;

const ResultView: React.FC<ResultViewProps> = ({ content, metadata, onReset, onUpdate }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [wasJustModified, setWasJustModified] = useState(false);

  const slugify = (text: string) => {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
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
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setActiveHeading(targetId);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isModifying) return;

    const instruction = chatInput;
    setChatInput('');
    setIsModifying(true);
    
    try {
      const updatedContent = await updateTestPlan(content, instruction, metadata);
      setWasJustModified(true);
      onUpdate(updatedContent);
      // Reset modification flag after animation cycle
      setTimeout(() => setWasJustModified(false), 5000);
    } catch (err) {
      alert("Failed to update document. Please try again.");
    } finally {
      setIsModifying(false);
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
          border-bottom: 2.0pt solid #2563eb; 
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
    link.download = `Test_Plan_${metadata.projectName.replace(/\s+/g, '_')}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsVerifying(true);
    const element = reportRef.current;
    const style = document.createElement('style');
    style.innerHTML = `
      h1 { page-break-before: always !important; margin-top: 0 !important; }
      table { page-break-inside: auto !important; width: 100% !important; margin-bottom: 24px !important; table-layout: fixed !important; }
      tr { page-break-inside: avoid !important; }
      #root { overflow: visible !important; }
    `;
    document.head.appendChild(style);

    const opt = {
      margin: [0.75, 0.75, 0.75, 0.75],
      filename: `Test_Plan_${metadata.projectName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollX: 0, scrollY: 0, windowWidth: 850 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['h1', 'h2', 'h3', 'tr'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
    } finally {
      document.head.removeChild(style);
      setIsVerifying(false);
    }
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
              <AnimatedText text={linkMatch[1]} animate={wasJustModified} />
            </a>
          );
        }
        const boldParts = part.split(/(\*\*.*?\*\*)/g);
        return boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('**') && bPart.endsWith('**')) {
            return <strong key={`bold-${lIdx}-${bIdx}`} className="font-bold text-slate-900"><AnimatedText text={bPart.slice(2, -2)} animate={wasJustModified} /></strong>;
          }
          return <AnimatedText key={bIdx} text={bPart} animate={wasJustModified} />;
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
                  <tr>{tableRows[0]?.map((cell, idx) => <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase border border-slate-200 bg-slate-100">{processBoldAndLinks(cell)}</th>)}</tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {tableRows.slice(1).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                      {row.map((cell, cellIdx) => <td key={cellIdx} className="px-4 py-3 text-xs text-slate-600 align-top border border-slate-100 break-words">{processBoldAndLinks(cell)}</td>)}
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
        elements.push(<div key={i} className="my-2 flex gap-3 text-slate-700 leading-relaxed text-sm md:text-base list-item"><span>•</span><span>{processBoldAndLinks(trimmedLine.replace(/^[-*]\s/, ''))}</span></div>);
      } else if (trimmedLine !== '') {
        elements.push(<p key={i} className="text-slate-700 leading-relaxed mb-4 text-justify">{processBoldAndLinks(line)}</p>);
      }
      i++;
    }
    return elements;
  }, [content, wasJustModified]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-32 relative">
      <aside className="hidden lg:block w-72 shrink-0 no-print">
        <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Navigation</h3>
            <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold border border-green-100">Autosaved</span>
          </div>
          <nav className="space-y-1">
            {tableOfContents.map((item, idx) => (
              <a key={idx} href={`#${item.id}`} onClick={(e) => handleAnchorClick(e, item.id)} className={`block py-1.5 text-sm transition-all ${item.level === 1 ? 'font-bold text-slate-900 mt-3 border-b border-slate-50' : 'pl-4 text-slate-500 hover:text-blue-600'} ${activeHeading === item.id ? 'text-blue-600 border-l-2 border-blue-600 pl-4 bg-blue-50/50' : ''}`}>
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
            <button onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm ${copied ? 'bg-green-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
              {copied ? 'Copied!' : 'Markdown'}
            </button>
            <button onClick={handleDownloadWord} className="px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 transition shadow-sm font-bold flex items-center gap-2">
              Word
            </button>
            <button onClick={handleDownloadPDF} disabled={isVerifying} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg font-bold flex items-center gap-2">
              {isVerifying ? 'Processing...' : 'Export PDF'}
            </button>
          </div>
        </div>

        <div className="relative group mx-auto">
          <div ref={reportRef} id="test-plan-container" className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 md:p-16 print:p-0 min-h-[1100px] text-slate-800" style={{ fontFamily: "'Inter', sans-serif", lineHeight: '1.6' }}>
            <div className="mb-24 pb-16 border-b-8 border-blue-600 text-center cover">
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 uppercase tracking-tight leading-none break-words">{metadata.projectName}</h1>
              <h2 className="text-3xl md:text-4xl text-slate-500 font-bold tracking-tight mb-20">SYSTEM TEST PLAN</h2>
              <div className="mt-20 grid grid-cols-2 max-w-lg mx-auto gap-y-8 text-sm md:text-base border-y border-slate-100 py-12">
                <div className="text-slate-400 text-right pr-8 uppercase tracking-widest text-[10px] font-black">Release Version</div>
                <div className="text-slate-900 text-left pl-8 font-black">{metadata.version}</div>
                <div className="text-slate-400 text-right pr-8 uppercase tracking-widest text-[10px] font-black">Lead Architect</div>
                <div className="text-slate-900 text-left pl-8 font-black">{metadata.preparedBy}</div>
              </div>
            </div>
            <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24">
              {renderedContent}
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-16 no-print">
          <button onClick={onReset} className="group px-12 py-5 bg-slate-900 text-white rounded-2xl hover:bg-black font-black flex items-center gap-4 transition-all transform hover:scale-105 shadow-2xl">
            Generate New Architecture
          </button>
        </div>
      </div>

      {/* Persistent Chat Widget */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 no-print z-[60]">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-blue-100 shadow-2xl p-4 flex flex-col gap-3">
          {isModifying && (
            <div className="flex items-center gap-2 px-2 text-blue-600 animate-pulse">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold uppercase tracking-widest">Modifying document letter by letter...</span>
            </div>
          )}
          <form onSubmit={handleChatSubmit} className="relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask AI to modify the document... (e.g. 'Add a performance testing section')"
              className="w-full pl-4 pr-24 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-700 font-medium"
              disabled={isModifying}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isModifying}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              Update
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          </form>
          <div className="flex justify-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Context-Aware Document Refinement</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
