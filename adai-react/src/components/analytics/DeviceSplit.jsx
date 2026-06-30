// src/components/analytics/DeviceSplit.jsx
// Bento row 2 (3/12 cols) — Device split bars from backend.

import { useAnalytics } from '@/hooks/useAnalytics';

const DEVICE_STYLES = {
  Mobile:  { icon: 'smartphone', color: 'text-primary',   barColor: 'bg-primary' },
  Desktop: { icon: 'laptop',     color: 'text-secondary', barColor: 'bg-secondary' },
  Tablet:  { icon: 'tablet',     color: 'text-tertiary',  barColor: 'bg-tertiary' },
};

const FALLBACK_STYLE = { icon: 'devices', color: 'text-on-surface-variant', barColor: 'bg-outline' };

export default function DeviceSplit() {
  const { deviceSplit, loading, error } = useAnalytics();
  const devices = deviceSplit?.devices ?? [];

  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-surface-container-low border border-outline-variant rounded-xl p-6 h-full flex flex-col">
      <h3 className="text-on-surface font-bold mb-6 text-title-lg">Device Split</h3>

      {loading && (
        <p className="text-xs text-on-surface-variant text-center py-4">Loading...</p>
      )}
      {!loading && error && (
        <p className="text-xs text-error text-center py-4">{error}</p>
      )}
      {!loading && !error && (
        <div className="space-y-4 flex-1">
          {devices.map((d) => {
            const style = DEVICE_STYLES[d.device_type] ?? FALLBACK_STYLE;
            return (
              <div key={d.device_type}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined ${style.color} text-sm`}>{style.icon}</span>
                    <span className="text-sm">{d.device_type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{d.percentage.toFixed(1)}%</span>
                    {d.trend_value && (
                      <p className={`text-[9px] ${d.trend === 'up' ? 'text-emerald-400' : d.trend === 'down' ? 'text-red-400' : 'text-on-surface-variant'} mt-0.5`}>
                        {d.trend_value}
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-1">
                  <div
                    className={`${style.barColor} h-full`}
                    style={{ width: `${Math.max(8, Math.min(100, d.percentage))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}