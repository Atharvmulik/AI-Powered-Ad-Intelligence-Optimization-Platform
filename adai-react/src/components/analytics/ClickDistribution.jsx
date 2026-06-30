// src/components/analytics/ClickDistribution.jsx
// Bento row 1 (right 4/12 cols) — Click Distribution donut + channel bars.

import { useAnalytics } from '@/hooks/useAnalytics';

const SEGMENT_COLORS = [
  { stroke: '#571bc1', bar: 'bg-primary',   label: 'text-primary' },
  { stroke: '#c0c1ff', bar: 'bg-secondary', label: 'text-secondary' },
  { stroke: '#7c4dff', bar: 'bg-tertiary',  label: 'text-tertiary' },
  { stroke: '#b388ff', bar: 'bg-purple-400', label: 'text-purple-400' },
  { stroke: '#ea80fc', bar: 'bg-pink-400',  label: 'text-pink-400' },
];

function buildDonutSegments(channels) {
  const PATH = 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831';
  let offset = 0;
  return channels.map((ch, i) => {
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    const segment = (
      <path
        key={ch.label}
        d={PATH}
        fill="none"
        stroke={color.stroke}
        strokeDasharray={`${ch.percentage}, 100`}
        strokeDashoffset={-offset}
        strokeWidth="4"
      />
    );
    offset += ch.percentage;
    return { segment, color };
  });
}

export default function ClickDistribution() {
  const { clickDistribution, loading, error } = useAnalytics();
  const { total_clicks = 0, channels = [] } = clickDistribution ?? {};

  const segmentData = channels.length > 0 ? buildDonutSegments(channels) : [];

  return (
    <div className="col-span-12 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6 h-full">
      <h3 className="text-on-surface font-bold mb-4 text-title-lg">Click Distribution</h3>

      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Donut chart */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            {loading || channels.length === 0
              ? (
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#34343c"
                  strokeDasharray="100, 100"
                  strokeWidth="4"
                />
              )
              : segmentData.map(({ segment }) => segment)
            }
          </svg>
          <div className="absolute text-center">
            <span className="block font-bold text-lg">
              {loading ? '--' : total_clicks.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase">Total</span>
          </div>
        </div>

        {/* Channel breakdown */}
        {!loading && !error && (
          <div className="w-full space-y-2">
            {channels.map((ch, i) => {
              const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
              return (
                <div key={ch.label}>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">{ch.label}</span>
                    <span className={`font-bold ${color.label}`}>{ch.percentage}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className={`${color.bar} h-full`}
                      style={{ width: `${ch.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && error && (
          <p className="text-xs text-error text-center">{error}</p>
        )}

        {!loading && !error && channels.length === 0 && (
          <p className="text-xs text-on-surface-variant text-center">No channel data available.</p>
        )}
      </div>
    </div>
  );
}