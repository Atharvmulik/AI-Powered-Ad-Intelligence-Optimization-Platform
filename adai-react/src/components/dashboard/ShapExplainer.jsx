// ============================================================
// src/components/dashboard/ShapExplainer.jsx
// ============================================================

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { dashboardService } from '@/services/dashboardService'

export default function ShapExplainer({ topAds = [], selectedCampaignId = null }) {
  const [selectedId, setSelectedId] = useState(selectedCampaignId)
  const [shapData, setShapData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (selectedCampaignId) {
      setSelectedId(selectedCampaignId)
      return
    }
    if (!selectedCampaignId && topAds && topAds.length > 0 && !selectedId) {
      setSelectedId(topAds[0].campaign_id)
    }
  }, [selectedCampaignId, topAds])

  useEffect(() => {
    if (!selectedId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    dashboardService
      .getShapExplanations(encodeURIComponent(selectedId))
      .then((data) => {
        if (!cancelled) {
          setShapData(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? String(err))
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedId])

  return (
    <div className="lg:col-span-5 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">neurology</span>
            <h3 className="font-title-lg text-title-lg text-on-surface">
              Why This Ad Was Recommended
            </h3>
          </div>
          {topAds.length > 0 && (
            <div className="flex items-center gap-1.5 bg-surface-container-high border border-outline-variant p-1 rounded-lg">
              {topAds.map((ad) => (
                <button
                  key={ad.campaign_id}
                  onClick={() => setSelectedId(ad.campaign_id)}
                  className={`text-[9px] font-mono font-bold uppercase px-2 py-1 rounded transition-all ${
                    selectedId === ad.campaign_id
                      ? 'bg-primary text-on-primary shadow'
                      : 'hover:bg-surface-bright text-on-surface-variant'
                  }`}
                >
                  {ad.campaign_name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-on-surface-variant mb-5 font-mono">
          Campaign Model target:{' '}
          <span className="font-bold text-on-surface">{selectedId ?? '—'}</span> · SHAP
          Feature Contribution values (Transparency index: 94.8% reliable)
        </p>

        {loading && (
          <div className="flex items-center justify-center h-32 text-on-surface-variant font-mono text-xs animate-pulse">
            Loading SHAP explanations...
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center h-32 text-error font-mono text-xs">
            {error}
          </div>
        )}

        {!loading && !error && shapData && (
          <div className="space-y-4">
            {shapData.features.map((row, idx) => (
              <div key={idx} className="relative group/bar cursor-help">
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span className="text-on-surface flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    {row.feature}
                  </span>
                  <span className="text-green-400 font-extrabold">+{row.impact}%</span>
                </div>
                <div className="w-full bg-surface-container-low border border-outline-variant/30 h-2.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.impact * 2.5}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full bg-primary rounded-full shadow-[0_0_8px_#8083ff]"
                  />
                </div>
                <div className="absolute left-0 right-0 -top-12 z-20 hidden group-hover/bar:block bg-surface-container-high border border-outline rounded-lg p-2 text-[10px] font-mono leading-relaxed shadow-2xl">
                  <div className="text-primary font-bold">{row.feature} Impact:</div>
                  <div className="text-on-surface-variant">{row.details}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 bg-surface-container-low/40 rounded-lg border border-outline-variant/30 text-[10px] text-on-surface-variant font-mono font-medium mt-6 flex gap-2">
        <span className="material-symbols-outlined text-sm text-primary">visibility</span>
        <span>
          SHAP (SHapley Additive exPlanations) computes contribution weightings directly from
          the model's neural network shards.
        </span>
      </div>
    </div>
  )
}