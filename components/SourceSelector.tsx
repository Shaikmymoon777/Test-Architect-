
import React, { useState } from 'react';
import { InputSource } from '../types';

interface SourceSelectorProps {
  onSubmit: (type: InputSource, value: string) => void;
}

declare const JSZip: any;

const SourceSelector: React.FC<SourceSelectorProps> = ({ onSubmit }) => {
  const [sourceType, setSourceType] = useState<InputSource>('url');
  const [url, setUrl] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    onSubmit('url', url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      if (file.name.endsWith('.zip')) {
        // Simple file listing for context
        const zip = await JSZip.loadAsync(file);
        const files: string[] = [];
        let contextSnippet = "Project File Structure:\n";
        
        // Extract basic structure and some key file contents if possible
        const fileNames = Object.keys(zip.files);
        contextSnippet += fileNames.slice(0, 50).join('\n') + (fileNames.length > 50 ? '\n...and more' : '');
        
        // Try to read package.json
        const packageJson = zip.file('package.json');
        if (packageJson) {
          const content = await packageJson.async('string');
          contextSnippet += `\n\npackage.json content:\n${content.substring(0, 1000)}`;
        }

        // Try to find App.tsx or main entry
        const entryFile = fileNames.find(f => f.includes('App.tsx') || f.includes('index.tsx') || f.includes('App.js'));
        if (entryFile) {
          const content = await zip.file(entryFile)?.async('string');
          contextSnippet += `\n\nMain Entry File (${entryFile}):\n${content?.substring(0, 1500)}`;
        }

        onSubmit('file', contextSnippet);
      } else {
        // Non-zip file
        const text = await file.text();
        onSubmit('file', `Filename: ${file.name}\n\nContent:\n${text.substring(0, 5000)}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to process file. Please try again or provide a URL.");
    } finally {
      setIsProcessingFile(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex bg-slate-100 p-1 rounded-xl w-full">
        <button
          onClick={() => setSourceType('url')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${sourceType === 'url' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Website URL
        </button>
        <button
          onClick={() => setSourceType('file')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${sourceType === 'file' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          React Project (.zip)
        </button>
      </div>

      {sourceType === 'url' ? (
        <form onSubmit={handleUrlSubmit} className="space-y-4 animate-in fade-in duration-300">
          <p className="text-sm text-slate-500">Provide a link to your hosted application or GitHub repository.</p>
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Generate Test Plan
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-300">
          <p className="text-sm text-slate-500">Upload your React project source (zip) for deep component analysis.</p>
          <div className="relative group">
            <input
              type="file"
              accept=".zip,.js,.jsx,.ts,.tsx"
              onChange={handleFileChange}
              disabled={isProcessingFile}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`border-2 border-dashed border-slate-300 rounded-xl py-12 px-4 flex flex-col items-center justify-center transition group-hover:border-blue-400 group-hover:bg-blue-50 ${isProcessingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isProcessingFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-blue-600 font-medium">Extracting files...</p>
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400 mb-4 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-slate-600 font-medium">Click or drag to upload zip</p>
                  <p className="text-slate-400 text-xs mt-1">Maximum recommended size: 50MB</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceSelector;
