// src/components/campaigns/FraudDetectionFeed.jsx

import { useRef, useEffect } from 'react'

function getFraudColor(score) {
  if (score < 0.3) return 'bg-green-500'
  if (score < 0.7) return 'bg-amber-500'
  return 'bg-red-500'
}

function getFraudScoreLabel(score) {
  if (score < 0.3) return 'Low Risk'
  if (score < 0.7) return 'Medium Risk'
  return 'High Risk'
}

function getCategoryClasses(category) {
  switch ((category ?? '').toLowerCase()) {
    case 'bot traffic':        return 'bg-red-500/20 text-red-500'
    case 'click farm':         return 'bg-amber-500/20 text-amber-500'
    case 'suspicious human':   return 'bg-yellow-500/20 text-yellow-500'
    default:                   return 'bg-green-500/20 text-green-500'
  }
}

function getStatusClasses(status) {
  switch ((status ?? '').toLowerCase()) {
    case 'blocked': return 'bg-red-500/20 text-red-500'
    case 'flagged': return 'bg-amber-500/20 text-amber-500'
    default:        return 'bg-green-500/20 text-green-500'
  }
}

function formatTimestamp(ts) {
  try {
    return new Date(ts).toLocaleTimeString()
  } catch {
    return ts
  }
}

export default function FraudDetectionFeed({ fraudFeed }) {
  const feedRef = useRef(null)
  const events = fraudFeed?.events ?? []

  // Auto-scroll to top when events update
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [events])

  return (
    <div className="lg:col-span-2 bg-[#050507] border border-outline-variant rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h3 className="font-title-lg text-title-lg text-on-surface">Fraud Detection Feed</h3>
          </div>
          <span className="px-2 py-1 bg-red-500/20 text-red-500 text-[10px] font-bold rounded uppercase tracking-wider">
            ACTIVE
          </span>
        </div>
        <span className="text-[10px] font-mono text-on-surface-variant">
          Real-time • Isolation Forest v3.2
        </span>
      </div>

      {/* Feed */}
      <div ref={feedRef} className="h-[400px] overflow-y-auto space-y-2 p-4">
        {events.length === 0 ? (
          <p className="text-on-surface-variant font-body-md text-center mt-8">No fraud events detected.</p>
        ) : (
          events.map((event) => (
            <div
              key={event.event_id}
              className="bg-surface-container/50 border border-outline-variant rounded-lg p-3 hover:bg-surface-container transition-all animate-fadeIn"
            >
              {/* Row 1: timestamp + IP + status badge */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-on-surface-variant">
                    {formatTimestamp(event.timestamp)}
                  </span>
                  <span className="font-mono text-xs text-primary">{event.ip_address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getFraudColor(event.fraud_score)}`} />
                    <span className="text-xs font-mono text-on-surface-variant">
                      {getFraudScoreLabel(event.fraud_score)}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${getStatusClasses(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              </div>

              {/* Row 2: fraud score bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-on-surface-variant">Fraud Score</span>
                  <span className="font-mono text-on-surface">{event.fraud_score}</span>
                </div>
                <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${getFraudColor(event.fraud_score)} h-full rounded-full transition-all`}
                    style={{ width: `${event.fraud_score * 100}%` }}
                  />
                </div>
              </div>

              {/* Row 3: category + severity */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${getCategoryClasses(event.fraud_category)}`}>
                    {event.fraud_category}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-on-surface-variant capitalize">
                  Severity: {event.severity}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}