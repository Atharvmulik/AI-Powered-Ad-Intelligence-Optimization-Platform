import { formatReach, fraudBadgeClass, fraudDotClass } from '../../utils/audienceHelpers'

// No backend equivalent for per-segment icon theming — rotates through the
// same 3 theme tokens the mock data used, keyed by row position.
const ICON_THEMES = [
  { bg: 'bg-primary/10', color: 'text-primary' },
  { bg: 'bg-tertiary/10', color: 'text-tertiary' },
  { bg: 'bg-secondary/10', color: 'text-secondary' },
]

const formatGrowth = (growthPct) => ({
  label: `${growthPct > 0 ? '+' : ''}${growthPct}%`,
  isUp: growthPct >= 0,
})

// The 2-color bar can't show 3 values. Renormalizes mobile/desktop as a
// share of just those two, dropping device_tablet_pct from this view.
const normalizeDeviceSplit = (mobilePct, desktopPct) => {
  const sum = mobilePct + desktopPct
  if (sum <= 0) return { mobile: 0, desktop: 0 }
  return {
    mobile: Math.round((mobilePct / sum) * 100),
    desktop: Math.round((desktopPct / sum) * 100),
  }
}

export default function AudienceSegmentsTable({ segments, total, loading, error }) {
  return (
    <div className="col-span-12 lg:col-span-8 glass-card rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container/30">
        <h3 className="font-title-lg text-title-lg">High-Performing Segments</h3>
        <span className="text-label-md bg-secondary-container/20 text-secondary px-2 py-1 rounded">
          {loading ? '—' : `${total} Segments Active`}
        </span>
      </div>

      {error && (
        <p className="text-error text-sm px-6 py-4">Failed to load segments.</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-lowest/50">
              <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Segment Name</th>
              <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Reach</th>
              <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Growth</th>
              <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Device Split</th>
              <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Fraud Risk</th>
              <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-xs text-right">Avg CTR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {segments.map((seg, i) => {
              const theme = ICON_THEMES[i % ICON_THEMES.length]
              const growth = formatGrowth(seg.growth_pct)
              const split = normalizeDeviceSplit(seg.device_mobile_pct, seg.device_desktop_pct)

              return (
                <tr key={seg.id} className="hover:bg-surface-container transition-colors group">
                  {/* Segment Name + tags */}
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded ${theme.bg} flex items-center justify-center ${theme.color} shrink-0 mt-0.5`}>
                        <span className="material-symbols-outlined">{seg.icon_name}</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{seg.name}</p>
                        <p className="text-xs text-on-surface-variant mb-1.5">{seg.subtitle}</p>
                        <div className="flex flex-wrap gap-1">
                          {seg.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-surface-container-high text-on-surface-variant text-xs rounded-full px-2 py-0.5 border border-outline-variant/40"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Reach */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shrink-0" />
                      <span className="font-label-md font-mono text-sm">
                        {formatReach(seg.reach)}
                      </span>
                    </div>
                  </td>

                  {/* Growth */}
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-1 ${growth.isUp ? 'text-tertiary' : 'text-error'}`}>
                      <span className="material-symbols-outlined text-sm font-bold">
                        {growth.isUp ? 'trending_up' : 'trending_down'}
                      </span>
                      <span className="font-label-md font-mono">{growth.label}</span>
                    </div>
                  </td>

                  {/* Device Split */}
                  <td className="px-6 py-5">
                    <div className="min-w-[100px]">
                      <p className="text-xs text-on-surface-variant mb-1.5">
                        <span className="text-secondary font-semibold">{split.mobile}%</span>
                        <span className="mx-1 opacity-40">/</span>
                        <span className="text-primary font-semibold">{split.desktop}%</span>
                        <span className="ml-1 opacity-50 text-[10px]">M/D</span>
                      </p>
                      <div className="w-full h-1 rounded-full overflow-hidden flex bg-surface-container-highest">
                        <div
                          className="bg-secondary h-full rounded-l-full"
                          style={{ width: `${split.mobile}%` }}
                        />
                        <div
                          className="bg-primary h-full rounded-r-full"
                          style={{ width: `${split.desktop}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Fraud Risk */}
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${fraudBadgeClass(seg.fraud_risk_level)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${fraudDotClass(seg.fraud_risk_level)}`} />
                      {seg.fraud_risk_level}
                    </span>
                  </td>

                  {/* Avg CTR */}
                  <td className="px-6 py-5 text-right font-label-md text-primary font-mono">
                    {seg.avg_ctr.toFixed(2)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}