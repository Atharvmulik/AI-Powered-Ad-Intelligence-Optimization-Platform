// src/components/analytics/AnalyticsKpiStrip.jsx
// Four live KPI cards: Active Users, Events/sec, Avg Bid Latency, Fraud Rate.
// Props: activeUsers, eventsPerSec, bidLatency, fraudRate,
//        prevUsers, prevEvents, prevLatency, prevFraud

function TrendBadge({ cur, prev, suffix = '' }) {
  const up = cur >= prev
  const delta = Math.abs(cur - prev)
  const formatted = delta % 1 !== 0 ? delta.toFixed(1) : delta
  return (
    <span className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'} {formatted}{suffix}
    </span>
  )
}

const KPI_CONFIG = [
  {
    key: 'activeUsers',
    prevKey: 'prevUsers',
    label: 'Active Users',
    icon: 'group',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    format: (v) => v.toLocaleString('en-IN'),
    suffix: '',
  },
  {
    key: 'eventsPerSec',
    prevKey: 'prevEvents',
    label: 'Events / sec',
    icon: 'electric_bolt',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    format: (v) => v.toLocaleString('en-IN'),
    suffix: '',
  },
  {
    key: 'bidLatency',
    prevKey: 'prevLatency',
    label: 'Avg Bid Latency',
    icon: 'timer',
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    format: (v) => `${v}ms`,
    suffix: 'ms',
  },
  {
    key: 'fraudRate',
    prevKey: 'prevFraud',
    label: 'Fraud Rate',
    icon: 'security',
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    format: (v) => `${v.toFixed(1)}%`,
    suffix: '%',
  },
]

export default function AnalyticsKpiStrip({
  activeUsers, eventsPerSec, bidLatency, fraudRate,
  prevUsers, prevEvents, prevLatency, prevFraud,
}) {
  const values = { activeUsers, eventsPerSec, bidLatency, fraudRate }
  const prevValues = { prevUsers, prevEvents, prevLatency, prevFraud }

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
              {format(values[key])}
            </p>
            <TrendBadge cur={values[key]} prev={prevValues[prevKey]} suffix={suffix} />
          </div>
        </div>
      ))}
    </div>
  )
}