// src/components/analytics/DataExportConsole.jsx
// Left panel of the export+fraud row — checkboxes for report sections
// and a button to open the Schedule Weekly Export modal.
// Props: selectedExports, onCheckboxChange, onScheduleOpen

import { exportCSV, exportPDF, exportExcel, scheduleExport } from '@/services/analyticsService';

const EXPORT_OPTIONS = [
  'Campaign Performance Metrics',
  'Audience Demographic Data',
  'Fraud Detection Log (Detailed)',
  'AI Forecasting & Trends',
];

export default function DataExportConsole({ selectedExports, onCheckboxChange, onScheduleOpen }) {
  const handleExportCSV = async () => {
    await exportCSV();
  };

  const handleExportPDF = async () => {
    await exportPDF();
  };

  const handleExportExcel = async () => {
    await exportExcel();
  };

  const handleSchedule = async () => {
    await scheduleExport();
    onScheduleOpen();
  };

  return (
    <div className="col-span-12 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col">
      <h3 className="text-on-surface font-bold mb-6 text-title-lg">Data Export Console</h3>

      <div className="flex-grow flex flex-col justify-between space-y-4">
        {/* Checkboxes */}
        <div className="space-y-4">
          <p className="text-xs text-on-surface-variant font-bold uppercase font-mono">Include in Report</p>
          <div className="space-y-3">
            {EXPORT_OPTIONS.map((label) => (
              <label key={label} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedExports[label] ?? false}
                  onChange={() => onCheckboxChange(label)}
                  className="w-5 h-5 rounded border-outline bg-surface-container-high text-primary focus:ring-primary"
                />
                <span className="text-sm group-hover:text-primary transition-colors">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Export actions */}
        <div className="pt-4 border-t border-outline-variant/30 space-y-2">
          <p className="text-xs text-on-surface-variant font-bold uppercase mb-3 font-mono">Export Now</p>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex-1 py-2 text-xs font-bold bg-surface-container-highest border border-outline-variant rounded hover:bg-surface-bright transition-all"
            >
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 py-2 text-xs font-bold bg-surface-container-highest border border-outline-variant rounded hover:bg-surface-bright transition-all"
            >
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex-1 py-2 text-xs font-bold bg-surface-container-highest border border-outline-variant rounded hover:bg-surface-bright transition-all"
            >
              Excel
            </button>
          </div>
        </div>

        {/* Schedule trigger */}
        <div className="pt-6 border-t border-outline-variant/30 mt-auto">
          <p className="text-xs text-on-surface-variant font-bold uppercase mb-4 font-mono">Automation</p>
          <button
            onClick={handleSchedule}
            className="w-full py-3 bg-surface-container-highest rounded border border-outline-variant flex items-center justify-between px-4 hover:bg-surface-bright transition-all group"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-tertiary">schedule</span>
              Schedule Weekly Export
            </span>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}