// src/components/analytics/FraudDetectionMonitor.jsx
// Right panel of export+fraud row — live fraud detection table with summary chips.

import { useAnalytics } from '@/hooks/useAnalytics';
import { useAnalyticsWebSocket } from '@/hooks/useAnalyticsWebSocket';
import { fraudScoreBg, actionChip } from '@/utils/analyticsHelpers';

function formatTimestamp(ts) {
  try {
    return new Date(ts).toLocaleTimeString('en-GB', { hour12: false });
  } catch {
    return ts;
  }
}

export default function FraudDetectionMonitor() {
  const { fraudMonitor, setFraudMonitor, overview, setOverview, terminalLogs, setTerminalLogs } = useAnalytics();
  useAnalyticsWebSocket(setOverview, setTerminalLogs, setFraudMonitor);

  const { blocked_today, flagged, clean, events } = fraudMonitor;

  return (
    <div className="col-span-12 lg:col-span-8 bg-surface-container-low border border-red-500/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between bg-red-500/5">
        <div className="flex items-center gap-3">
          <span className="pulse-dot inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="material-symbols-outlined text-red-400">gpp_bad</span>
          <h3 className="text-on-surface font-bold text-title-lg">Fraud Detection Monitor</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-full animate-pulse">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">shield</span>
          Powered by XGBoost + Isolation Forest
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/30 text-[11px] uppercase text-on-surface-variant font-label-md">
              <th className="text-left px-5 py-3">Timestamp</th>
              <th className="text-left px-5 py-3">IP Address</th>
              <th className="text-left px-5 py-3">Fraud Score</th>
              <th className="text-left px-5 py-3">Category</th>
              <th className="text-left px-5 py-3">Action</th>
              <th className="text-left px-5 py-3">Severity</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-on-surface-variant text-xs">
                  No fraud events detected.
                </td>
              </tr>
            )}
            {events.slice(0, 4).map((row, i) => (
              <tr
                key={`${row.timestamp}-${i}`}
                className={`border-b border-outline-variant/20 transition-colors hover:bg-surface-container-high/30 ${i === 0 ? 'bg-red-500/5' : ''}`}
              >
                <td className="px-5 py-3 font-mono text-xs text-on-surface-variant">{formatTimestamp(row.timestamp)}</td>
                <td className="px-5 py-3 font-mono text-xs text-on-surface">{row.ip_address}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${fraudScoreBg(row.fraud_score)}`}>
                    {row.fraud_score.toFixed(2)}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs font-medium text-on-surface">{row.category}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${actionChip(row.action)}`}>
                    {row.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-on-surface-variant">{row.severity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary chips */}
      <div className="p-4 flex flex-wrap gap-3 border-t border-outline-variant/20 bg-surface-container-lowest">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <span className="material-symbols-outlined text-red-400 text-sm">block</span>
          <span className="text-xs font-bold text-red-400">Blocked Today:</span>
          <span className="text-xs font-black text-on-surface">{blocked_today.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <span className="material-symbols-outlined text-yellow-400 text-sm">flag</span>
          <span className="text-xs font-bold text-yellow-400">Flagged:</span>
          <span className="text-xs font-black text-on-surface">{flagged.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          <span className="text-xs font-bold text-emerald-400">Clean:</span>
          <span className="text-xs font-black text-on-surface">{clean.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}