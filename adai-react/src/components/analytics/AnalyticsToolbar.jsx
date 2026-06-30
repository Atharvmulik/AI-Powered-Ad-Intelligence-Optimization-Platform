// src/components/analytics/AnalyticsToolbar.jsx
// Toolbar row: description text, LIVE/OFFLINE indicator, date range dropdown,
// Compare button, and Export dropdown.
// Props: isConnected, dateRangeDisplay, dateRangePreset, onDatePresetSelect,
//        onCompareOpen, onExportCSV, onExportPDF, onExportExcel, onCopyLink

import { useState, useRef, useEffect } from 'react';

const DATE_PRESETS = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Quarter', 'Custom Range'];

export default function AnalyticsToolbar({
  isConnected = false,
  dateRangeDisplay,
  dateRangePreset,
  onDatePresetSelect,
  onCompareOpen,
  onExportCSV,
  onExportPDF,
  onExportExcel,
  onCopyLink,
}) {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const dateRef = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateRef.current && !dateRef.current.contains(e.target)) setIsDateOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target)) setIsExportOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (preset) => {
    setIsDateOpen(false);
    onDatePresetSelect(preset);
  };

  const handleExport = (fn) => {
    setIsExportOpen(false);
    fn();
  };

  const dotColor = isConnected ? 'bg-emerald-400' : 'bg-red-400';
  const labelColor = isConnected ? 'text-emerald-400' : 'text-red-400';
  const labelText = isConnected ? 'LIVE' : 'OFFLINE';

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p className="text-on-surface-variant font-body-md">
          Deep-dive into performance metrics and AI-driven growth signals.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Live WS indicator */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high rounded border border-outline-variant text-xs font-bold">
          <span className={`ws-dot inline-block w-2 h-2 rounded-full ${dotColor}`} />
          <span className={labelColor}>{labelText}</span>
        </div>

        {/* Date range dropdown */}
        <div className="relative" ref={dateRef}>
          <button
            onClick={() => setIsDateOpen(v => !v)}
            className="flex items-center bg-surface-container-high rounded px-3 py-2 border border-outline-variant text-sm font-medium cursor-pointer hover:bg-surface-bright transition-all"
          >
            <span className="material-symbols-outlined mr-2 text-primary">calendar_month</span>
            {dateRangeDisplay}
            <span className="material-symbols-outlined ml-2">expand_more</span>
          </button>
          {isDateOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-low border border-outline-variant rounded-xl shadow-xl z-50 animate-fade-in">
              {DATE_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => handleDateSelect(preset)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-high transition-colors flex justify-between items-center"
                >
                  {preset}
                  {dateRangePreset === preset && (
                    <span className="material-symbols-outlined text-primary text-sm">check</span>
                  )}
                  {preset === 'Custom Range' && (
                    <span className="text-[10px] text-on-surface-variant opacity-60">Coming soon</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Compare */}
        <button
          onClick={onCompareOpen}
          className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-outline-variant rounded hover:bg-surface-bright transition-all text-sm font-medium"
        >
          <span className="material-symbols-outlined text-sm">compare_arrows</span>
          Compare
        </button>

        {/* Export dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setIsExportOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded hover:brightness-110 transition-all text-sm font-bold shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
          {isExportOpen && (
            <div className="absolute top-full right-0 mt-1 bg-surface-container-low border border-outline-variant rounded-xl shadow-xl z-50 min-w-[200px] animate-fade-in">
              <button onClick={() => handleExport(onExportCSV)}   className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-high transition-colors">Export as CSV</button>
              <button onClick={() => handleExport(onExportPDF)}   className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-high transition-colors">Export as PDF</button>
              <button onClick={() => handleExport(onExportExcel)} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-high transition-colors">Export as Excel (.xlsx)</button>
              <button onClick={() => handleExport(onCopyLink)}    className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-high transition-colors">Copy Dashboard Link</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}