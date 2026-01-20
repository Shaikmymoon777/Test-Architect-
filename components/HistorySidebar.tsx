
import React from 'react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onSelect, 
  onDelete,
  onClearAll 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Project Vault</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Saved Test Plans</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="font-bold text-slate-400">No documents saved yet</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="group relative bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-blue-300 hover:bg-white transition-all cursor-pointer shadow-sm hover:shadow-md" onClick={() => onSelect(item)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black uppercase shadow-sm">
                        {item.metadata.projectName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 leading-tight">{item.metadata.projectName}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">v{item.metadata.version} • {new Date(item.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-slate-100">
            <button 
              onClick={onClearAll}
              className="w-full py-3 text-slate-400 hover:text-red-500 text-xs font-black uppercase tracking-widest border-2 border-dashed border-slate-100 hover:border-red-100 hover:bg-red-50 rounded-xl transition-all"
            >
              Wipe Vault History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorySidebar;
