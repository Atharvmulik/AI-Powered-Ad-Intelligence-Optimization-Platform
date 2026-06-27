// src/components/aiinsights/PredictionStreamFeed.jsx
// Right 4/12 col — Clickable live prediction stream terminal.
// Owns stream state + interval. Calls onSelect when a row is clicked.
// Props: onSelect({ prediction, shapData, isFraud }), selectedKey (string for highlight)

import { useState, useEffect, useRef } from 'react'
import { generateStreamItemWithShap } from '@/utils/aiInsightsHelpers'

const buildInitialStream = () =>
  Array.from({ length: 6 }, () => generateStreamItemWithShap())

export default function PredictionStreamFeed({ onSelect, selectedKey }) {
  const [stream, setStream] = useState(buildInitialStream)
  const terminalRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => {
      setStream(prev => {
        const next = [...prev, generateStreamItemWithShap()]
        return next.length > 10 ? next.slice(next.length - 10) : next
      })
    }, 4000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (terminalRef.current)
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
  }, [stream])

  return (
    <section className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col h-[400px]">
      {/* Title bar */}
      <div className="bg-surface-container-high px-4 py-2 border-b border-outline-variant flex items-center justify-between shrink-0">
        <div className="flex space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-error/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-tertiary/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
        </div>
        <span className="text-label-md font-mono text-on-surface-variant">PREDICTION_STREAM:LIVE</span>
      </div>

      {/* Stream rows */}
      <div ref={terminalRef} className="p-4 flex-1 font-mono text-[12px] overflow-y-auto custom-scrollbar bg-surface-container-lowest">
        <div className="space-y-2">
          {stream.map((log, idx) => {
            const key = `${log.user}-${log.time}`
            const isSelected = selectedKey === key
            return (
              <div
                key={idx}
                onClick={() => onSelect({ prediction: log, shapData: log.shapData, isFraud: log.isFraud })}
                className={`flex justify-between items-start font-mono p-2 rounded cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-l-4 border-l-primary pl-3'
                    : 'hover:bg-surface-container-high'
                }`}
              >
                <span className="text-on-surface-variant text-[11px]">[{log.time}]</span>
                <span className="text-tertiary text-[11px] font-bold">{log.user}</span>
                <span className={`px-1.5 rounded text-[11px] font-bold ${log.isFraud ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                  {log.metric}
                </span>
              </div>
            )
          })}
          <div className="pt-2 text-primary/60 italic flex items-center font-mono text-[11px]">
            <span className="material-symbols-outlined text-xs mr-1">ads_click</span>
            Click any prediction to inspect
          </div>
        </div>
      </div>
    </section>
  )
}