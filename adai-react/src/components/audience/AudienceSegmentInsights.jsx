import { SHAP_DATA } from '../../data/audienceData'

export default function AudienceSegmentInsights() {
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
        {SHAP_DATA.map((card) => (
          <div
            key={card.segment}
            className="bg-surface-container-high/40 border border-outline-variant/30 rounded-xl p-5 flex flex-col gap-4"
          >
            {/* Card title */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">insights</span>
              <p className="font-bold text-on-surface text-sm">{card.segment}</p>
            </div>

            {/* SHAP feature bars */}
            <div className="space-y-3">
              {card.features.map((f) => (
                <div key={f.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] text-on-surface-variant font-mono truncate pr-2">{f.label}</span>
                    <span className="text-[11px] font-bold text-primary font-mono shrink-0">{f.value}</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: f.barW }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendation note */}
            <p className="text-xs text-on-surface-variant italic border-t border-outline-variant/20 pt-3">
              Recommended because of{' '}
              <span className="text-primary not-italic font-semibold">{card.topFeature}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}