// src/components/campaigns/CampaignShapExplainer.jsx

function ShapBar({ barWidth, positive }) {
  return (
    <div className="flex-1 mx-4 h-6 bg-surface-dim rounded relative overflow-hidden">
      {positive ? (
        <div
          className="absolute right-1/2 h-full bg-primary rounded-r-sm"
          style={{ width: `${Math.min(barWidth, 50)}%` }}
        />
      ) : (
        <div
          className="absolute left-1/2 h-full bg-error rounded-l-sm"
          style={{ width: `${Math.min(barWidth, 50)}%` }}
        />
      )}
    </div>
  )
}

function ShapCard({ campaignName, predictedCtr, aucScore, features }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-title-lg text-title-lg">{campaignName} — Click Prediction</h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Model: XGBoost v2.1 | AUC-ROC: {aucScore?.toFixed(2) ?? '—'}
          </p>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant">analytics</span>
      </div>

      <div className="space-y-2 mb-4">
        {features.map((f) => {
          const val = typeof f.shap_value === 'number' ? f.shap_value : 0
          const positive = val >= 0
          const barWidth = Math.abs(val) * 100
          return (
            <div key={f.feature_name} className="flex justify-between items-center text-xs">
              <span className="text-on-surface-variant w-40 shrink-0">{f.feature_name}</span>
              <ShapBar barWidth={barWidth} positive={positive} />
              <span className={`font-mono w-12 text-right ${positive ? 'text-primary' : 'text-error'}`}>
                {typeof f.shap_value === 'number' ? (positive ? '+' : '') + f.shap_value.toFixed(2) : '—'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-outline-variant">
        <div>
          <p className="text-[10px] text-on-surface-variant">Predicted CTR</p>
          <p className="text-xl font-bold text-tertiary">
            {Number.isFinite(predictedCtr) ? `${predictedCtr.toFixed(2)}%` : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-on-surface-variant">AUC-ROC</p>
          <p className="text-xs font-mono text-on-surface-variant">
            {Number.isFinite(aucScore) ? aucScore.toFixed(2) : '—'}
          </p>
        </div>
        <button className="text-xs text-primary hover:underline">Recompute</button>
      </div>

      <p className="text-[10px] text-on-surface-variant mt-3">
        SHAP values show each feature's contribution to click probability
      </p>
    </div>
  )
}

export default function CampaignShapExplainer({ shapInsights = [] }) {
  // Group by campaign_id
  const grouped = shapInsights.reduce((acc, insight) => {
    const key = insight.campaign_id
    if (!acc[key]) {
      acc[key] = {
        campaignId: insight.campaign_id,
        campaignName: insight.campaign_name,
        predictedCtr: insight.predicted_ctr,
        aucScore: insight.auc_score,
        features: [],
      }
    }
    acc[key].features.push({
      feature_name: insight.feature_name,
      shap_value: insight.shap_value,
    })
    return acc
  }, {})

  const cards = Object.values(grouped)

  return (
    <section>
      <div className="mb-6">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">ML Prediction Insights</h2>
        <p className="font-body-md text-on-surface-variant">
          SHAP-based feature importance for click probability predictions
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="text-on-surface-variant font-body-md">No SHAP insights available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {cards.map((card) => (
            <ShapCard
              key={card.campaignId}
              campaignName={card.campaignName}
              predictedCtr={card.predictedCtr}
              aucScore={card.aucScore}
              features={card.features}
            />
          ))}
        </div>
      )}
    </section>
  )
}