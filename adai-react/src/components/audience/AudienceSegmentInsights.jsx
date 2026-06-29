// Scale denominator reverse-engineered from the original mock bar widths
// (e.g. 0.31 -> 85% only resolves to a clean 0.31/0.36; 0.18 -> exactly 50%
// confirms it). Capped at 100 as a safety guard for any future contribution
// value that exceeds 0.36.
const SHAP_BAR_SCALE = 0.36

const formatContribution = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`

export default function AudienceSegmentInsights({ insights, loading, error }) {
  if (error) {
    return (
      <div className="col-span-12 glass-card rounded-xl overflow-hidden p-6">
        <p className="text-error text-sm">Failed to load segment insights.</p>
      </div>
    )
  }

  const cards = loading ? [] : insights

  return (
    <div className="col-span-12 glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-outline-variant flex items-center gap-3 bg-surface-container/30">
        <span className="material-symbols-outlined text-primary">auto_awesome</span>
        <h3 className="font-title-lg text-title-lg">AI-Driven Segment Insights</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
          Powered by SHAP
        </span>
      </div>

      {/* SHAP Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => {
          // Backend already returns features sorted by contribution
          // descending, so the top feature is simply the first item —
          // cleaner than parsing it back out of recommended_because.
          const topFeature = card.features[0]?.feature

          return (
            <div
              key={card.segment_id}
              className="bg-surface-container-high/40 border border-outline-variant/30 rounded-xl p-5 flex flex-col gap-4"
            >
              {/* Card title */}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">insights</span>
                <p className="font-bold text-on-surface text-sm">{card.segment_name}</p>
              </div>

              {/* SHAP feature bars */}
              <div className="space-y-3">
                {card.features.map((f) => (
                  <div key={f.feature}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-on-surface-variant font-mono truncate pr-2">{f.feature}</span>
                      <span className="text-[11px] font-bold text-primary font-mono shrink-0">
                        {formatContribution(f.contribution)}
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.round((f.contribution / SHAP_BAR_SCALE) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation note */}
              <p className="text-xs text-on-surface-variant italic border-t border-outline-variant/20 pt-3">
                Recommended because of{' '}
                <span className="text-primary not-italic font-semibold">{topFeature}</span>
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}