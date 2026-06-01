import { useState, useEffect, useRef } from 'react'

export default function RealTimeEvents() {
  const [isPaused, setIsPaused] = useState(false)
  const [eventsPerSec, setEventsPerSec] = useState(847)
  const [totalEvents, setTotalEvents] = useState(72.4) // in Millions
  const [kafkaLatency, setKafkaLatency] = useState(12) // in ms

  const [logs, setLogs] = useState([
    { time: '14:02:21', label: 'CLICK', msg: 'evt_88921_clnk | campaign_id: AD_990 | score: 0.98', color: 'text-primary', msgColor: 'text-on-surface' },
    { time: '14:02:22', label: 'FRAUD', msg: 'SUSPICIOUS_IP | src: 192.168.1.1 | bot_sig: detected | blocking...', color: 'text-error', msgColor: 'text-error' },
    { time: '14:02:22', label: 'PRED', msg: 'conversion_likely | target_cpa: $2.40 | bid_adjust: +15%', color: 'text-tertiary', msgColor: 'text-tertiary' },
    { time: '14:02:23', label: 'CLICK', msg: 'evt_88924_clnk | campaign_id: AD_102 | score: 0.92', color: 'text-primary', msgColor: 'text-on-surface' },
    { time: '14:02:23', label: 'CLICK', msg: 'evt_88925_clnk | campaign_id: AD_884 | score: 0.99', color: 'text-primary', msgColor: 'text-on-surface' },
  ])
  
  const terminalEndRef = useRef(null)

  const eventTypes = [
    { label: 'CLICK', color: 'text-primary', msgColor: 'text-on-surface', pattern: 'evt_{}_clnk | campaign_id: AD_{} | score: {}' },
    { label: 'FRAUD', color: 'text-error', msgColor: 'text-error', pattern: 'BLOCKED | reason: high_velocity | ip: 45.2.{}.{}' },
    { label: 'PRED', color: 'text-tertiary', msgColor: 'text-tertiary', pattern: 'MODEL_HIT | p_conv: {} | recommended_bid: ${}' }
  ]

  // Simulate real-time stats fluctuations
  useEffect(() => {
    const statsTimer = setInterval(() => {
      if (isPaused) return
      setEventsPerSec(prev => {
        const diff = Math.floor((Math.random() - 0.5) * 20)
        return Math.max(780, Math.min(920, prev + diff))
      })
      setKafkaLatency(prev => {
        const diff = Math.floor((Math.random() - 0.5) * 4)
        return Math.max(9, Math.min(18, prev + diff))
      })
      setTotalEvents(prev => +(prev + 0.001).toFixed(3))
    }, 3000)
    return () => clearInterval(statsTimer)
  }, [isPaused])

  // Simulate log streams
  useEffect(() => {
    const logTimer = setInterval(() => {
      if (isPaused) return
      const now = new Date()
      const time = now.toLocaleTimeString('en-GB', { hour12: false })
      const event = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      
      let msg = event.pattern
      if (event.label === 'CLICK') {
        msg = msg.replace('{}', Math.floor(Math.random() * 90000 + 10000))
                 .replace('{}', Math.floor(Math.random() * 900 + 100))
                 .replace('{}', (Math.random() * 0.2 + 0.8).toFixed(2))
      } else if (event.label === 'FRAUD') {
        msg = msg.replace('{}', Math.floor(Math.random() * 255))
                 .replace('{}', Math.floor(Math.random() * 255))
      } else {
        msg = msg.replace('{}', Math.random().toFixed(3))
                 .replace('{}', (Math.random() * 4 + 0.5).toFixed(2))
      }

      setLogs(prev => {
        const next = [...prev, { time, label: event.label, msg, color: event.color, msgColor: event.msgColor }]
        return next.length > 25 ? next.slice(next.length - 25) : next
      })
    }, 1500)
    return () => clearInterval(logTimer)
  }, [isPaused])

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight
    }
  }, [logs])

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `adai_event_logs_${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-stack-lg">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-stack-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center px-3 py-1 bg-tertiary-container/20 border border-tertiary rounded-full pulse-live select-none">
            <span className="w-2 h-2 rounded-full bg-tertiary mr-2"></span>
            <span className="text-tertiary font-label-md text-label-md font-bold uppercase tracking-widest">LIVE</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-surface-container-high border border-outline-variant rounded-lg font-label-md text-label-md flex items-center hover:bg-surface-bright transition-colors text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">download</span> Export Logs
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center shadow-lg shadow-primary/20 text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[18px] mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPaused ? 'play_arrow' : 'pause'}
            </span>
            {isPaused ? 'Resume Stream' : 'Pause Stream'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-surface-container-low border border-outline-variant p-5 rounded-xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-on-surface-variant font-label-md text-label-md uppercase">Events / Second</span>
            <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="text-display-lg font-black font-mono tracking-tighter leading-none">{eventsPerSec}</span>
            <span className="text-tertiary font-label-md text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-[16px] mr-0.5">trending_up</span> +12%
            </span>
          </div>
          <div className="w-full h-1 bg-surface-container-highest mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '72%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant p-5 rounded-xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-on-surface-variant font-label-md text-label-md uppercase">Total Events (Today)</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">data_thresholding</span>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="text-display-lg font-black font-mono tracking-tighter leading-none">{totalEvents}M</span>
            <span className="text-on-surface-variant font-label-md text-xs">Target: 100M</span>
          </div>
          <div className="w-full h-1 bg-surface-container-highest mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-secondary" style={{ width: '65%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant p-5 rounded-xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-on-surface-variant font-label-md text-label-md uppercase">Kafka Latency</span>
            <span className="material-symbols-outlined text-tertiary text-[20px]">timer</span>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="text-display-lg font-black font-mono tracking-tighter leading-none">
              {kafkaLatency}<small className="text-sm font-normal">ms</small>
            </span>
            <span className="text-error font-label-md text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-[16px] mr-0.5">warning</span> High Load
            </span>
          </div>
          <div className="w-full h-1 bg-surface-container-highest mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-tertiary" style={{ width: '88%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Terminal Console */}
        <div className="col-span-12 lg:col-span-8 flex flex-col">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col h-[500px] relative shadow-2xl">
            {/* Scanline effect */}
            <div className="scanline"></div>
            {/* Terminal Header */}
            <div className="bg-surface-container-highest px-4 py-2 flex items-center justify-between border-b border-outline-variant">
              <div className="flex space-x-2 items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-error"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-tertiary"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-secondary text-secondary-container"></div>
                <span className="ml-4 font-label-md text-label-md text-on-surface-variant font-mono">stream_processor::kafka_main_ingress</span>
              </div>
              <div className="flex space-x-4 font-label-md text-label-md text-on-surface-variant font-mono">
                <span>SHARD_04</span>
                <span className="text-tertiary">UP_TIME: 14:23:44</span>
              </div>
            </div>
            {/* Terminal Body */}
            <div ref={terminalEndRef} className="flex-grow p-4 font-mono text-label-md overflow-y-auto terminal-scroll bg-[#050507] text-[12px] space-y-1">
              <div className="text-on-surface-variant opacity-50 mb-2 border-b border-outline-variant pb-2 font-mono">
                --- INITIALIZING AI STREAM ANALYSIS PARSER v2.4 ---
              </div>
              {logs.map((log, idx) => (
                <div key={idx} className="flex space-x-4 font-mono">
                  <span className="text-on-surface-variant opacity-40">[{log.time}]</span>
                  <span className={`${log.color} font-bold`}>{log.label}</span>
                  <span className={log.msgColor}>{log.msg}</span>
                </div>
              ))}
              {!isPaused && (
                <div className="flex space-x-4 animate-pulse font-mono">
                  <span className="text-on-surface-variant opacity-40">[{new Date().toLocaleTimeString('en-GB', { hour12: false })}]</span>
                  <span className="text-primary font-bold">STREAM</span>
                  <span className="text-on-surface italic">Waiting for incoming packets...</span>
                  <span className="terminal-cursor"></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Charts */}
        <div className="col-span-12 lg:col-span-4 space-y-gutter flex flex-col justify-between">
          {/* Distribution Card */}
          <div className="bg-surface-container-low border border-outline-variant p-5 rounded-xl h-[240px] flex flex-col justify-between">
            <h3 className="font-title-lg text-title-lg mb-4 flex justify-between items-center">
              Event Distribution
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">pie_chart</span>
            </h3>
            <div className="flex-grow flex items-end justify-between space-x-2 px-2 pb-2">
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-primary/20 rounded-t-sm relative transition-all group-hover:bg-primary/40 h-[80px]">
                  <div className="absolute bottom-0 w-full bg-primary h-[60px] rounded-t-sm shadow-[0_0_15px_rgba(192,193,255,0.4)]"></div>
                </div>
                <span className="font-label-md text-[10px] mt-2 text-primary font-bold">Clicks</span>
              </div>
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-error/20 rounded-t-sm relative transition-all group-hover:bg-error/40 h-[80px]">
                  <div className="absolute bottom-0 w-full bg-error h-[15px] rounded-t-sm"></div>
                </div>
                <span className="font-label-md text-[10px] mt-2 text-error font-bold">Fraud</span>
              </div>
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-tertiary/20 rounded-t-sm relative transition-all group-hover:bg-tertiary/40 h-[80px]">
                  <div className="absolute bottom-0 w-full bg-tertiary h-[25px] rounded-t-sm"></div>
                </div>
                <span className="font-label-md text-[10px] mt-2 text-tertiary font-bold">Preds</span>
              </div>
            </div>
          </div>

          {/* Latency Chart Card */}
          <div className="bg-surface-container-low border border-outline-variant p-5 rounded-xl h-[240px] flex flex-col justify-between overflow-hidden">
            <h3 className="font-title-lg text-title-lg mb-4 flex justify-between items-center">
              Latencies (60s)
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">show_chart</span>
            </h3>
            <div className="flex-grow relative flex items-end">
              <svg className="w-full h-32" preserveAspectRatio="none" viewBox="0 0 400 100">
                <defs>
                  <linearGradient id="latencyGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#c0c1ff" stopOpacity="0.2"></stop>
                    <stop offset="100%" stopColor="#c0c1ff" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path d="M0,80 L40,82 L80,75 L120,88 L160,70 L200,60 L240,65 L280,50 L320,55 L360,40 L400,45 V100 H0 Z" fill="url(#latencyGradient)"></path>
                <path d="M0,80 L40,82 L80,75 L120,88 L160,70 L200,60 L240,65 L280,50 L320,55 L360,40 L400,45" fill="none" stroke="#c0c1ff" strokeWidth="2"></path>
                <circle className="status-pulse" cx="280" cy="50" fill="#c0c1ff" r="4"></circle>
              </svg>
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant/30"></div>
              <div className="absolute top-1/4 left-0 w-full h-[1px] bg-outline-variant/30"></div>
              <div className="absolute top-3/4 left-0 w-full h-[1px] bg-outline-variant/30"></div>
            </div>
            <div className="flex justify-between mt-2 font-label-md text-[10px] text-on-surface-variant font-mono">
              <span>-60s</span>
              <span>-30s</span>
              <span>0s</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Logs / Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex items-center space-x-6">
          <div className="h-16 w-16 rounded-full bg-primary-container/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <span className="material-symbols-outlined text-[32px]">hub</span>
          </div>
          <div>
            <h4 className="font-title-lg text-title-lg text-on-surface">Nodes Active</h4>
            <p className="text-sm text-on-surface-variant">14/14 healthy clusters processing in US-EAST-1</p>
          </div>
        </div>
        <div className="bg-surface-container border border-outline-variant rounded-xl p-5 flex items-center space-x-6">
          <div className="h-16 w-16 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary border border-tertiary/20 shrink-0">
            <span className="material-symbols-outlined text-[32px]">security_update_good</span>
          </div>
          <div>
            <h4 className="font-title-lg text-title-lg text-on-surface">Latest AI Patch</h4>
            <p className="text-sm text-on-surface-variant">V-2.404 deployed 12m ago • Improved Fraud Detection</p>
          </div>
        </div>
      </div>
    </div>
  )
}
