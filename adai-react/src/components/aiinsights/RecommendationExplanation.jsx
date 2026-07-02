// src/components/aiinsights/RecommendationExplanation.jsx
// Recent recommendation log entries from
// GET /api/v1/aiinsight/recommendations.

import { formatTimestamp } from '@/utils/aiInsightsHelpers'

function RecommendationCard({ rec }) {
  return (
    <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-title-lg text-on-surface font-semibold">{rec.campaign_name ?? rec.ad_id}</p>
          <p className="text-[10px] text-on-surface-variant font-mono">{rec.ad_id} · {formatTimestamp(rec.timestamp)}</p>
        </div>
        <span className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg font-bold text-sm shrink-0">
          {rec.recommendation_score.toFixed(2)}
        </span>
      </div>
      {rec.explanation && (
        <div className="flex items-start mt-3">
          <span className="material-symbols-outlined text-primary text-sm mt-1 mr-2">lightbulb</span>
          <p className="text-body-md text-on-surface-variant">{rec.explanation}</p>
        </div>
      )}
    </div>
  )
}

export default function RecommendationExplanation({ recommendations }) {
  const items = recommendations ?? []

  return (
    <section className="col-span-12 lg:col-span-7 bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg">
      <div className="flex items-center mb-6">
        <span className="material-symbols-outlined text-primary mr-3" style={{ fontVariationSettings: "'FILL' 1" }}>
          lightbulb
        </span>
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Recommendation Explanations</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-body-md text-on-surface-variant text-center py-8">No recommendations logged yet.</p>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {items.map((rec, idx) => (
            <RecommendationCard key={`${rec.ad_id}-${rec.timestamp}-${idx}`} rec={rec} />
          ))}
        </div>
      )}
    </section>
  )
}