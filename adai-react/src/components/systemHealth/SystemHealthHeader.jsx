/**
 * SystemHealthHeader
 *
 * Props
 * -----
 * overallStatus : 'operational' | 'degraded' | 'outage'
 * nfrBadges     : NFRBadgeResponse | null
 * connected     : boolean  — WebSocket connection state
 */

// ---------------------------------------------------------------------------
// Badge config — derives display values from overallStatus
// ---------------------------------------------------------------------------

const OVERALL_STATUS_CONFIG = {
  operational: {
    label:      'All Systems Operational',
    dotColor:   'bg-green-400',
    textColor:  'text-green-400',
  },
  degraded: {
    label:      'Some Systems Degraded',
    dotColor:   'bg-tertiary',
    textColor:  'text-tertiary',
  },
  outage: {
    label:      'Service Outage Detected',
    dotColor:   'bg-error',
    textColor:  'text-error',
  },
}

// ---------------------------------------------------------------------------
// SLA badge config — derives icon and value color from SLA status
// ---------------------------------------------------------------------------

const SLA_ICON = {
  OK:      { icon: 'check_circle', valueColor: 'text-green-400' },
  WARNING: { icon: 'warning',      valueColor: 'text-tertiary'  },
  BREACH:  { icon: 'warning',      valueColor: 'text-error'     },
}

const SystemHealthHeader = ({ overallStatus = 'operational', nfrBadges = null, connected = false }) => {
  const statusCfg = OVERALL_STATUS_CONFIG[overallStatus] ?? OVERALL_STATUS_CONFIG.operational

  // Derive per-badge display values — fall back to last-known hardcoded
  // values while nfrBadges is null (before first fetch resolves)
  const bid = {
    label:      'Bid Response < 100ms',
    value:      nfrBadges ? `${nfrBadges.bid_engine_sla.toFixed(0)}ms` : '74ms',
    ...(SLA_ICON[nfrBadges?.bid_engine_status ?? 'OK']),
  }
  const ml = {
    label:      'ML Inference < 30ms',
    value:      nfrBadges ? `${nfrBadges.ml_sla.toFixed(0)}ms` : '340ms',
    ...(SLA_ICON[nfrBadges?.ml_status ?? 'BREACH']),
  }
  const dashboard = {
    label:      'Dashboard Lag < 3s',
    value:      nfrBadges ? `${nfrBadges.dashboard_sla.toFixed(1)}s` : '1.2s',
    ...(SLA_ICON[nfrBadges?.dashboard_status ?? 'OK']),
  }

  const slaBadges = [bid, ml, dashboard]

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-on-surface-variant font-body-md">Infrastructure performance and AI node health.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* WebSocket connection indicator */}
          {!connected && (
            <span className="text-[10px] font-mono text-tertiary animate-pulse">
              Reconnecting...
            </span>
          )}
          {/* Overall status badge */}
          <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant">
            <span className={`w-2 h-2 rounded-full ${statusCfg.dotColor} status-pulse`}></span>
            <span className={`font-label-md text-xs uppercase font-mono ${statusCfg.textColor}`}>
              {statusCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* SLA Summary Row */}
      <div className="flex flex-wrap gap-4 items-center mb-6 pb-2 border-b border-outline-variant">
        {slaBadges.map(({ label, value, icon, valueColor }) => (
          <div key={label} className="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-full">
            <span className={`material-symbols-outlined ${valueColor} text-sm`}>{icon}</span>
            <span className="text-xs font-mono font-bold">{label}</span>
            <span className={`font-mono font-bold ${valueColor}`}>{value}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export default SystemHealthHeader
