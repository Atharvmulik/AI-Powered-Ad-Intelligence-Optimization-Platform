// src/components/aiinsights/PerAdIntelligence.jsx
// Expandable per-ad intelligence table with mini SHAP chart and metrics.
// Owns adsData state (only for the expanded flag toggle).

import { useState } from 'react'
import { getClickProbColor, getFraudRiskColor } from '@/utils/aiInsightsHelpers'
import { ADS_DATA_INITIAL } from '@/data/aiInsightsData'

function MiniShapChart({ shapFeatures }) {
  return (
    <div className="space-y-2">
      {shapFeatures.map((feature, idx) => (
        <div key={idx} className="flex items-center">
          <div className="w-32 text-[10px] font-mono text-on-surface-variant truncate">{feature.name}</div>
          <div className="flex-1 h-4 bg-surface-container-lowest rounded overflow-hidden">
            <div
              className={`h-full ${feature.value >= 0 ? 'bg-primary' : 'bg-error'}`}
              style={{
                width: `${Math.min(Math.abs(feature.value) * 100, 100)}%`,
                marginLeft: feature.value < 0 ? 'auto' : '0',
              }}
            />
          </div>
          <div className={`w-12 text-right text-[10px] font-mono ml-2 ${feature.value >= 0 ? 'text-primary' : 'text-error'}`}>
            {feature.value >= 0 ? '+' : ''}{feature.value.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )
}

function AdRow({ ad, onToggle }) {
  return (
    <div className="border border-outline-variant rounded-lg overflow-hidden">
      {/* Main row */}
      <div className="p-4 bg-surface-container-lowest hover:bg-surface-container-high transition-colors">
        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-12 md:col-span-2">
            <p className="font-semibold text-on-surface">{ad.name}</p>
            <p className="text-xs text-on-surface-variant">{ad.category}</p>
          </div>
          <div className="col-span-6 md:col-span-2">
            <span className={`px-2 py-1 rounded-full text-xs font-mono border ${getClickProbColor(ad.clickProbability)}`}>
              {(ad.clickProbability * 100).toFixed(0)}% click prob
            </span>
          </div>
          <div className="col-span-6 md:col-span-2">
            <span className={`px-2 py-1 rounded-full text-xs font-mono border ${getFraudRiskColor(ad.fraudRisk)}`}>
              {ad.fraudRisk} risk
            </span>
          </div>
          <div className="col-span-12 md:col-span-4">
            <p className="text-xs font-mono text-on-surface-variant truncate">{ad.shapReason}</p>
          </div>
          <div className="col-span-12 md:col-span-2">
            <button
              onClick={() => onToggle(ad.id)}
              className="w-full text-xs text-primary hover:text-primary/80 font-mono flex items-center justify-center gap-1"
            >
              {ad.expanded ? 'Hide Explanation' : 'View Full Explanation'}
              <span className="material-symbols-outlined text-sm">
                {ad.expanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {ad.expanded && (
        <div className="border-t border-outline-variant/30 p-4 bg-surface-container-high">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mini SHAP */}
            <div>
              <p className="text-xs font-mono text-primary mb-3">Feature Impact for this Ad</p>
              <MiniShapChart shapFeatures={ad.shapFeatures} />
            </div>

            {/* Metrics */}
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-on-surface-variant font-mono">Recommendation Confidence</p>
                <p className="text-sm font-mono text-primary">{(ad.confidence * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-mono">Targeted Segments</p>
                <p className="text-xs text-on-surface">{ad.segments.join(' · ')}</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-mono">Ad Performance</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-primary">{ad.filteredClicks} filtered clicks</span>
                  <span className="text-xs text-on-surface-variant">vs</span>
                  <span className="text-xs text-on-surface-variant line-through">{ad.rawClicks} raw clicks</span>
                  <span className="text-xs text-green-500">
                    -{Math.round((1 - ad.filteredClicks / ad.rawClicks) * 100)}% fraud filtered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PerAdIntelligence() {
  const [adsData, setAdsData] = useState(ADS_DATA_INITIAL)

  const toggleAdExpansion = (id) =>
    setAdsData(prev => prev.map(ad => ad.id === id ? { ...ad, expanded: !ad.expanded } : ad))

  return (
    <section className="bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg col-span-12">
      <div className="mb-6">
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Per-Ad Intelligence</h3>
        <p className="text-body-md text-on-surface-variant">ML scores and explainability for individual ads</p>
      </div>

      <div className="space-y-3">
        {adsData.map(ad => (
          <AdRow key={ad.id} ad={ad} onToggle={toggleAdExpansion} />
        ))}
      </div>
    </section>
  )
}