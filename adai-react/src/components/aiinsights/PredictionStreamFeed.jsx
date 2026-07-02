// src/components/aiinsights/PredictionStreamFeed.jsx
// Right 4/12 col — clickable prediction feed sourced from
// GET /api/v1/aiinsight/predictions. No client-generated stream items.
// Props: predictions (PredictionItem[]), onSelect(prediction), selectedKey

import { useEffect, useRef } from 'react'
import { isFraudPrediction, formatTimestamp } from '@/utils/aiInsightsHelpers'

export function predictionKey(p) {
  return `${p.ad_id}-${p.timestamp}`
}

export default function PredictionStreamFeed({ predictions, onSelect, selectedKey }) {
  const terminalRef = useRef(null)

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight
  }, [predictions])

  return (
    <section className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col h-[400px]">
      {/* Title bar */}
      <div className="bg-surface-container-high px-4 py-2 border-b border-outline-variant flex items-center justify-between shrink-0">
        <div className="flex space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-error/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-tertiary/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
        </div>
        <span className="text-label-md font-mono text-on-surface-variant">PREDICTION_STREAM</span>
      </div>

      {/* Prediction rows */}
      <div ref={terminalRef} className="p-4 flex-1 font-mono text-[12px] overflow-y-auto custom-scrollbar bg-surface-container-lowest">
        {(!predictions || predictions.length === 0) ? (
          <p className="text-on-surface-variant italic text-[11px]">No predictions logged yet.</p>
        ) : (
          <div className="space-y-2">
            {predictions.map((p) => {
              const key = predictionKey(p)
              const isSelected = selectedKey === key
              const isFraud = isFraudPrediction(p.fraud_probability)
              return (
                <div
                  key={key}
                  onClick={() => onSelect(p)}
                  className={`flex justify-between items-start font-mono p-2 rounded cursor-pointer transition-all ${
                    isSelected ? 'bg-primary/10 border-l-4 border-l-primary pl-3' : 'hover:bg-surface-container-high'
                  }`}
                >
                  <span className="text-on-surface-variant text-[11px]">[{formatTimestamp(p.timestamp)}]</span>
                  <span className="text-tertiary text-[11px] font-bold">{p.ad_id}</span>
                  <span className={`px-1.5 rounded text-[11px] font-bold ${isFraud ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                    {(p.click_probability * 100).toFixed(0)}%
                  </span>
                </div>
              )
            })}
            <div className="pt-2 text-primary/60 italic flex items-center font-mono text-[11px]">
              <span className="material-symbols-outlined text-xs mr-1">ads_click</span>
              Click any prediction to inspect
            </div>
          </div>
        )}
      </div>
    </section>
  )
}