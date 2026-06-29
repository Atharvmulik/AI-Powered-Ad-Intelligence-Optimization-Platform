import { formatReach } from '../../utils/audienceHelpers'

export default function AudienceSummaryStats({ overview, loading, error }) {
  if (error) {
    return <p className="text-error text-sm">Failed to load audience overview.</p>
  }

  // Kept text-yellow-400 static — the original never demonstrated a
  // value-dependent color for this card, only ever showed "Low-Medium" in
  // yellow. Only the text content is now dynamic.
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Addressable Reach */}
      <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[18px]">group</span>
        </div>
        <div className="min-w-0">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-label-md">Total Addressable Reach</p>
          <p className="font-bold text-sm text-on-surface">
            {loading || !overview ? '—' : formatReach(overview.total_addressable_reach)}
          </p>
        </div>
      </div>

      {/* Avg Fraud Risk */}
      <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-yellow-400 text-[18px]">security</span>
        </div>
        <div className="min-w-0">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-label-md">Avg Fraud Risk</p>
          <p className="font-bold text-sm text-yellow-400">
            {loading || !overview ? '—' : overview.avg_fraud_risk}
          </p>
        </div>
      </div>

      {/* Live Active Now */}
      <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-tertiary text-[18px] animate-pulse">sensors</span>
        </div>
        <div className="min-w-0">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-label-md">Live Active Now</p>
          <p className="font-bold text-sm text-tertiary">
            {loading || !overview ? '—' : overview.live_active_now.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Top Performing Segment */}
      <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[18px]">emoji_events</span>
        </div>
        <div className="min-w-0">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-label-md">Top Performing Segment</p>
          <p className="font-bold text-sm text-primary truncate">
            {loading || !overview
              ? '—'
              : `${overview.top_performing_segment} (${overview.top_performing_segment_ctr.toFixed(2)}% CTR)`}
          </p>
        </div>
      </div>
    </div>
  )
}