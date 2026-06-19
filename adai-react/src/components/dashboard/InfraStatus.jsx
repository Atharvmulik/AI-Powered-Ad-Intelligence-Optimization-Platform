export default function InfraStatus({ infraStatus }) {
  return (
    <div className="lg:col-span-3 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-outline-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl animate-spin" style={{ animationDuration: '4s' }}>settings</span>
            <h3 className="font-title-lg text-title-lg text-on-surface">Infrastructure Health</h3>
          </div>
          <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 font-bold">
            OPERATIONAL
          </span>
        </div>

        <div className="space-y-3.5">
          {infraStatus.map((service, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-mono font-bold hover:bg-surface-container-low/30 p-1 rounded transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${service.lastBeat === 0 ? 'bg-green-400' : 'bg-green-500'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${service.lastBeat === 0 ? 'bg-green-400' : 'bg-green-500'}`}></span>
                </span>
                <span className="text-on-surface">{service.name}</span>
              </div>
              
              <div className="text-right flex items-center gap-3">
                <span className="text-[9px] text-on-surface-variant font-medium">Uptime: <span className="font-bold text-on-surface">{service.uptime}%</span></span>
                <span className="text-[8px] bg-surface-container-high px-1 py-0.5 rounded border border-outline-variant text-outline select-none">
                  {service.lastBeat}s ago
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-surface-container-low/40 rounded-lg border border-outline-variant/30 text-[10px] text-on-surface-variant font-mono font-medium mt-4">
        <div className="flex justify-between border-b border-outline-variant/20 pb-1 mb-1">
          <span>Avg Latency (P99):</span>
          <span className="font-bold text-primary">14.2ms</span>
        </div>
        <div className="flex justify-between">
          <span>Sync heartbeat:</span>
          <span className="font-bold text-green-400">ACKNOWLEDGED</span>
        </div>
      </div>
    </div>
  )
}
