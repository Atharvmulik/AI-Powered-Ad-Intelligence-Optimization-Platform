// src/components/aiinsights/AudienceSegmentCards.jsx
// New component — GET /api/v1/aiinsight/audience-segments had no existing
// UI home in the original AI Insight page. Added so this endpoint's data
// is actually surfaced rather than fetched and discarded.

import { AnimatePresence, motion } from 'framer-motion'

import { useExpandableItems } from '@/components/aiinsights/useExpandableItems'

function DeviceBar({ label, pct, color }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant">
      <span className="w-14">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right">{pct.toFixed(0)}%</span>
    </div>
  )
}

function SegmentCard({ segment }) {
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
        <span className={`text-xs font-mono ${segment.growth_pct >= 0 ? 'text-green-500' : 'text-error'}`}>
          {segment.growth_pct >= 0 ? '+' : ''}
          {segment.growth_pct.toFixed(1)}%
        </span>
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-on-surface-variant text-xs">Reach</span>
        <span className="font-mono text-primary">{segment.reach.toLocaleString()}</span>
      </div>

      <div className="space-y-1 mb-3">
        <DeviceBar label="Mobile" pct={segment.mobile_pct} color="bg-primary" />
        <DeviceBar label="Desktop" pct={segment.desktop_pct} color="bg-tertiary" />
        <DeviceBar label="Tablet" pct={segment.tablet_pct} color="bg-outline-variant" />
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant mb-3">
        <span>Avg CTR {segment.avg_ctr.toFixed(1)}%</span>
        {segment.fraud_risk && <span>Fraud risk: {segment.fraud_risk}</span>}
      </div>

      {segment.top_features.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {segment.top_features.map((feature) => (
            <span key={feature} className="px-2 py-0.5 text-[10px] rounded-full border border-outline-variant text-on-surface-variant">
              {feature}
            </span>
          ))}
        </div>
      )}

      {segment.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {segment.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AudienceSegmentCards({ segments }) {
  const items = segments ?? []
  const { expanded, visibleItems, toggleExpanded } = useExpandableItems(items, 6)
  const hasMoreSegments = items.length > 6

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
          {visibleItems.map((segment) => (
            <motion.div
              key={segment.segment_name}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <SegmentCard segment={segment} />
            </motion.div>
          ))}
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