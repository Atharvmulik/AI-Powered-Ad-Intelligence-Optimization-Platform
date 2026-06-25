// src/components/campaigns/CampaignChartTooltip.jsx
// Custom tooltip for the CTR vs Fraud Rate line chart.
// Must be declared outside any component to avoid 'cannot create components during render'.

export default function CampaignChartTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const ctrVal = payload[0]?.value
    const fraudVal = payload[1]?.value
    const eventsVal = payload[0]?.payload?.events

    return (
      <div className="bg-surface-container border border-outline-variant rounded-lg p-3 shadow-lg">
        <p className="text-xs text-on-surface-variant mb-1">{payload[0]?.payload?.time ?? '—'}</p>
        <p className="text-sm text-primary">CTR: {Number.isFinite(ctrVal) ? ctrVal.toFixed(2) + '%' : '—'}</p>
        <p className="text-sm text-error">Fraud Rate: {Number.isFinite(fraudVal) ? fraudVal.toFixed(2) + '%' : '—'}</p>
        <p className="text-xs text-on-surface-variant mt-1">
          Events: {eventsVal !== undefined && eventsVal !== null ? eventsVal.toLocaleString() : '—'}
        </p>
      </div>
    )
  }
  return null
}