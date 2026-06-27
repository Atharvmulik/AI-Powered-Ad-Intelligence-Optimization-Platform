// src/components/aiinsights/ModelStatusCards.jsx
// Section 2 — Click Prediction, Fraud Detection, Recommendation Engine cards.
// Owns isDegraded and blockedToday state.
// Degradation banner is rendered here and sits above the cards.

import { useState, useEffect } from 'react'
import { INITIAL_FRAUD_ALERTS, FRAUD_ALERT_IP_POOL, FRAUD_ALERT_CATEGORIES, FRAUD_ALERT_FEATURES } from '@/data/aiInsightsData'

function StatusBadge({ online, degraded }) {
  if (degraded)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
        DEGRADED
      </span>
    )
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-500">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
      ONLINE
    </span>
  )
}

function ModelCard({ icon, iconBg, iconColor, title, subtitle, children }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant p-stack-lg rounded-xl glow-indigo">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
        </div>
        {children[0]}
      </div>
      <h3 className="font-title-lg text-title-lg text-on-surface">{title}</h3>
      <p className="text-xs text-on-surface-variant mt-1">{subtitle}</p>
      <div className="mt-4 pt-4 border-t border-outline-variant/30">
        {children[1]}
      </div>
    </div>
  )
}

export default function ModelStatusCards() {
  const [isDegraded,    setIsDegraded]    = useState(false)
  const [blockedToday,  setBlockedToday]  = useState(47)

  // Live fraud blocked count
  useEffect(() => {
    const fraudInterval = setInterval(() => {
      setBlockedToday(prev => prev + 1)
    }, 6000)
    return () => clearInterval(fraudInterval)
  }, [])

  return (
    <div className="relative">
      {/* Degradation warning banner */}
      {isDegraded && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-xl p-4 mb-4">
          <div className="flex items-center">
            <span className="material-symbols-outlined text-amber-500 mr-3">warning</span>
            <p className="text-amber-500 text-sm font-mono">
              ⚠ Model degradation detected — Click Prediction AUC-ROC below acceptance threshold. Retraining triggered automatically.
            </p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsDegraded(v => !v)}
        className="absolute top-2 right-2 z-10 px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded-lg text-xs font-mono hover:border-primary/50 transition-all"
      >
        {isDegraded ? '🔴 Reset Model' : '🟢 Simulate Degradation'}
      </button>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Click Prediction */}
        <ModelCard
          icon="ads_click" iconBg="bg-primary/10" iconColor="text-primary"
          title="Click Prediction"
          subtitle="XGBoost / LightGBM Ensemble v4.2"
        >
          <StatusBadge degraded={isDegraded} />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider">AUC-ROC</span>
              <span className={`text-label-md font-bold font-mono ${isDegraded ? 'text-amber-500' : 'text-primary'}`}>
                {isDegraded ? '0.743' : '0.812'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
              <span>Retrained 2h ago · Next in 22h</span>
              <span>8%</span>
            </div>
            <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary" style={{ width: '8%' }} />
            </div>
          </div>
        </ModelCard>

        {/* Fraud Detection */}
        <ModelCard
          icon="gpp_bad" iconBg="bg-error/10" iconColor="text-error"
          title="Fraud Detection"
          subtitle="Isolation Forest + Autoencoder Ensemble v1.8"
        >
          <StatusBadge online />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Avg latency</span>
              <span className="text-label-md font-bold text-primary font-mono">14ms</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Blocked Today</span>
              <span className="text-label-md font-bold text-primary font-mono">{blockedToday}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
              <span>Retrained 45min ago · Next in 23h</span>
              <span>3%</span>
            </div>
            <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary" style={{ width: '3%' }} />
            </div>
          </div>
        </ModelCard>

        {/* Recommendation Engine */}
        <ModelCard
          icon="recommend" iconBg="bg-tertiary/10" iconColor="text-tertiary"
          title="Recommendation Engine"
          subtitle="Collaborative Filter v2.1"
        >
          <StatusBadge online />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Coverage</span>
              <span className="text-label-md font-bold text-primary font-mono">88.5%</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
              <span>Retrained 5h ago · Next in 1h</span>
              <span>79%</span>
            </div>
            <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary" style={{ width: '79%' }} />
            </div>
          </div>
        </ModelCard>
      </section>
    </div>
  )
}