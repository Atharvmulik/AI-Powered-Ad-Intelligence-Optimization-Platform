// src/components/campaigns/FraudSummaryPanel.jsx

const LOG_BORDER_COLORS = ['border-primary', 'border-tertiary', 'border-info']

function formatPeriodLabel(period) {
  switch (period) {
    case 'today':        return 'Fraud Summary — Today'
    case 'last_7_days':  return 'Fraud Summary — Last 7 Days'
    case 'last_30_days': return 'Fraud Summary — Last 30 Days'
    default:             return `Fraud Summary — ${period ?? ''}`
  }
}

function formatNextRun(createdAt, idx) {
  // Placement agent logs use created_at; show relative time for latest, episode for others
  if (idx === 0) return 'Last Action'
  return `Episode ${createdAt}`
}

export default function FraudSummaryPanel({ fraudSummary, placementAgent }) {
  const summary = fraudSummary
  const logs = (placementAgent ?? []).slice(0, 3)

  return (
    <div className="space-y-4">
      {/* ── Fraud Summary ── */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
        <h4 className="font-title-md text-title-md mb-4">
          {summary ? formatPeriodLabel(summary.period) : 'Fraud Summary'}
        </h4>

        {!summary ? (
          <p className="text-on-surface-variant font-body-md">No summary data available.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-surface-container rounded-lg">
                <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Total Blocked</p>
                <p className="text-xl font-bold text-error">{summary.blocked.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-surface-container rounded-lg">
                <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Precision</p>
                <p className="text-xl font-bold text-green-500">{summary.precision}%</p>
              </div>
              <div className="p-3 bg-surface-container rounded-lg">
                <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Recall</p>
                <p className="text-xl font-bold text-info">{summary.recall}%</p>
              </div>
              <div className="p-3 bg-surface-container rounded-lg">
                <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Budget Saved</p>
                <p className="text-xl font-bold text-primary">${summary.budget_saved.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-label-md text-on-surface-variant">Traffic Breakdown</p>
              <div className="flex h-6 rounded-lg overflow-hidden">
                <div
                  className="bg-green-500 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${summary.clean_percent}%` }}
                >
                  Clean {summary.clean_percent}%
                </div>
                <div
                  className="bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${summary.suspicious_percent}%` }}
                >
                  {summary.suspicious_percent >= 5 ? `Suspicious ${summary.suspicious_percent}%` : ''}
                </div>
                <div
                  className="bg-red-500 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${summary.blocked_percent}%` }}
                >
                  {summary.blocked_percent >= 3 ? `Blocked ${summary.blocked_percent}%` : ''}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Smart Placement Agent (PPO / RL) ── */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-start">
          <h4 className="font-title-md text-title-md">Smart Placement Agent</h4>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-tertiary/10 text-tertiary uppercase tracking-wider">
            PPO
          </span>
        </div>
        <p className="font-body-sm text-on-surface-variant text-xs">
          RL agent learning optimal position, format, and timing from live engagement reward signals.
        </p>

        <div className="space-y-3 mt-4">
          {logs.length === 0 ? (
            <p className="text-on-surface-variant font-body-md text-xs">No placement agent logs available.</p>
          ) : (
            logs.map((entry, idx) => (
              <div
                key={`${entry.episode}-${idx}`}
                className={`flex justify-between items-center p-3 bg-surface-container rounded-lg border-l-4 ${LOG_BORDER_COLORS[idx] ?? 'border-outline-variant'}`}
              >
                <div>
                  <p className="text-xs font-label-md text-on-surface-variant">
                    {idx === 0 ? 'Last Action' : `Episode ${entry.episode}`}
                  </p>
                  <p className="text-sm font-bold">{entry.action}</p>
                </div>
                <span className="text-xs font-mono text-tertiary">
                  reward {entry.expected_reward}
                </span>
              </div>
            ))
          )}

          {/* Next policy update */}
          <div className="flex justify-between items-center p-3 bg-surface-container rounded-lg border-l-4 border-info">
            <div>
              <p className="text-xs font-label-md text-on-surface-variant">Next Policy Update</p>
              <p className="text-sm font-bold">Reward Re-evaluation</p>
            </div>
            <span className="text-xs font-mono text-info">
              {logs[0]?.created_at
                ? (() => {
                    try {
                      const diff = new Date(logs[0].created_at).getTime() + 8 * 60 * 1000 - Date.now()
                      if (diff <= 0) return 'due soon'
                      const m = Math.floor(diff / 60000)
                      const s = Math.floor((diff % 60000) / 1000)
                      return `${m}:${s.toString().padStart(2, '0')}`
                    } catch {
                      return '—'
                    }
                  })()
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}