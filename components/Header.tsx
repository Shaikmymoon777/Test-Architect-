
import React from 'react';

interface HeaderProps {
  onToggleHistory: () => void;
  hasHistory: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleHistory, hasHistory }) => {
  return (
    <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xl font-bold tracking-tight">AI Test Architect</span>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={onToggleHistory}
            className="relative p-2 bg-blue-500/30 border border-blue-400/30 rounded-xl hover:bg-blue-500 transition-colors group"
            title="View History Vault"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {hasHistory && <span className="absolute top-1 right-1 w-2 h-2 bg-blue-300 rounded-full animate-pulse"></span>}
          </button>
          
          <div className="hidden md:flex items-center gap-4">
            <span className="text-blue-100 text-sm">IEEE 829 / ISTQB</span>
            <div className="h-4 w-[1px] bg-blue-400"></div>
            <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-xs font-medium uppercase tracking-wider bg-blue-700 px-3 py-1 rounded-full hover:bg-blue-800 transition">
              Gemini 3
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
