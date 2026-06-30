// src/components/analytics/EngagementPanel.jsx
// Bento row 2 (4/12 cols) — Engagement metrics from backend.

import { useAnalytics } from '@/hooks/useAnalytics';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export default function EngagementPanel() {
  const { engagement, loading, error } = useAnalytics();

  const {
    average_session_duration,
    bounce_rate,
    returning_users,
    engagement_score,
  } = engagement;

  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-on-surface font-bold text-title-lg">Engagement</h3>
          <p className="text-xs text-on-surface-variant">Avg. Session Duration</p>
        </div>
        <div className="text-right">
          <span className="text-[#ffb783] font-bold text-lg">
            {loading ? '--' : `${engagement_score.toFixed(1)}`}
          </span>
          <p className="text-sm font-mono text-on-surface mt-1">
            {loading ? '--' : formatDuration(average_session_duration)}
          </p>
        </div>
      </div>

      {/* Mini sparkline — visual only */}
      <div className="h-32 flex items-center justify-center border-b border-outline-variant/30 mb-4">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
          <defs>
            <linearGradient id="engagementGrad" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%"   style={{ stopColor: 'rgba(192, 193, 255, 0.3)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(192, 193, 255, 0)',   stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <path d="M0 35 Q10 20 20 25 T40 10 T60 30 T80 5 T100 20" fill="none" stroke="#c0c1ff" strokeWidth="2" />
          <path d="M0 35 Q10 20 20 25 T40 10 T60 30 T80 5 T100 20 V40 H0 Z" fill="url(#engagementGrad)" />
        </svg>
      </div>

      {!loading && !error && (
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase">Bounce Rate</p>
            <p className="text-lg font-bold">{bounce_rate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase">Returning Users</p>
            <p className="text-lg font-bold">{returning_users.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}
      {loading && (
        <p className="text-xs text-on-surface-variant text-center mt-auto py-2">Loading...</p>
      )}
      {!loading && error && (
        <p className="text-xs text-error text-center mt-auto py-2">{error}</p>
      )}
    </div>
  );
}