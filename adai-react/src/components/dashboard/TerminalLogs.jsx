// ============================================================
// src/components/dashboard/TerminalLogs.jsx
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useDashboardWebSocket } from '@/hooks/useDashboardWebSocket'

export default function TerminalLogs() {
  const terminalEndRef = useRef(null)
  const { liveData, connected } = useDashboardWebSocket()
  const [logs, setLogs] = useState([])

  useEffect(() => {
    if (!liveData) return
    const entry = {
      timestamp: liveData.timestamp ?? Date.now(),
      event_type: liveData.event_type ?? 'update',
      message:
        liveData.message ??
        `EPS:${liveData.events_per_second ?? '-'} CTR:${liveData.ctr ?? '-'} AU:${liveData.active_users ?? '-'} `,
    }
    setLogs((prev) => [...prev.slice(-200), entry])
  }, [liveData])

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col h-[320px] relative group">
      <div className="px-6 py-3 bg-surface-container flex items-center justify-between border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">terminal</span>
          <h3 className="font-label-md text-label-md text-on-surface">PIPELINE_MONITOR :: v2.4.0</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${connected ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-error bg-error/10 border border-error/20'}`}>
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      <div
        ref={terminalEndRef}
        className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-on-surface-variant overflow-y-auto terminal-scroll space-y-1"
        style={{ background: '#050507' }}
      >
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 font-mono hover:bg-surface-container-low/20 py-0.5 px-1 rounded transition-colors">
            <span className="text-primary font-semibold select-none">[{new Date(log.timestamp).toLocaleTimeString('en-GB', { hour12: false })}]</span>
            <span className="font-extrabold select-none">{log.event_type}:</span>
            <span className="text-on-surface font-medium">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}