import { useEffect, useRef } from 'react'

export default function TerminalLogs({ terminalLogs }) {
  const terminalEndRef = useRef(null)

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight
    }
  }, [terminalLogs])

  return (
    <div className="lg:col-span-6 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col h-[320px] relative group">
      <div className="px-6 py-3 bg-surface-container flex items-center justify-between border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg animate-pulse">terminal</span>
          <h3 className="font-label-md text-label-md text-on-surface">PIPELINE_MONITOR :: v2.4.0</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-green-400 font-mono font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
            ACTIVE INGESTION
          </span>
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-error"></span>
            <span className="w-2 h-2 rounded-full bg-[#ffb783]"></span>
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
          </div>
        </div>
      </div>

      <div
        ref={terminalEndRef}
        className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-on-surface-variant overflow-y-auto terminal-scroll space-y-1"
        style={{ background: '#050507' }}
      >
        {terminalLogs.map((log, i) => (
          <div key={i} className="flex gap-2 font-mono hover:bg-surface-container-low/20 py-0.5 px-1 rounded transition-colors">
            <span className="text-primary font-semibold select-none">[{log.time}]</span>
            <span className={`font-extrabold ${log.color} select-none`}>{log.module}:</span>
            <span className="text-on-surface font-medium">{log.msg}</span>
          </div>
        ))}
        <div className="flex items-center space-x-1 py-1">
          <span className="text-primary select-none">[{new Date().toLocaleTimeString('en-GB', { hour12: false })}]</span>
          <span className="text-on-surface font-bold">KAFKA Ingestor polling...</span>
          <span className="w-1.5 h-3 bg-primary animate-pulse inline-block"></span>
        </div>
      </div>
    </div>
  )
}
