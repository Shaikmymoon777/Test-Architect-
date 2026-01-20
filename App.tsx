
import React, { useState, useEffect } from 'react';
import { ProjectMetadata, AppState, InputSource, TestPlanData, HistoryItem } from './types';
import Header from './components/Header';
import MetadataForm from './components/MetadataForm';
import SourceSelector from './components/SourceSelector';
import ResultView from './components/ResultView';
import HistorySidebar from './components/HistorySidebar';
import { generateTestPlan } from './services/geminiService';

const HISTORY_KEY = 'ai_test_plan_history_vault';

const App: React.FC = () => {
  const [step, setStep] = useState<AppState>(AppState.METADATA);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [metadata, setMetadata] = useState<ProjectMetadata>({
    projectName: '',
    version: '1.0.0',
    date: new Date().toISOString().split('T')[0],
    preparedBy: '',
    approvedBy: ''
  });
  const [sourceType, setSourceType] = useState<InputSource>('url');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load History from "Backend" (LocalStorage)
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Persistent Auto-Save for History
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const phases = [
    "Analyzing project entry points...",
    "Building component hierarchy tree...",
    "Identifying functional & non-functional features...",
    "Synthesizing IEEE 829 test cases...",
    "Finalizing documentation structure..."
  ];

  useEffect(() => {
    let interval: number;
    if (loading) {
      interval = window.setInterval(() => {
        setLoadingPhase((prev) => (prev + 1) % phases.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleMetadataSubmit = (data: ProjectMetadata) => {
    setMetadata(data);
    setStep(AppState.SOURCE);
  };

  const handleSourceSubmit = async (type: InputSource, value: string) => {
    setSourceType(type);
    setStep(AppState.ANALYZING);
    setLoading(true);
    setError(null);

    try {
      const response = await generateTestPlan({ metadata, sourceType: type, sourceValue: value });
      const newResult = response.text;
      const newId = Date.now().toString();
      
      const newHistoryItem: HistoryItem = {
        id: newId,
        metadata,
        result: newResult,
        updatedAt: new Date().toISOString(),
        sourceType: type
      };

      setHistory(prev => [newHistoryItem, ...prev]);
      setActiveId(newId);
      setResult(newResult);
      setStep(AppState.RESULT);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setStep(AppState.SOURCE);
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpdate = (newContent: string) => {
    setResult(newContent);
    if (activeId) {
      setHistory(prev => prev.map(item => 
        item.id === activeId 
          ? { ...item, result: newContent, updatedAt: new Date().toISOString() } 
          : item
      ));
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setMetadata(item.metadata);
    setResult(item.result);
    setSourceType(item.sourceType);
    setActiveId(item.id);
    setStep(AppState.RESULT);
    setIsHistoryOpen(false);
  };

  const handleDeleteHistory = (id: string) => {
    if (window.confirm("Remove this document from history?")) {
      setHistory(prev => prev.filter(item => item.id !== id));
      if (activeId === id) {
        reset(false);
      }
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm("ARE YOU SURE? This will permanently delete ALL saved documents.")) {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
      reset(false);
    }
  };

  const reset = (ask = true) => {
    if (ask && !window.confirm("Start a new test plan session? Current work remains in history.")) return;
    setStep(AppState.METADATA);
    setResult('');
    setError(null);
    setActiveId(null);
    setMetadata({
      projectName: '',
      version: '1.0.0',
      date: new Date().toISOString().split('T')[0],
      preparedBy: '',
      approvedBy: ''
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header 
        onToggleHistory={() => setIsHistoryOpen(true)} 
        hasHistory={history.length > 0} 
      />
      
      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={history}
        onSelect={handleSelectHistory}
        onDelete={handleDeleteHistory}
        onClearAll={handleClearAllHistory}
      />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {step === AppState.METADATA && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-3xl mx-auto animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-200">1</div>
              <h2 className="text-2xl font-bold text-slate-800">Project Identification</h2>
            </div>
            <MetadataForm initialData={metadata} onSubmit={handleMetadataSubmit} />
          </div>
        )}

        {step === AppState.SOURCE && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-3xl mx-auto animate-in fade-in">
            <button onClick={() => setStep(AppState.METADATA)} className="mb-6 text-slate-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Project Details
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-200">2</div>
              <h2 className="text-2xl font-bold text-slate-800">Source Analysis</h2>
            </div>
            <SourceSelector onSubmit={handleSourceSubmit} />
          </div>
        )}

        {step === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="relative mb-12">
              <div className="w-24 h-24 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Architecting Test Plan</h2>
            <div className="bg-white px-8 py-3 rounded-full shadow-sm border border-slate-200 flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
              <p className="text-blue-700 font-bold uppercase tracking-widest text-xs">{phases[loadingPhase]}</p>
            </div>
          </div>
        )}

        {step === AppState.RESULT && (
          <ResultView 
            content={result} 
            metadata={metadata} 
            onReset={() => reset(true)}
            onUpdate={handleManualUpdate}
          />
        )}

        {error && (
          <div className="mt-8 p-6 bg-red-50 border-2 border-red-100 text-red-700 rounded-2xl animate-in slide-in-from-top-4">
            <p className="font-bold text-lg mb-1">Analysis Error</p>
            <p className="text-sm opacity-90">{error}</p>
            <button onClick={() => reset(false)} className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition uppercase tracking-wider">Restart</button>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-auto no-print">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-900 font-bold tracking-tight mb-2">AI Test Architect</p>
          <div className="flex justify-center gap-6 mb-8">
            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest">IEEE 829</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest">ISTQB Aligned</span>
          </div>
          <p className="text-slate-300 text-xs">&copy; {new Date().getFullYear()} AI Test Plan Architect. Vault Storage Active.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
