// src/components/analytics/LiveCTRPanel.jsx
// Bento row 1 (left 8/12 cols) — Live CTR trend chart card.

import { useAnalytics } from '@/hooks/useAnalytics';
import { useAnalyticsWebSocket } from '@/hooks/useAnalyticsWebSocket';
import LiveCTRChart from './LiveCTRChart';

export default function LiveCTRPanel() {
  const {
    ctrTrend, setCtrTrend,
    overview, setOverview,
    terminalLogs, setTerminalLogs,
    fraudMonitor, setFraudMonitor,
    loading,
  } = useAnalytics();

  useAnalyticsWebSocket(setOverview, setTerminalLogs, setFraudMonitor, setCtrTrend);

  const ctrPoints = (ctrTrend?.points ?? []).map((p) => ({
    value: p.ctr,
    time: p.timestamp,
  }));

  const currentCTR = ctrTrend.current_ctr;

  return (
    <div className="col-span-12 lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-on-surface font-bold text-title-lg">Live CTR Trend</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/15 border border-primary/30 text-primary rounded-full">
              LIVE
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Rolling 20-point click-through rate window
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-primary leading-none">
            {loading ? '--' : `${currentCTR.toFixed(2)}%`}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">CTR</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-full bg-primary inline-block" />
          CTR
        </div>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <svg width="20" height="8">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#555577" strokeWidth="1.5" strokeDasharray="4 2" />
          </svg>
          Target {ctrTrend.target_ctr.toFixed(1)}%
        </div>
      </div>

      <div className="h-52">
        {!loading && ctrPoints.length > 1 && <LiveCTRChart dataPoints={ctrPoints} />}
        {!loading && ctrPoints.length <= 1 && (
          <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">
            Waiting for CTR data...
          </div>
        )}
        {loading && (
          <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}