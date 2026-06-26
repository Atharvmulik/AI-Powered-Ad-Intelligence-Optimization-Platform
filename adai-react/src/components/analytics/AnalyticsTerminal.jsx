// src/components/analytics/AnalyticsTerminal.jsx
// Live terminal log console with auto-scroll and blinking cursor.
// Owns logs state and generation interval.

import { useState, useEffect, useRef } from 'react'
import { TERMINAL_SEED_LOGS, TERMINAL_PHRASES } from '@/data/analyticsData'

const LOG_COLORS = {
  sys:     'text-primary opacity-80',
  info:    'text-on-surface',
  insight: 'text-tertiary font-bold',
  alert:   'text-yellow-400',
  fraud:   'text-red-400',
  default: 'text-on-surface-variant',
}

function getLogColor(log) {
  if (log.type === 'sys')     return LOG_COLORS.sys
  if (log.type === 'insight') return LOG_COLORS.insight
  if (log.type === 'alert')   return LOG_COLORS.alert
  if (log.type === 'fraud')   return LOG_COLORS.fraud
  if (log.type === 'info' && !log.status) return LOG_COLORS.info
  return LOG_COLORS.default
}

export default function AnalyticsTerminal() {
  const [logs, setLogs]   = useState(TERMINAL_SEED_LOGS)
  const terminalRef       = useRef(null)

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight
  }, [logs])

  // Append a random log phrase every 5 seconds
  useEffect(() => {
    const id = setInterval(() => {
      const time   = new Date().toLocaleTimeString('en-GB', { hour12: false })
      const phrase = TERMINAL_PHRASES[Math.floor(Math.random() * TERMINAL_PHRASES.length)]
      setLogs(prev => {
        const next = [...prev, { time, msg: phrase.msg, type: phrase.type }]
        return next.length > 12 ? next.slice(next.length - 12) : next
      })
    }, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-[#050507] border border-outline-variant rounded-xl p-4 font-label-md text-label-md relative group">
      {/* Traffic-light dots + label */}
      <div className="flex items-center gap-2 mb-3 border-b border-outline-variant/30 pb-2">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-error" />
          <div className="w-2 h-2 rounded-full bg-tertiary" />
          <div className="w-2 h-2 rounded-full bg-primary-container" />
        </div>
        <span className="text-on-surface-variant ml-2 opacity-60">Real-time AI Analysis Log</span>
      </div>

      {/* Log lines */}
      <div ref={terminalRef} className="space-y-1 h-40 overflow-y-auto pr-4 font-mono text-[12px]">
        {logs.map((log, idx) => (
          <p key={idx} className={getLogColor(log)}>
            <span className="opacity-40">[{log.time}]</span>{' '}
            {log.msg}{' '}
            {log.status && <span className="text-primary font-bold">{log.status}</span>}
          </p>
        ))}
        {/* Blinking cursor row */}
        <div className="flex items-center space-x-1">
          <span className="opacity-40">
            [{new Date().toLocaleTimeString('en-GB', { hour12: false })}]
          </span>
          <span className="text-on-surface">Awaiting user interaction...</span>
          <span className="terminal-cursor" />
        </div>
      </div>
    </div>
  )
}