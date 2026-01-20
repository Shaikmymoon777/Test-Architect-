
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xl font-bold tracking-tight">AI Test Architect</span>
        </div>
        <div className="hidden md:flex gap-4 items-center">
          <span className="text-blue-100 text-sm">IEEE 829 / ISTQB Aligned</span>
          <div className="h-4 w-[1px] bg-blue-400"></div>
          <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-xs font-medium uppercase tracking-wider bg-blue-700 px-3 py-1 rounded-full hover:bg-blue-800 transition">
            Gemini Powered
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
