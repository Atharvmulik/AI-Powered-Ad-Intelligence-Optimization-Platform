// ============================================================
// src/components/adManagement/AnalysisTerminal.jsx
// ============================================================

import { forwardRef } from 'react'

const AnalysisTerminal = forwardRef(function AnalysisTerminal({ logs }, ref) {
  return (
    <section className="glass-card rounded-xl overflow-hidden bg-[#050507] border-l-4 border-l-primary">
      <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          <span className="ml-4 font-label-md text-on-surface-variant opacity-75 uppercase tracking-widest text-[10px]">
            Real-Time AI Analysis Log
          </span>
        </div>
        <span className="text-[10px] font-label-md text-primary status-pulse">SYSTEM ONLINE</span>
      </div>
      <div ref={ref} className="p-6 h-36 overflow-y-auto font-label-md text-primary text-[12px] space-y-1 font-mono">
        {logs.map((log, index) => (
          <p key={index}>
            <span className="opacity-40">[{log.time}]</span>{' '}
            <span className="text-on-surface">{log.type}</span>{' '}
            {log.msg}{' '}
            {log.status && <span className={log.statusColor}>{log.status}</span>}
          </p>
        ))}
        <div className="flex items-center space-x-1">
          <span className="opacity-40">[{new Date().toLocaleTimeString('en-GB', { hour12: false })}]</span>
          <span className="text-on-surface">LISTENING</span>
          <span className="terminal-cursor"></span>
        </div>
      </div>
    </section>
  )
})

export default AnalysisTerminal
