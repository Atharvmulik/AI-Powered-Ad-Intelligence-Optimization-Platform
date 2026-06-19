import { useState, useEffect, useRef, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'

export default function SystemHealth() {
  const [logs, setLogs] = useState([
    { time: '14:02:11', type: 'WARN', msg: 'ML node inference latency spiked to 410ms on shard 4A', color: 'text-tertiary' },
    { time: '14:02:15', type: 'INFO', msg: 'Auto-scaling policy triggered. Provisioning 2 additional compute units.', color: 'text-primary' },
    { time: '14:02:45', type: 'SUCCESS', msg: "Audience segment 'Pro Gamers' cache refreshed in 144ms.", color: 'text-green-400' },
    { time: '14:03:02', type: 'INFO', msg: 'System health check passed. Heartbeat acknowledged from all zones.', color: 'text-primary' },
    { time: '14:03:12', type: 'TRACE', msg: 'User session ID 8x-912 authenticated via OAuth2...', color: 'text-on-surface' },
  ])
  const consoleRef = useRef(null)

  // Expanded phrases including PRD fraud & ML retraining logs
  const phrases = useMemo(() => [
    { type: 'INFO', msg: 'DB Connection pool scaled up to 45 connections.', color: 'text-primary' },
    { type: 'SUCCESS', msg: 'Aggregated analytics sync complete in 21ms.', color: 'text-green-400' },
    { type: 'WARN', msg: 'Higher memory overhead on worker 1C. Garbage collection scheduled.', color: 'text-tertiary' },
    { type: 'INFO', msg: 'Re-balancing Kafka partitions for group adai-events.', color: 'text-primary' },
    { type: 'TRACE', msg: 'Event listener buffer flushed: 0 events remaining.', color: 'text-on-surface' },
    { type: 'WARN', msg: 'Fraud detection model recall dropped to 82%. Retraining scheduled.', color: 'text-tertiary' },
    { type: 'SUCCESS', msg: 'XGBoost CTR model retrained. AUC-ROC: 0.791 on held-out test set.', color: 'text-green-400' },
    { type: 'INFO', msg: 'Kafka topic fraud-flags consumer lag: 3ms. Within threshold.', color: 'text-primary' },
    { type: 'WARN', msg: 'SHAP explanation latency at 48ms. Approaching 50ms SLA limit.', color: 'text-tertiary' },
    { type: 'INFO', msg: 'ML model version v2.4.1 promoted to production via MLflow registry.', color: 'text-primary' }
  ], [])

  // Chart data state (EU and US latency time series)
  // Lazy initializer for useState — runs once, not during re-renders
  const [chartData, setChartData] = useState(() => {
    const data = []
    let baseTime = new Date()
    baseTime.setHours(8, 0, 0, 0)
    for (let i = 0; i < 15; i++) {
      const time = new Date(baseTime.getTime() + i * 60 * 60 * 1000)
      data.push({
        time: time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        eu: Math.floor(Math.random() * (140 - 40 + 1) + 40),
        us: Math.floor(Math.random() * (180 - 60 + 1) + 60)
      })
    }
    return data
  })

  // Auto-update chart every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        const newTime = new Date()
        const newTimeStr = newTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        const newEu = Math.floor(Math.random() * (140 - 40 + 1) + 40)
        const newUs = Math.floor(Math.random() * (180 - 60 + 1) + 60)
        const newData = [...prev.slice(1), { time: newTimeStr, eu: newEu, us: newUs }]
        return newData
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Kafka throughput state
  const [kafkaThroughput, setKafkaThroughput] = useState(12847)

  // Sparkline data for Kafka throughput (8 bars)
  const [sparklineData, setSparklineData] = useState([11200, 11800, 12500, 13100, 12800, 13500, 12900, 12847])

  // Auto-update Kafka throughput every 3 seconds and update sparkline inline
  useEffect(() => {
    const interval = setInterval(() => {
      setKafkaThroughput(prev => {
        const variation = Math.floor(Math.random() * 1000) - 500
        let newVal = prev + variation
        newVal = Math.min(14500, Math.max(10000, newVal))
        // Update sparkline inline to avoid cascading setState in a separate effect
        setSparklineData(s => [...s.slice(1), newVal])
        return newVal
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Memory pressure values in GB
  const appGB = 38.4
  const cacheGB = 14.1
  const freeGB = 11.5
  const totalRAM = 64
  const memoryPercent = ((appGB + cacheGB) / totalRAM) * 100
  const memoryPercentRounded = Math.round(memoryPercent * 10) / 10

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
  }, [phrases])

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

      {/* SLA Summary Row */}
      <div className="flex flex-wrap gap-4 items-center mb-6 pb-2 border-b border-outline-variant">
        <div className="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-full">
          <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
          <span className="text-xs font-mono font-bold">Bid Response &lt; 100ms</span>
          <span className="text-green-400 font-mono font-bold">74ms</span>
        </div>
        <div className="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-full">
          <span className="material-symbols-outlined text-error text-sm">warning</span>
          <span className="text-xs font-mono font-bold">ML Inference &lt; 30ms</span>
          <span className="text-error font-mono font-bold">340ms</span>
        </div>
        <div className="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-full">
          <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
          <span className="text-xs font-mono font-bold">Dashboard Lag &lt; 3s</span>
          <span className="text-green-400 font-mono font-bold">1.2s</span>
        </div>
      </div>

      {/* Service Status Grid - updated to 6 cards with responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-gutter">
        {/* Core API Card */}
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container-highest rounded">
              <span className="material-symbols-outlined text-primary">api</span>
            </div>
            <span className="text-[10px] font-label-md text-green-400 uppercase tracking-tighter font-mono font-bold">Healthy</span>
          </div>
          <p className="font-bold text-on-surface">Core API</p>
          <div className="flex flex-col mt-2">
            <div className="flex justify-between">
              <span className="text-xs text-on-surface-variant">Uptime</span>
              <span className="text-xs font-label-md font-mono">99.998%</span>
            </div>
            <span className="text-[10px] text-green-400 mt-1 flex items-center gap-1">✓ Above SLA</span>
          </div>
        </div>

        {/* Kafka Cluster Card */}
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

        {/* Redis Cache Card */}
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

        {/* ML Inference Card - Updated with SLA breach alert */}
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-error">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container-highest rounded">
              <span className="material-symbols-outlined text-error">neurology</span>
            </div>
            <span className="text-[10px] font-label-md text-error uppercase tracking-tighter font-mono font-bold">SLA Breach</span>
          </div>
          <p className="font-bold text-on-surface">ML Inference</p>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-on-surface-variant">Latency</span>
            <span className="text-xs font-label-md font-mono text-error">340ms</span>
          </div>
          <div className="mt-2 text-[10px] bg-error/10 text-error p-1 rounded flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">warning</span> ⚠ SLA BREACH: 340ms exceeds the 30ms inference target
          </div>
        </div>

        {/* Fraud Detection Card (new) */}
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container-highest rounded">
              <span className="material-symbols-outlined text-primary">security</span>
            </div>
            <span className="text-[10px] font-label-md text-green-400 uppercase tracking-tighter font-mono font-bold">Healthy</span>
          </div>
          <p className="font-bold text-on-surface">Fraud Detection</p>
          <div className="flex flex-col mt-2">
            <div className="flex justify-between">
              <span className="text-xs text-on-surface-variant">Uptime</span>
              <span className="text-xs font-label-md font-mono">99.7%</span>
            </div>
            <span className="text-[10px] text-green-400 mt-1 flex items-center gap-1">✓ Above SLA (99.5%)</span>
          </div>
        </div>

        {/* PostgreSQL Card (new) */}
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container-highest rounded">
              <span className="material-symbols-outlined text-primary">storage</span>
            </div>
            <span className="text-[10px] font-label-md text-green-400 uppercase tracking-tighter font-mono font-bold">Healthy</span>
          </div>
          <p className="font-bold text-on-surface">PostgreSQL</p>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-on-surface-variant">Query Time</span>
            <span className="text-xs font-label-md font-mono">8ms</span>
          </div>
        </div>
      </div>

      {/* Performance Bento */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Response Time Chart - Live with Recharts */}
        <div className="col-span-12 lg:col-span-7 glass-card rounded-xl p-6 min-h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-title-lg text-title-lg">Global Latency (P99)</h3>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-surface-container-highest rounded text-[10px] font-label-md font-mono">EU-CENTRAL-1</span>
              <span className="px-2 py-1 bg-surface-container-highest rounded text-[10px] font-label-md font-mono">US-EAST-1</span>
            </div>
          </div>
          <div className="flex-1 w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" />
                <XAxis dataKey="time" stroke="#9e9e9e" fontSize={10} tickMargin={8} />
                <YAxis stroke="#9e9e9e" fontSize={10} domain={[0, 200]} label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fill: '#9e9e9e', fontSize: 10 } }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "SLA Limit (100ms)", fill: "#ef4444", fontSize: 9, position: 'right' }} />
                <Line type="monotone" dataKey="eu" stroke="#3b82f6" strokeWidth={2} dot={false} name="EU-CENTRAL-1" />
                <Line type="monotone" dataKey="us" stroke="#a855f7" strokeWidth={2} dot={false} name="US-EAST-1" />
              </LineChart>
            </ResponsiveContainer>
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

          {/* Memory Pressure - Updated with tooltip/legend and dynamic color */}
          <div className="glass-card rounded-xl p-6 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-title-lg text-title-lg">Memory Pressure</h3>
              <span className={`font-label-md font-mono text-xs font-bold ${memoryPercentRounded > 80 ? 'text-error' : 'text-primary'}`}>
                {memoryPercentRounded}%
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden flex">
              <div className="bg-primary h-full border-r border-background" style={{ width: `${(appGB / totalRAM) * 100}%` }}></div>
              <div className="bg-tertiary h-full border-r border-background" style={{ width: `${(cacheGB / totalRAM) * 100}%` }}></div>
              <div className="bg-surface-variant h-full" style={{ width: `${(freeGB / totalRAM) * 100}%` }}></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-[10px]">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-primary"></div><span className="font-label-md uppercase font-mono">Application: {appGB} GB</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-tertiary"></div><span className="font-label-md uppercase font-mono">Cache: {cacheGB} GB</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-surface-variant"></div><span className="font-label-md uppercase font-mono">Free: {freeGB} GB</span></div>
              <div className="text-on-surface-variant ml-auto font-mono">Total: {totalRAM} GB</div>
            </div>
          </div>
        </div>
      </div>

      {/* Kafka Throughput Metric Section (new) */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-title-lg text-title-lg mb-1">Kafka Event Throughput</h3>
            <p className="text-xs text-on-surface-variant">Dev target &gt; 10,000 events/sec</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-3xl font-mono font-bold text-primary">{kafkaThroughput.toLocaleString()} <span className="text-sm text-on-surface-variant">events/sec</span></div>
            <span className="text-[10px] bg-green-400/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">✓ Above 10K dev target</span>
          </div>
        </div>
        <div className="mt-6 flex items-end gap-1 h-12">
          {sparklineData.map((val, idx) => {
            const height = (val / 15000) * 100
            return (
              <div key={idx} className="flex-1 bg-primary/40 rounded-t-sm hover:bg-primary transition-all" style={{ height: `${height}%` }}></div>
            )
          })}
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