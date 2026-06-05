import { useState, useEffect, useRef, useCallback } from 'react'

export default function RealTimeEvents() {
  const [isPaused, setIsPaused] = useState(false)
  const [eventsPerSec, setEventsPerSec] = useState(847)
  const [totalEvents, setTotalEvents] = useState(72.4) // in Millions
  const [kafkaLatency, setKafkaLatency] = useState(12) // in ms
  const [fraudCount, setFraudCount] = useState(0)
  const [latencyHistory, setLatencyHistory] = useState([12, 13, 11, 12, 14, 13, 12, 11, 10, 12, 13, 14, 12, 11, 13, 12, 14, 13, 12, 11])
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [flashFraud, setFlashFraud] = useState(false)
  const [logs, setLogs] = useState([
    { time: '14:02:21', label: 'CLICK', msg: 'evt_88921_clnk | campaign_id: AD_990 | score: 0.98', color: 'text-primary', msgColor: 'text-on-surface' },
    { time: '14:02:22', label: 'FRAUD', msg: 'SUSPICIOUS_IP | src: 192.168.1.1 | bot_sig: detected | blocking...', color: 'text-error', msgColor: 'text-error' },
    { time: '14:02:22', label: 'PRED', msg: 'conversion_likely | target_cpa: $2.40 | bid_adjust: +15%', color: 'text-tertiary', msgColor: 'text-tertiary' },
    { time: '14:02:23', label: 'CLICK', msg: 'evt_88924_clnk | campaign_id: AD_102 | score: 0.92', color: 'text-primary', msgColor: 'text-on-surface' },
    { time: '14:02:23', label: 'CLICK', msg: 'evt_88925_clnk | campaign_id: AD_884 | score: 0.99', color: 'text-primary', msgColor: 'text-on-surface' },
  ])
  
  const terminalEndRef = useRef(null)
  const exportRef = useRef(null)

  const eventTypes = [
    { label: 'CLICK', color: 'text-primary', msgColor: 'text-on-surface', pattern: 'evt_{}_clnk | campaign_id: AD_{} | score: {}' },
    { label: 'FRAUD', color: 'text-error', msgColor: 'text-error', pattern: 'BLOCKED | reason: high_velocity | ip: 45.2.{}.{}' },
    { label: 'PRED', color: 'text-tertiary', msgColor: 'text-tertiary', pattern: 'MODEL_HIT | p_conv: {} | recommended_bid: ${}' },
    { label: 'SHAP', color: 'text-yellow-400', msgColor: 'text-yellow-400', pattern: 'EXPLAIN | ad_id: AD_{} | top_feat: user_interest(+{}) device_type(+{}) time_of_day(+{})' }
  ]

  // Calculate event distribution counts
  const getEventCounts = useCallback(() => {
    const counts = { CLICK: 0, FRAUD: 0, PRED: 0, SHAP: 0 }
    logs.forEach(log => {
      if (counts[log.label] !== undefined) counts[log.label]++
    })
    return counts
  }, [logs])

  const eventCounts = getEventCounts()
  const maxCount = Math.max(...Object.values(eventCounts), 1)

  const getBarHeight = (count) => {
    const minHeight = 8
    const maxHeight = 70
    return count === 0 ? minHeight : (count / maxCount) * maxHeight
  }

  // Update latency history
  useEffect(() => {
    if (!isPaused) {
      setLatencyHistory(prev => {
        const newHistory = [...prev.slice(-19), kafkaLatency]
        return newHistory
      })
    }
  }, [kafkaLatency, isPaused])

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
      
      // SHAP appears every 8-10 seconds (about 1/6 of the time with 1.5s interval)
      let event
      if (Math.random() < 0.15) {
        event = eventTypes[3] // SHAP
      } else {
        event = eventTypes[Math.floor(Math.random() * 3)]
      }
      
      let msg = event.pattern
      if (event.label === 'CLICK') {
        msg = msg.replace('{}', Math.floor(Math.random() * 90000 + 10000))
                 .replace('{}', Math.floor(Math.random() * 900 + 100))
                 .replace('{}', (Math.random() * 0.2 + 0.8).toFixed(2))
      } else if (event.label === 'FRAUD') {
        msg = msg.replace('{}', Math.floor(Math.random() * 255))
                 .replace('{}', Math.floor(Math.random() * 255))
      } else if (event.label === 'PRED') {
        msg = msg.replace('{}', Math.random().toFixed(3))
                 .replace('{}', (Math.random() * 4 + 0.5).toFixed(2))
      } else if (event.label === 'SHAP') {
        msg = msg.replace('{}', Math.floor(Math.random() * 900 + 100))
                 .replace('{}', (Math.random() * 0.5 + 0.1).toFixed(2))
                 .replace('{}', (Math.random() * 0.3 + 0.05).toFixed(2))
                 .replace('{}', (Math.random() * 0.25 + 0.05).toFixed(2))
      }

      // Update fraud count
      if (event.label === 'FRAUD') {
        setFraudCount(prev => prev + 1)
        setFlashFraud(true)
        setTimeout(() => setFlashFraud(false), 500)
      }

      setLogs(prev => {
        const next = [...prev, { time, label: event.label, msg, color: event.color, msgColor: event.msgColor }]
        return next.length > 30 ? next.slice(next.length - 30) : next
      })
    }, 1500)
    return () => clearInterval(logTimer)
  }, [isPaused])

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight
    }
  }, [logs])

  // Click outside handler for export dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setIsExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const exportLogs = (format) => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `adai_event_logs_${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
    } else if (format === 'csv') {
      const csvRows = [
        ['timestamp', 'event_type', 'message'],
        ...logs.map(log => [log.time, log.label, log.msg])
      ]
      const csvContent = csvRows.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `adai_event_logs_${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
    setIsExportOpen(false)
  }

  const resetFraudCounter = () => {
    setFraudCount(0)
  }

  // Generate dynamic SVG path
  const generatePath = () => {
    if (latencyHistory.length === 0) return ''
    const minLatency = 9
    const maxLatency = 18
    
    const points = latencyHistory.map((value, index) => {
      const x = (index / (latencyHistory.length - 1)) * 400
      const y = 80 - ((value - minLatency) / (maxLatency - minLatency)) * 60
      return `${x},${y}`
    })
    
    const pathData = `M ${points.join(' L ')}`
    const areaPath = `${pathData} V 100 H 0 Z`
    return { linePath: pathData, areaPath }
  }

  const { linePath, areaPath } = generatePath()
  const latestLatency = latencyHistory[latencyHistory.length - 1] || kafkaLatency
  const lineColor = latestLatency > 15 ? '#ef4444' : '#c0c1ff'

  const getKafkaStatus = () => {
    if (eventsPerSec > 800) return { text: 'HEALTHY', color: 'text-green-400', dotColor: 'bg-green-400', borderColor: 'border-green-400/30' }
    if (eventsPerSec >= 600) return { text: 'DEGRADED', color: 'text-yellow-400', dotColor: 'bg-yellow-400', borderColor: 'border-yellow-400/30' }
    return { text: 'CRITICAL', color: 'text-red-400', dotColor: 'bg-red-400', borderColor: 'border-red-400/30' }
  }

  const kafkaStatus = getKafkaStatus()

  return (
    <div className="space-y-stack-lg">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-stack-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center px-3 py-1 bg-tertiary-container/20 border border-tertiary rounded-full pulse-live select-none">
            <span className="w-2 h-2 rounded-full bg-tertiary mr-2"></span>
            <span className="text-tertiary font-label-md text-label-md font-bold uppercase tracking-widest">LIVE</span>
          </div>
          <div className="flex items-center px-3 py-1 bg-error-container/20 border border-error/30 rounded-full select-none">
            <span className="material-symbols-outlined text-error text-[16px] mr-1">shield</span>
            <span className="text-error font-label-md text-label-md font-bold">{fraudCount} Fraud Blocked</span>
            <button
              onClick={resetFraudCounter}
              className="ml-2 text-on-surface-variant hover:text-error transition-colors text-xs"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="flex space-x-2 relative" ref={exportRef}>
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="px-4 py-2 bg-surface-container-high border border-outline-variant rounded-lg font-label-md text-label-md flex items-center hover:bg-surface-bright transition-colors text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">download</span> Export Logs
            <span className="material-symbols-outlined text-[16px] ml-1">arrow_drop_down</span>
          </button>
          {isExportOpen && (
            <div className="absolute top-full right-0 mt-2 bg-surface-container-high border border-outline-variant rounded-lg shadow-2xl z-50 min-w-[180px] overflow-hidden">
              <button
                onClick={() => exportLogs('json')}
                className="w-full px-4 py-2 text-left hover:bg-surface-bright transition-colors flex items-center space-x-2"
              >
                <span className="material-symbols-outlined text-[18px]">code</span>
                <span>Export as JSON</span>
              </button>
              <button
                onClick={() => exportLogs('csv')}
                className="w-full px-4 py-2 text-left hover:bg-surface-bright transition-colors flex items-center space-x-2 border-t border-outline-variant"
              >
                <span className="material-symbols-outlined text-[18px]">table_chart</span>
                <span>Export as CSV</span>
              </button>
            </div>
          )}
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

      {/* Stream Health Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter">
        <div className={`bg-surface-container-low border ${kafkaStatus.borderColor} rounded-lg px-4 py-2 flex items-center justify-between group relative`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${kafkaStatus.dotColor} animate-pulse`}></div>
            <span className="text-on-surface-variant font-label-md text-label-md uppercase text-xs">Kafka Status</span>
          </div>
          <span className={`${kafkaStatus.color} font-mono font-bold text-sm`}>{kafkaStatus.text}</span>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-on-surface text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Real-time Kafka consumer lag monitoring
          </div>
        </div>
        
        <div className="bg-surface-container-low border border-green-400/30 rounded-lg px-4 py-2 flex items-center justify-between group relative">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-on-surface-variant font-label-md text-label-md uppercase text-xs">ML Pipeline</span>
          </div>
          <span className="text-green-400 font-mono font-bold text-sm">ACTIVE</span>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-on-surface text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Real-time inference engine status
          </div>
        </div>

        <div className="bg-surface-container-low border border-tertiary/30 rounded-lg px-4 py-2 flex items-center justify-between group relative">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
            <span className="text-on-surface-variant font-label-md text-label-md uppercase text-xs">Fraud Engine</span>
          </div>
          <span className="text-tertiary font-mono font-bold text-sm">SCANNING</span>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-on-surface text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Real-time fraud detection scanning
          </div>
        </div>

        <div className="bg-surface-container-low border border-secondary/30 rounded-lg px-4 py-2 flex items-center justify-between group relative">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span className="text-on-surface-variant font-label-md text-label-md uppercase text-xs">Redis Cache</span>
          </div>
          <span className="text-secondary font-mono font-bold text-sm">HIT RATE: 94%</span>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-on-surface text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Cache hit rate for real-time features
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Terminal Console */}
        <div className="col-span-12 lg:col-span-8 flex flex-col">
          <div className={`bg-surface-container-lowest border ${flashFraud ? 'border-red-500' : 'border-outline-variant'} rounded-xl overflow-hidden flex flex-col h-[500px] relative shadow-2xl transition-all duration-500`}>
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
            <div ref={terminalEndRef} className="flex-grow p-4 font-mono text-label-md overflow-y-auto terminal-scroll bg-[#050507] text-[12px] space-y-1 relative">
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
                <div className="flex space-x-4 font-mono items-center">
                  <span className="text-on-surface-variant opacity-40">[{new Date().toLocaleTimeString('en-GB', { hour12: false })}]</span>
                  <span className="text-primary font-bold">STREAM</span>
                  <span className="text-on-surface italic">Waiting for incoming packets...</span>
                  <span className="inline-block w-2 h-4 bg-primary ml-1 animate-blink"></span>
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
                <div className="w-full bg-primary/20 rounded-t-sm relative transition-all duration-300 group-hover:bg-primary/40" style={{ height: '80px' }}>
                  <div className="absolute bottom-0 w-full bg-primary rounded-t-sm shadow-[0_0_15px_rgba(192,193,255,0.4)] transition-all duration-500" style={{ height: `${getBarHeight(eventCounts.CLICK)}px` }}></div>
                </div>
                <span className="font-label-md text-[10px] mt-2 text-primary font-bold">Clicks</span>
                <span className="text-xs text-on-surface-variant mt-1">{eventCounts.CLICK}</span>
              </div>
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-error/20 rounded-t-sm relative transition-all duration-300 group-hover:bg-error/40" style={{ height: '80px' }}>
                  <div className="absolute bottom-0 w-full bg-error rounded-t-sm transition-all duration-500" style={{ height: `${getBarHeight(eventCounts.FRAUD)}px` }}></div>
                </div>
                <span className="font-label-md text-[10px] mt-2 text-error font-bold">Fraud</span>
                <span className="text-xs text-on-surface-variant mt-1">{eventCounts.FRAUD}</span>
              </div>
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-tertiary/20 rounded-t-sm relative transition-all duration-300 group-hover:bg-tertiary/40" style={{ height: '80px' }}>
                  <div className="absolute bottom-0 w-full bg-tertiary rounded-t-sm transition-all duration-500" style={{ height: `${getBarHeight(eventCounts.PRED)}px` }}></div>
                </div>
                <span className="font-label-md text-[10px] mt-2 text-tertiary font-bold">Preds</span>
                <span className="text-xs text-on-surface-variant mt-1">{eventCounts.PRED}</span>
              </div>
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-yellow-400/20 rounded-t-sm relative transition-all duration-300 group-hover:bg-yellow-400/40" style={{ height: '80px' }}>
                  <div className="absolute bottom-0 w-full bg-yellow-400 rounded-t-sm transition-all duration-500" style={{ height: `${getBarHeight(eventCounts.SHAP)}px` }}></div>
                </div>
                <span className="font-label-md text-[10px] mt-2 text-yellow-400 font-bold">SHAP</span>
                <span className="text-xs text-on-surface-variant mt-1">{eventCounts.SHAP}</span>
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
                    <stop offset="0%" stopColor={lineColor} stopOpacity="0.2"></stop>
                    <stop offset="100%" stopColor={lineColor} stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#latencyGradient)"></path>
                <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2"></path>
                {latencyHistory.length > 0 && (
                  <circle 
                    className="status-pulse" 
                    cx={(latencyHistory.length - 1) / (latencyHistory.length - 1) * 400} 
                    cy={80 - ((latestLatency - 9) / (18 - 9)) * 60}
                    fill={lineColor} 
                    r="4"
                  />
                )}
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

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
        .scanline {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 255, 0, 0.03) 0px,
            rgba(0, 255, 0, 0.03) 2px,
            transparent 2px,
            transparent 4px
          );
          pointer-events: none;
          z-index: 1;
        }
        .terminal-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .terminal-scroll::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .terminal-scroll::-webkit-scrollbar-thumb {
          background: #3a3a3a;
          border-radius: 4px;
        }
        .terminal-scroll::-webkit-scrollbar-thumb:hover {
          background: #4a4a4a;
        }
        .status-pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { r: 4px; opacity: 1; }
          50% { r: 6px; opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}