// src/components/aiinsights/AudienceSegmentCards.jsx
// New component — GET /api/v1/aiinsight/audience-segments had no existing
// UI home in the original AI Insight page. Added so this endpoint's data
// is actually surfaced rather than fetched and discarded.

import { AnimatePresence, motion } from 'framer-motion'

import { useExpandableItems } from '@/components/aiinsights/useExpandableItems'

function DeviceBar({ label, pct, color }) {
  const hasPercentage = Number.isFinite(pct)
  const barWidth = hasPercentage ? Math.min(100, Math.max(0, pct)) : 0

  return (
    <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant">
      <span className="w-14">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${barWidth}%` }} />
      </div>
      <span className="w-10 text-right">{hasPercentage ? `${pct.toFixed(0)}%` : '—'}</span>
    </div>
  )
}

function SegmentCard({ segment }) {
  const hasGrowth = Number.isFinite(segment.growth_pct)
  const growthIsPositive = hasGrowth && segment.growth_pct >= 0
  const topFeatures = Array.isArray(segment.top_features) ? segment.top_features : []
  const tags = Array.isArray(segment.tags) ? segment.tags : []

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {segment.icon && <span className="material-symbols-outlined text-primary">{segment.icon}</span>}
          <div>
            <h4 className="font-semibold text-on-surface">{segment.segment_name}</h4>
            {segment.subtitle && <p className="text-xs text-on-surface-variant">{segment.subtitle}</p>}
          </div>
        </div>
        <span className={`text-xs font-mono ${growthIsPositive ? 'text-green-500' : hasGrowth ? 'text-error' : 'text-on-surface-variant'}`}>
          {hasGrowth ? `${growthIsPositive ? '+' : ''}${segment.growth_pct.toFixed(1)}%` : '—'}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-on-surface-variant text-xs">Reach</span>
        <span className="font-mono text-primary">
          {Number.isFinite(segment.reach) ? segment.reach.toLocaleString() : '—'}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        <DeviceBar label="Mobile" pct={segment.mobile_pct} color="bg-primary" />
        <DeviceBar label="Desktop" pct={segment.desktop_pct} color="bg-tertiary" />
        <DeviceBar label="Tablet" pct={segment.tablet_pct} color="bg-outline-variant" />
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant mb-3">
        <span>Predicted CTR {Number.isFinite(segment.avg_ctr) ? `${segment.avg_ctr.toFixed(1)}%` : '—'}</span>
        {segment.fraud_risk && <span>Fraud risk: {segment.fraud_risk}</span>}
      </div>

      {topFeatures.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {topFeatures.map((feature, index) => (
            <span key={`${feature}-${index}`} className="px-2 py-0.5 text-[10px] rounded-full border border-outline-variant text-on-surface-variant">
              {feature}
            </span>
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className="px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AudienceSegmentCards({ segments }) {
  const items = Array.isArray(segments) ? segments : []
  const { expanded, visibleItems, toggleExpanded } = useExpandableItems(items, 6)
  const hasMoreSegments = items.length > 6
  const segmentKeyCounts = new Map()

  if (items.length === 0) {
    return (
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg text-center text-on-surface-variant text-body-md col-span-12">
        No audience segments available yet.
      </section>
    )
  }

  return (
    <section className="col-span-12">
      <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-4">Audience Segments</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <AnimatePresence mode="popLayout">
          {visibleItems.map((segment) => {
            // Without a backend identity, segment_name is the stable fallback;
            // renamed segments will therefore be treated as different cards.
            const hasStableId = segment.segment_id !== undefined &&
              segment.segment_id !== null &&
              segment.segment_id !== ''
            const identity = hasStableId
              ? `id:${segment.segment_id}`
              : `name:${segment.segment_name}`
            const occurrence = segmentKeyCounts.get(identity) ?? 0
            segmentKeyCounts.set(identity, occurrence + 1)

            return (
              <motion.div
                key={`${identity}:${occurrence}`}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <SegmentCard segment={segment} />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {hasMoreSegments && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={toggleExpanded}
            className="text-xs font-mono text-primary hover:text-primary/80"
          >
            {expanded ? 'View Less' : 'View More'}
          </button>
        </div>
      )}
    </section>
  )
}