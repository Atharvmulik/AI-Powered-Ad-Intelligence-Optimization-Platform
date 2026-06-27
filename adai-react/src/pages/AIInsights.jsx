// src/pages/AIInsights.jsx
// Orchestrator — owns only the cross-component selection state
// (selectedPrediction, selectedShapData, selectedIsFraud, viewMode)
// that connects PredictionStreamFeed → ShapExplainerPanel.
// All other state lives inside the child components.

import { useState } from 'react'

import KafkaMetricsStrip          from '@/components/aiinsights/KafkaMetricsStrip'
import ModelStatusCards           from '@/components/aiinsights/ModelStatusCards'
import ShapExplainerPanel         from '@/components/aiinsights/ShapExplainerPanel'
import PredictionStreamFeed       from '@/components/aiinsights/PredictionStreamFeed'
import RecommendationExplanation  from '@/components/aiinsights/RecommendationExplanation'
import PerAdIntelligence          from '@/components/aiinsights/PerAdIntelligence'

export default function AIInsights() {
  // ── Cross-component selection state ────────────────────────────────────────
  // Set by PredictionStreamFeed, read by ShapExplainerPanel.
  const [selectedPrediction, setSelectedPrediction] = useState(null)
  const [selectedShapData,   setSelectedShapData]   = useState(null)
  const [selectedIsFraud,    setSelectedIsFraud]     = useState(false)
  const [viewMode,           setViewMode]            = useState('business') // 'business' | 'ml'

  const handleStreamSelect = ({ prediction, shapData, isFraud }) => {
    setSelectedPrediction(prediction)
    setSelectedShapData(shapData)
    setSelectedIsFraud(isFraud)
    setViewMode('business')
  }

  // Build a stable key for highlight matching in the stream
  const selectedKey = selectedPrediction
    ? `${selectedPrediction.user}-${selectedPrediction.time}`
    : null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-gutter relative">

      {/* Section 1 — Kafka metrics */}
      <KafkaMetricsStrip />

      {/* Section 2 — Model status cards + degradation toggle */}
      <ModelStatusCards />

      {/* Section 3 — SHAP Explainer (left) + Prediction Stream (right) */}
      <div className="grid grid-cols-12 gap-gutter">
        <ShapExplainerPanel
          selectedPrediction={selectedPrediction}
          selectedShapData={selectedShapData}
          selectedIsFraud={selectedIsFraud}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <PredictionStreamFeed
          onSelect={handleStreamSelect}
          selectedKey={selectedKey}
        />
      </div>

      {/* Section 4 — Recommendation Explanation */}
      <div className="grid grid-cols-12 gap-gutter">
        <RecommendationExplanation />
      </div>

      {/* Section 5 — Per-Ad Intelligence drill-down */}
      <PerAdIntelligence />

    </div>
  )
}