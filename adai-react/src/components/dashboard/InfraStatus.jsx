// ============================================================
// src/components/dashboard/InfraStatus.jsx
// ============================================================

export default function InfraStatus({ infraStatus = [] }) {
  const avgLatency =
    infraStatus.length > 0
      ? (
          infraStatus.reduce((sum, s) => sum + s.latency_ms, 0) / infraStatus.length
        ).toFixed(1)
      : '—'

  const allHealthy = infraStatus.length > 0 && infraStatus.every(s => s.status === 'healthy' || s.status === 'ok')
  const statusLabel = allHealthy ? 'OPERATIONAL' : 'DEGRADED'
  const statusColor = allHealthy ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-[#ffb783] bg-[#ffb783]/10 border-[#ffb783]/20'

  return (
    <div className="lg:col-span-3 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-xl animate-spin"
              style={{ animationDuration: '4s' }}
            >
              settings
            </span>
            <h3 className="font-title-lg text-title-lg text-on-surface">
              Infrastructure Health
            </h3>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        <div className="space-y-3.5">
          {infraStatus.map((service, idx) => {
            const isHealthy = service.status === 'healthy' || service.status === 'ok'
            return (
              <div
                key={idx}
                className="flex items-center justify-between text-xs font-mono font-bold hover:bg-surface-container-low/30 p-1 rounded transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                        isHealthy ? 'bg-green-400' : 'bg-error'
                      }`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isHealthy ? 'bg-green-400' : 'bg-error'
                      }`}
                    ></span>
                  </span>
                  <span className="text-on-surface">{service.service_name}</span>
                </div>

                <div className="text-right flex items-center gap-3">
                  <span className="text-[9px] text-on-surface-variant font-medium">
                    Uptime:{' '}
                    <span className="font-bold text-on-surface">{service.uptime}%</span>
                  </span>
                  <span className="text-[8px] bg-surface-container-high px-1 py-0.5 rounded border border-outline-variant text-outline select-none">
                    {service.last_heartbeat}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-3 bg-surface-container-low/40 rounded-lg border border-outline-variant/30 text-[10px] text-on-surface-variant font-mono font-medium mt-4">
        <div className="flex justify-between border-b border-outline-variant/20 pb-1 mb-1">
          <span>Avg Latency (P99):</span>
          <span className="font-bold text-primary">{avgLatency}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Sync heartbeat:</span>
          <span className={`font-bold ${allHealthy ? 'text-green-400' : 'text-[#ffb783]'}`}>{allHealthy ? 'ACKNOWLEDGED' : 'DEGRADED'}</span>
        </div>
      </div>
    </div>
  )
}