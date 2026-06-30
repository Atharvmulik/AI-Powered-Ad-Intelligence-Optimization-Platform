// src/components/analytics/AnalyticsKpiStrip.jsx
// Four live KPI cards: Active Users, Events/sec, Avg Bid Latency, Fraud Rate.

import { useAnalytics } from '@/hooks/useAnalytics';
import { useAnalyticsWebSocket } from '@/hooks/useAnalyticsWebSocket';

function TrendBadge({ cur, prev, suffix = '' }) {
  const up = cur >= prev;
  const delta = Math.abs(cur - prev);
  const formatted = delta % 1 !== 0 ? delta.toFixed(1) : delta;
  return (
    <span className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'} {formatted}{suffix}
    </span>
  );
}

const KPI_CONFIG = [
  {
    key: 'active_users',
    prevKey: 'previous_active_users',
    label: 'Active Users',
    icon: 'group',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    format: (v) => v.toLocaleString('en-IN'),
    suffix: '',
  },
  {
    key: 'events_per_second',
    prevKey: 'previous_events_per_second',
    label: 'Events / sec',
    icon: 'electric_bolt',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    format: (v) => v.toLocaleString('en-IN'),
    suffix: '',
  },
  {
    key: 'avg_bid_latency',
    prevKey: 'previous_avg_bid_latency',
    label: 'Avg Bid Latency',
    icon: 'timer',
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    format: (v) => `${v}ms`,
    suffix: 'ms',
  },
  {
    key: 'fraud_rate',
    prevKey: 'previous_fraud_rate',
    label: 'Fraud Rate',
    icon: 'security',
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    format: (v) => `${v.toFixed(1)}%`,
    suffix: '%',
  },
];

export default function AnalyticsKpiStrip() {
  const { overview, setOverview } = useAnalytics();
  useAnalyticsWebSocket(setOverview);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {KPI_CONFIG.map(({ key, prevKey, label, icon, iconBg, iconColor, format, suffix }) => (
        <div key={key} className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
            <span className={`material-symbols-outlined ${iconColor} text-[20px]`}>{icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-label-md truncate">
              {label}
            </p>
            <p className="text-2xl font-black text-on-surface leading-tight">
              {format(overview[key])}
            </p>
            <TrendBadge cur={overview[key]} prev={overview[prevKey]} suffix={suffix} />
          </div>
        </div>
      ))}
    </div>
  );
}