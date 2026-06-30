// src/components/analytics/UserInterests.jsx
// Row 3 (3/12 cols) — User interest category breakdown bars.

import { useAnalytics } from '@/hooks/useAnalytics';

const BAR_COLORS = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-outline'];
const TOP_BAR_SHADOW = 'shadow-[0_0_8px_rgba(192,193,255,0.4)]';

export default function UserInterests() {
  const { userInterests, loading, error } = useAnalytics();

  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-surface-container-low border border-outline-variant rounded-xl p-6">
      <h3 className="text-on-surface font-bold mb-6 text-title-lg">User Interests</h3>

      {loading && (
        <p className="text-xs text-on-surface-variant text-center py-4">Loading...</p>
      )}
      {!loading && error && (
        <p className="text-xs text-error text-center py-4">{error}</p>
      )}
      {!loading && !error && userInterests.length === 0 && (
        <p className="text-xs text-on-surface-variant text-center py-4">No interest data available.</p>
      )}

      {!loading && !error && userInterests.length > 0 && (
        <div className="space-y-5">
          {userInterests.map((item, idx) => (
            <div key={`${item.name}-${item.percentage}-${idx}`} className="space-y-1">
              <div className="flex justify-between text-xs mb-1">
                <span>{item.name}</span>
                <span className="font-mono">{item.percentage}%</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full">
                <div
                  className={`${BAR_COLORS[idx % BAR_COLORS.length]} h-full rounded-full ${idx === 0 ? TOP_BAR_SHADOW : ''}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}