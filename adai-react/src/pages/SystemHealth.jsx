import { useState, useEffect, useRef } from 'react'

export default function SystemHealth() {
  const [logs, setLogs] = useState([
    { time: '14:02:11', type: 'WARN', msg: 'ML node inference latency spiked to 410ms on shard 4A', color: 'text-tertiary' },
    { time: '14:02:15', type: 'INFO', msg: 'Auto-scaling policy triggered. Provisioning 2 additional compute units.', color: 'text-primary' },
    { time: '14:02:45', type: 'SUCCESS', msg: "Audience segment 'Pro Gamers' cache refreshed in 144ms.", color: 'text-green-400' },
    { time: '14:03:02', type: 'INFO', msg: 'System health check passed. Heartbeat acknowledged from all zones.', color: 'text-primary' },
    { time: '14:03:12', type: 'TRACE', msg: 'User session ID 8x-912 authenticated via OAuth2...', color: 'text-on-surface' },
  ])
  const consoleRef = useRef(null)

  const phrases = [
    { type: 'INFO', msg: 'DB Connection pool scaled up to 45 connections.', color: 'text-primary' },
    { type: 'SUCCESS', msg: 'Aggregated analytics sync complete in 21ms.', color: 'text-green-400' },
    { type: 'WARN', msg: 'Higher memory overhead on worker 1C. Garbage collection scheduled.', color: 'text-tertiary' },
    { type: 'INFO', msg: 'Re-balancing Kafka partitions for group adai-events.', color: 'text-primary' },
    { type: 'TRACE', msg: 'Event listener buffer flushed: 0 events remaining.', color: 'text-on-surface' }
  ]

  useEffect(() => {
    const id = setInterval(() => {
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false })
      const phrase = phrases[Math.floor(Math.random() * phrases.length)]
      setLogs(prev => {
        const next = [...prev, { time, ...phrase }]
        return next.length > 15 ? next.slice(next.length - 15) : next
      })
    }, 4500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="space-y-stack-lg">
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-on-surface-variant font-body-md">Infrastructure performance and AI node health.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant">
            <span className="w-2 h-2 rounded-full bg-green-400 status-pulse"></span>
            <span className="font-label-md text-xs uppercase text-green-400 font-mono">All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container-highest rounded">
              <span className="material-symbols-outlined text-primary">api</span>
            </div>
            <span className="text-[10px] font-label-md text-green-400 uppercase tracking-tighter font-mono font-bold">Healthy</span>
          </div>
          <p className="font-bold text-on-surface">Core API</p>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-on-surface-variant">Uptime</span>
            <span className="text-xs font-label-md font-mono">99.998%</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container-highest rounded">
              <span className="material-symbols-outlined text-primary">lan</span>
            </div>
            <span className="text-[10px] font-label-md text-green-400 uppercase tracking-tighter font-mono font-bold">Healthy</span>
          </div>
          <p className="font-bold text-on-surface">Kafka Cluster</p>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-on-surface-variant">Lag</span>
            <span className="text-xs font-label-md font-mono">12ms</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container-highest rounded">
              <span className="material-symbols-outlined text-primary">database</span>
            </div>
            <span className="text-[10px] font-label-md text-green-400 uppercase tracking-tighter font-mono font-bold">Healthy</span>
          </div>
          <p className="font-bold text-on-surface">Redis Cache</p>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-on-surface-variant">Hit Rate</span>
            <span className="text-xs font-label-md font-mono">94.2%</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border-l-4 border-l-tertiary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container-highest rounded">
              <span className="material-symbols-outlined text-tertiary">neurology</span>
            </div>
            <span className="text-[10px] font-label-md text-tertiary uppercase tracking-tighter font-mono font-bold">High Load</span>
          </div>
          <p className="font-bold text-on-surface">ML Inference</p>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-on-surface-variant">Latency</span>
            <span className="text-xs font-label-md font-mono text-tertiary">340ms</span>
          </div>
        </div>
      </div>

      {/* Performance Bento */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Response Time Chart */}
        <div className="col-span-12 lg:col-span-7 glass-card rounded-xl p-6 min-h-[300px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-title-lg text-title-lg">Global Latency (P99)</h3>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-surface-container-highest rounded text-[10px] font-label-md font-mono">EU-CENTRAL-1</span>
              <span className="px-2 py-1 bg-surface-container-highest rounded text-[10px] font-label-md font-mono">US-EAST-1</span>
            </div>
          </div>
          <div className="flex-1 w-full relative group min-h-[160px]">
            {/* Chart Mockup */}
            <div className="absolute inset-0 flex items-end gap-1 px-2 pb-6">
              {[40, 35, 45, 38, 60, 42, 50, 35, 48, 40, 25, 30, 55, 70, 35].map((h, idx) => (
                <div key={idx} className="flex-1 bg-primary/20 rounded-t-sm border-t border-primary/40 relative group/bar" style={{ height: `${h}%` }}>
                  <div className="absolute inset-0 bg-primary opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
                </div>
              ))}
            </div>
            {/* Axis Labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between pt-2 border-t border-outline-variant text-[10px] text-on-surface-variant font-label-md font-mono">
              <span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>00:00</span>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-gutter">
          <div className="glass-card rounded-xl p-6 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-title-lg text-title-lg">CPU Utilization</h3>
              <span className="font-label-md text-primary font-mono text-xs font-bold">64.8%</span>
            </div>
            <div className="grid grid-cols-8 gap-2 h-16 items-end">
              {[60, 45, 75, 90, 55, 65, 40, 70].map((h, idx) => {
                const color = h > 80 ? 'bg-tertiary' : 'bg-primary/80'
                return (
                  <div key={idx} className={`${color} rounded`} style={{ height: `${h}%` }}></div>
                )
              })}
            </div>
            <p className="mt-4 text-xs text-on-surface-variant">Averaged across 24 nodes. Peak observed on node-ai-04.</p>
          </div>

          <div className="glass-card rounded-xl p-6 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-title-lg text-title-lg">Memory Pressure</h3>
              <span className="font-label-md text-tertiary font-mono text-xs font-bold">82.1%</span>
            </div>
            <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden flex">
              <div className="bg-primary h-full border-r border-background" style={{ width: '60%' }}></div>
              <div className="bg-tertiary h-full border-r border-background" style={{ width: '22%' }}></div>
              <div className="bg-surface-variant h-full" style={{ width: '18%' }}></div>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-primary"></div><span className="text-[10px] font-label-md uppercase font-mono">Application</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-tertiary"></div><span className="text-[10px] font-label-md uppercase font-mono">Cache</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-surface-variant"></div><span className="text-[10px] font-label-md uppercase font-mono">Free</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Logs */}
      <div className="glass-card rounded-xl overflow-hidden terminal-glow border-l-4 border-l-primary">
        <div className="px-4 py-2 bg-surface-container-high flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-error/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-primary/40"></div>
          </div>
          <span className="text-[10px] font-label-md uppercase tracking-widest text-on-surface-variant font-mono">Live Audit Log — system.health.analytics</span>
          <span className="material-symbols-outlined text-sm text-on-surface-variant">terminal</span>
        </div>
        <div ref={consoleRef} className="bg-[#050507] p-4 font-label-md text-[12px] leading-relaxed text-primary/80 h-48 overflow-y-auto custom-scrollbar font-mono">
          {logs.map((log, idx) => (
            <p key={idx}>
              <span className="text-on-surface-variant">[{log.time}]</span>{' '}
              <span className={log.color}>{log.type}:</span>{' '}
              <span className="text-on-surface">{log.msg}</span>
            </p>
          ))}
          <div className="flex items-center gap-1 font-mono">
            <span className="text-on-surface-variant">[{new Date().toLocaleTimeString('en-GB', { hour12: false })}]</span>
            <span className="text-primary font-bold">RUNNING:</span>
            <span>Monitoring sub-processes</span>
            <span className="terminal-cursor"></span>
          </div>
        </div>
      </div>

      {/* Visual Background Glow */}
      <div className="fixed top-0 left-60 w-full h-full pointer-events-none -z-10 opacity-20">
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-primary/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] bg-tertiary/20 rounded-full blur-[100px]"></div>
      </div>
    </div>
  )
}
