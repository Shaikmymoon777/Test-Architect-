
import React, { useState, useEffect } from 'react';
import { ProjectMetadata, AppState, InputSource, TestPlanData } from './types';
import Header from './components/Header';
import MetadataForm from './components/MetadataForm';
import SourceSelector from './components/SourceSelector';
import ResultView from './components/ResultView';
import { generateTestPlan } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppState>(AppState.METADATA);
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
    setLoadingPhase(0);

    try {
      const payload: TestPlanData = {
        metadata,
        sourceType: type,
        sourceValue: value
      };
      
      const response = await generateTestPlan(payload);
      setResult(response.text);
      setStep(AppState.RESULT);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during analysis.');
      setStep(AppState.SOURCE);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(AppState.METADATA);
    setResult('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {step === AppState.METADATA && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-3xl mx-auto transform transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-200">1</div>
              <h2 className="text-2xl font-bold text-slate-800">Project Identification</h2>
            </div>
            <MetadataForm 
              initialData={metadata} 
              onSubmit={handleMetadataSubmit} 
            />
          </div>
        )}

        {step === AppState.SOURCE && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-3xl mx-auto transform transition-all duration-500">
            <button 
              onClick={() => setStep(AppState.METADATA)}
              className="mb-6 text-slate-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 transition-colors"
            >
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
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative mb-12">
              <div className="w-24 h-24 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 bg-blue-50 rounded-full animate-pulse flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Architecting Test Plan</h2>
            <div className="bg-white px-8 py-3 rounded-full shadow-sm border border-slate-200 flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
              <p className="text-blue-700 font-bold uppercase tracking-widest text-xs">{phases[loadingPhase]}</p>
            </div>
            <p className="mt-6 text-slate-500 max-w-md mx-auto leading-relaxed">Gemini is deep-scanning your source to build a professional IEEE 829 compliant document. This may take up to 30 seconds.</p>
          </div>
        )}

        {step === AppState.RESULT && (
          <ResultView 
            content={result} 
            metadata={metadata} 
            onReset={reset} 
          />
        )}

        {error && (
          <div className="mt-8 p-6 bg-red-50 border-2 border-red-100 text-red-700 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top-4 duration-300">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-lg mb-1">Analysis Error</p>
              <p className="text-sm opacity-90">{error}</p>
              <button 
                onClick={reset}
                className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition uppercase tracking-wider"
              >
                Restart Process
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-900 font-bold tracking-tight mb-2">AI Test Architect</p>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">Bridging the gap between React code and professional quality assurance standards using advanced generative AI.</p>
          <div className="flex justify-center gap-6 mb-8">
            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest">IEEE 829</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest">ISTQB Aligned</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest">Enterprise QA</span>
          </div>
          <p className="text-slate-300 text-xs">
            &copy; {new Date().getFullYear()} AI Test Plan Architect. Powered by Gemini.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
