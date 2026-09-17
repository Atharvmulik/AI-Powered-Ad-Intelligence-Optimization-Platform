// components/realTimeEvents/ExportMenu.jsx

import { useState, useRef, useEffect } from 'react';

/**
 * ExportMenu
 * ---------------------------------------------------------------------------
 * Self-contained "Export Logs" dropdown button. Owns its own open/closed
 * state and click-outside-to-close behavior (previously lived on the page
 * via `isExportOpen` + `exportRef`).
 *
 * @param {(format: 'json' | 'csv') => void} onExport
 */
export default function ExportMenu({ onExport }) {
  const [isOpen, setIsOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format) => {
    onExport(format);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={exportRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-surface-container-high border border-outline-variant rounded-lg font-label-md text-label-md flex items-center hover:bg-surface-bright transition-colors text-xs font-bold"
      >
        <span className="material-symbols-outlined text-[18px] mr-2">download</span> Export Logs
        <span className="material-symbols-outlined text-[16px] ml-1">arrow_drop_down</span>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-surface-container-high border border-outline-variant rounded-lg shadow-2xl z-50 min-w-[180px] overflow-hidden">
          <button
            onClick={() => handleExport('json')}
            className="w-full px-4 py-2 text-left hover:bg-surface-bright transition-colors flex items-center space-x-2"
          >
            <span className="material-symbols-outlined text-[18px]">code</span>
            <span>Export as JSON</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="w-full px-4 py-2 text-left hover:bg-surface-bright transition-colors flex items-center space-x-2 border-t border-outline-variant"
          >
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
            <span>Export as CSV</span>
          </button>
        </div>
      )}
    </div>
  );
}