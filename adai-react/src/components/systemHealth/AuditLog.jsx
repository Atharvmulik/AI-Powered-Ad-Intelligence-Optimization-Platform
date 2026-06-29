import { useState, useEffect, useRef } from 'react'

import {
  AUDIT_LOG_INTERVAL_MS,
  AUDIT_LOG_MAX_LINES,
  AUDIT_INITIAL_LOGS,
  AUDIT_LOG_PHRASES,
} from '../../constants/systemHealth'

import {
  formatTimeHHMMSS,
  appendLogEntry,
  randomAuditPhrase,
} from '../../utils/systemHealthHelpers'

// ---------------------------------------------------------------------------
// Adapter — AuditLogEntry (backend) → terminal log shape
// ---------------------------------------------------------------------------

const LEVEL_COLOR_MAP = {
  INFO:    'text-primary',
  WARN:    'text-tertiary',
  ERROR:   'text-error',
  TRACE:   'text-on-surface',
  RUNNING: 'text-green-400',
  SUCCESS: 'text-green-400',
}

const adaptEntries = (entries) =>
  entries.map(e => ({
    time:  formatTimeHHMMSS(new Date(e.timestamp)),
    type:  e.level,
    msg:   e.message,
    color: LEVEL_COLOR_MAP[e.level] ?? 'text-on-surface',
  }))

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AuditLog
 *
 * Props
 * -----
 * auditLog : AuditLogEntry[]         — from useSystemHealth() (initial 50 entries)
 * liveData : SystemLiveUpdate | null — from useSystemHealthWebSocket()
 *            Not used directly for log lines (WS pushes EPS / alerts, not
 *            full log entries). Kept as prop for future expansion when the
 *            WS backend starts pushing audit entries directly.
 *
 * Data flow
 * ---------
 * 1. Seed  : auditLog[] seeds the terminal with real DB entries on mount.
 * 2. Live  : setInterval appends a rotating phrase every AUDIT_LOG_INTERVAL_MS
 *            so the terminal keeps scrolling between REST refreshes.
 * 3. Scroll: auto-scrolls to the latest entry whenever logs change.
 */
const AuditLog = ({ auditLog = [], liveData = null }) => {
  const [logs,     setLogs]     = useState(AUDIT_INITIAL_LOGS)
  const consoleRef              = useRef(null)

  // Seed from REST response on first load
  useEffect(() => {
    if (!auditLog.length) return
    const adapted = adaptEntries(auditLog)
    setLogs(adapted.slice(-AUDIT_LOG_MAX_LINES))
  }, [auditLog])

  // Live: append a rotating phrase every interval
  useEffect(() => {
    const id = setInterval(() => {
      const phrase = randomAuditPhrase(AUDIT_LOG_PHRASES)
      setLogs(prev => appendLogEntry(prev, phrase, AUDIT_LOG_MAX_LINES))
    }, AUDIT_LOG_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  // Auto-scroll to bottom on every log update
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="glass-card rounded-xl overflow-hidden terminal-glow border-l-4 border-l-primary">
      {/* Terminal chrome bar */}
      <div className="px-4 py-2 bg-surface-container-high flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-error/40"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-tertiary/40"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-primary/40"></div>
        </div>
        <span className="text-[10px] font-label-md uppercase tracking-widest text-on-surface-variant font-mono">
          Live Audit Log — system.health.analytics
        </span>
        <span className="material-symbols-outlined text-sm text-on-surface-variant">terminal</span>
      </div>

      {/* Log body */}
      <div
        ref={consoleRef}
        className="bg-[#050507] p-4 font-label-md text-[12px] leading-relaxed text-primary/80 h-48 overflow-y-auto custom-scrollbar font-mono"
      >
        {logs.map((log, idx) => (
          <p key={idx}>
            <span className="text-on-surface-variant">[{log.time}]</span>{' '}
            <span className={log.color}>{log.type}:</span>{' '}
            <span className="text-on-surface">{log.msg}</span>
          </p>
        ))}
        <div className="flex items-center gap-1 font-mono">
          <span className="text-on-surface-variant">[{formatTimeHHMMSS()}]</span>
          <span className="text-primary font-bold">RUNNING:</span>
          <span>Monitoring sub-processes</span>
          <span className="terminal-cursor"></span>
        </div>
      </div>
    </div>
  )
}

export default AuditLog
