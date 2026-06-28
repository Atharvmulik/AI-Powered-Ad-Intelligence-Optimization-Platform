import { SEGMENT_META } from '../../data/audienceData'
import { formatReach, fraudBadgeClass, fraudDotClass } from '../../utils/audienceHelpers'

export default function AudienceSegmentsTable({ reaches }) {
  return (
    <div className="col-span-12 lg:col-span-8 glass-card rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container/30">
        <h3 className="font-title-lg text-title-lg">High-Performing Segments</h3>
        <span className="text-label-md bg-secondary-container/20 text-secondary px-2 py-1 rounded">
          34 Segments Active
        </span>
      </div>

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
            {SEGMENT_META.map((seg, i) => (
              <tr key={i} className="hover:bg-surface-container transition-colors group">
                {/* Segment Name + tags */}
                <td className="px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded ${seg.iconBg} flex items-center justify-center ${seg.iconColor} shrink-0 mt-0.5`}>
                      <span className="material-symbols-outlined">{seg.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{seg.name}</p>
                      <p className="text-xs text-on-surface-variant mb-1.5">{seg.desc}</p>
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

                {/* Reach — live */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shrink-0" />
                    <span className="font-label-md font-mono text-sm">
                      {formatReach(seg, reaches[i])}
                    </span>
                  </div>
                </td>

                {/* Growth */}
                <td className="px-6 py-5">
                  <div className={`flex items-center gap-1 ${seg.isUp ? 'text-tertiary' : 'text-error'}`}>
                    <span className="material-symbols-outlined text-sm font-bold">
                      {seg.isUp ? 'trending_up' : 'trending_down'}
                    </span>
                    <span className="font-label-md font-mono">{seg.growth}</span>
                  </div>
                </td>

                {/* Device Split */}
                <td className="px-6 py-5">
                  <div className="min-w-[100px]">
                    <p className="text-xs text-on-surface-variant mb-1.5">
                      <span className="text-secondary font-semibold">{seg.mobile}%</span>
                      <span className="mx-1 opacity-40">/</span>
                      <span className="text-primary font-semibold">{seg.desktop}%</span>
                      <span className="ml-1 opacity-50 text-[10px]">M/D</span>
                    </p>
                    <div className="w-full h-1 rounded-full overflow-hidden flex bg-surface-container-highest">
                      <div
                        className="bg-secondary h-full rounded-l-full"
                        style={{ width: `${seg.mobile}%` }}
                      />
                      <div
                        className="bg-primary h-full rounded-r-full"
                        style={{ width: `${seg.desktop}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Fraud Risk */}
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${fraudBadgeClass(seg.fraudRisk)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${fraudDotClass(seg.fraudRisk)}`} />
                    {seg.fraudRisk}
                  </span>
                </td>

                {/* Avg CTR */}
                <td className="px-6 py-5 text-right font-label-md text-primary font-mono">{seg.ctr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}