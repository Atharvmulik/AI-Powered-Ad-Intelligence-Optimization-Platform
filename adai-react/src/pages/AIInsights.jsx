import { useState, useEffect, useRef } from 'react'
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts'

const feedItems = [
  { user: 'USER_1044', metric: 'p(click): 0.92', isFraud: false },
  { user: 'USER_6621', metric: 'fraud: 0.11', isFraud: false },
  { user: 'USER_4490', metric: 'p(click): 0.34', isFraud: false },
  { user: 'USER_1209', metric: 'p(click): 0.81', isFraud: false },
  { user: 'USER_9043', metric: 'fraud: 0.85 !!', isFraud: true },
]

export default function AIInsights() {
  // Existing stream log state
  const [stream, setStream] = useState([
    { time: '14:32:01', user: 'USER_7749', metric: 'p(click): 0.88', isFraud: false },
    { time: '14:32:05', user: 'USER_2102', metric: 'fraud: 0.91 !!', isFraud: true },
    { time: '14:32:12', user: 'USER_9941', metric: 'p(click): 0.12', isFraud: false },
    { time: '14:32:18', user: 'USER_3384', metric: 'p(click): 0.76', isFraud: false },
    { time: '14:32:25', user: 'USER_5521', metric: 'p(click): 0.54', isFraud: false },
    { time: '14:32:30', user: 'USER_8820', metric: 'fraud: 0.99 !!', isFraud: true },
  ])

  const terminalEndRef = useRef(null)

  // ==========================================
  // NEW DYNAMIC STATES
  // ==========================================

  // CHANGE 2: Kafka & Pipeline metrics
  const [kafkaEventsSec, setKafkaEventsSec] = useState(8420)
  const [pipelineLatency, setPipelineLatency] = useState(18)

  // CHANGE 3: Live CTR Trend Chart Data
  const [ctrData, setCtrData] = useState(() => {
    const initialPoints = []
    const now = new Date()
    for (let i = 19; i >= 0; i--) {
      const timeTicks = new Date(now.getTime() - i * 3000)
      const timeStr = timeTicks.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const rawCtr = parseFloat((2.0 + Math.random() * 2.0).toFixed(2)) // 2.0% - 4.0%
      const filteredCtr = parseFloat((rawCtr - (0.3 + Math.random() * 0.4)).toFixed(2)) // 0.3 - 0.7 lower
      initialPoints.push({
        time: timeStr,
        'Raw CTR': rawCtr,
        'Fraud-filtered CTR': filteredCtr
      })
    }
    return initialPoints
  })

  // CHANGE 4: Fraud Alert Panel state & refs
  const initialFraudAlerts = [
    { id: 1, time: '14:30:12', ip: '185.220.101.5', score: 0.97, category: 'Bot', feature: 'click_velocity: 340/min' },
    { id: 2, time: '14:30:45', ip: '94.23.102.89', score: 0.92, category: 'Click Farm', feature: 'ip_reputation: poor' },
    { id: 3, time: '14:31:18', ip: '203.190.150.8', score: 0.82, category: 'Suspicious Human', feature: 'hover_duration: 0.05s' },
    { id: 4, time: '14:31:55', ip: '45.22.10.87', score: 0.88, category: 'Bot', feature: 'user_agent: headless' }
  ]
  const [fraudAlerts, setFraudAlerts] = useState(initialFraudAlerts)
  const [blockedToday, setBlockedToday] = useState(47)
  const fraudTerminalRef = useRef(null)

  // ==========================================
  // EFFECT LOOPS & INTERVAL RUNNERS
  // ==========================================

  // Existing log feed interval
  useEffect(() => {
    let index = 0
    const id = setInterval(() => {
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false })
      const item = feedItems[index % feedItems.length]
      setStream(prev => {
        const next = [...prev, { time, ...item }]
        return next.length > 10 ? next.slice(next.length - 10) : next
      })
      index++
    }, 4000)
    return () => clearInterval(id)
  }, [])

  // Auto-scroll for existing terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight
    }
  }, [stream])

  // CHANGE 2: Simulating Kafka Events (±300 every 1500ms) & Latency (±4 every 2000ms)
  useEffect(() => {
    const kafkaInterval = setInterval(() => {
      setKafkaEventsSec(prev => {
        const delta = Math.floor(Math.random() * 600) - 300 // ±300
        const next = prev + delta
        return next < 7000 ? 7000 : next > 10000 ? 10000 : next
      })
    }, 1500)

    const latencyInterval = setInterval(() => {
      setPipelineLatency(prev => {
        const delta = Math.floor(Math.random() * 8) - 4 // ±4
        const next = prev + delta
        return next < 8 ? 8 : next > 28 ? 28 : next
      })
    }, 2000)

    return () => {
      clearInterval(kafkaInterval)
      clearInterval(latencyInterval)
    }
  }, [])

  // CHANGE 3: Simulating Live CTR Trend Chart Data (Updates every 3 seconds)
  useEffect(() => {
    const ctrInterval = setInterval(() => {
      const tickTime = new Date()
      const timeStr = tickTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const rawCtr = parseFloat((1.8 + Math.random() * 2.4).toFixed(2)) // 1.8% to 4.2%
      const filteredCtr = parseFloat((rawCtr - (0.3 + Math.random() * 0.5)).toFixed(2)) // 0.3 - 0.8 lower
      setCtrData(prev => {
        const next = [...prev, { time: timeStr, 'Raw CTR': rawCtr, 'Fraud-filtered CTR': filteredCtr }]
        return next.length > 20 ? next.slice(next.length - 20) : next
      })
    }, 3000)

    return () => clearInterval(ctrInterval)
  }, [])

  // CHANGE 4: Simulating Live Fraud Alerts (Updates every 6 seconds)
  useEffect(() => {
    const ipPool = [
      '185.120.44.12', '94.23.102.89', '210.45.166.4', '172.56.9.110', 
      '195.154.122.9', '43.250.241.15', '203.190.150.8'
    ]
    const categoryPool = ['Bot', 'Click Farm', 'Suspicious Human']
    const featurePool = [
      'click_velocity: 420/min', 'ip_reputation: flagged', 
      'headless_browser: true', 'hover_density: extreme',
      'user_agent: outdated'
    ]

    const fraudInterval = setInterval(() => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-GB', { hour12: false })
      const randomIp = ipPool[Math.floor(Math.random() * ipPool.length)]
      const randomCat = categoryPool[Math.floor(Math.random() * categoryPool.length)]
      const randomFeature = featurePool[Math.floor(Math.random() * featurePool.length)]
      const score = parseFloat((0.50 + Math.random() * 0.49).toFixed(2))

      const newAlert = {
        id: Date.now(),
        time: timeStr,
        ip: randomIp,
        score,
        category: randomCat,
        feature: randomFeature
      }

      setFraudAlerts(prev => {
        const next = [...prev, newAlert]
        return next.length > 8 ? next.slice(next.length - 8) : next
      })
      setBlockedToday(prev => prev + 1)
    }, 6000)

    return () => clearInterval(fraudInterval)
  }, [])

  // Auto-scroll for Fraud alerts terminal
  useEffect(() => {
    if (fraudTerminalRef.current) {
      fraudTerminalRef.current.scrollTop = fraudTerminalRef.current.scrollHeight
    }
  }, [fraudAlerts])

  return (
    <div className="space-y-gutter">

      {/* ==========================================
          CHANGE 2 — ADD: Events-per-second counter
          ========================================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Kafka Events/sec */}
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all">
          <div>
            <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider block">Kafka events/sec</span>
            <span className="text-xl font-bold font-mono text-primary mt-1 block">{kafkaEventsSec.toLocaleString()}</span>
          </div>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>

        {/* Active Kafka Topics */}
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all">
          <div>
            <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider block">Active Kafka topics</span>
            <span className="text-xl font-bold font-mono text-primary mt-1 block">5</span>
          </div>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>

        {/* Pipeline Latency */}
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all">
          <div>
            <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider block">Pipeline latency</span>
            <span className="text-xl font-bold font-mono text-primary mt-1 block">{pipelineLatency}ms</span>
          </div>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>
      </section>

      {/* AI Model Status Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Click Prediction (CHANGE 1) */}
        <div className="bg-surface-container-low border border-outline-variant p-stack-lg rounded-xl glow-indigo">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">ads_click</span>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
              ONLINE
            </span>
          </div>
          <h3 className="font-title-lg text-title-lg text-on-surface">Click Prediction</h3>
          <p className="text-xs text-on-surface-variant mt-1">XGBoost / LightGBM Ensemble v4.2</p>
          <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">AUC-ROC</span>
            <span className="text-label-md font-bold text-primary font-mono">0.812</span>
          </div>
        </div>

        {/* Fraud Detection (CHANGE 7) */}
        <div className="bg-surface-container-low border border-outline-variant p-stack-lg rounded-xl glow-indigo">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error/10 rounded-lg">
              <span className="material-symbols-outlined text-error">gpp_bad</span>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
              ONLINE
            </span>
          </div>
          <h3 className="font-title-lg text-title-lg text-on-surface">Fraud Detection</h3>
          <p className="text-xs text-on-surface-variant mt-1">Isolation Forest + Autoencoder Ensemble v1.8</p>
          <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Avg latency</span>
            <span className="text-label-md font-bold text-primary font-mono">14ms</span>
          </div>
        </div>

        {/* Recommendation Engine */}
        <div className="bg-surface-container-low border border-outline-variant p-stack-lg rounded-xl glow-indigo">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary/10 rounded-lg">
              <span className="material-symbols-outlined text-tertiary">recommend</span>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
              ONLINE
            </span>
          </div>
          <h3 className="font-title-lg text-title-lg text-on-surface">Recommendation Engine</h3>
          <p className="text-xs text-on-surface-variant mt-1">Collaborative Filter v2.1</p>
          <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Coverage</span>
            <span className="text-label-md font-bold text-primary font-mono">88.5%</span>
          </div>
        </div>
      </section>

      {/* ==========================================
          CHANGE 6 — ADD: Model metric footer under status cards
          ========================================== */}
      <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl">
        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider block mb-2">PRD acceptance criteria</span>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full font-mono text-[10px] border border-green-500/20">
            Click Prediction AUC-ROC: 0.812 / target &gt;0.78
          </span>
          <span className="px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full font-mono text-[10px] border border-green-500/20">
            Fraud Precision: 0.91 / target &gt;0.90
          </span>
          <span className="px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full font-mono text-[10px] border border-green-500/20">
            Fraud Recall: 0.87 / target &gt;0.85
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        {/* SHAP Feature Importance (Bar Chart) - (CHANGE 5 / CHANGE 8) */}
        <section className="col-span-12 lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">SHAP Feature Importance</h3>
                <p className="text-body-md text-on-surface-variant">Global impact of features on current predictions</p>
              </div>
              <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
            <div className="space-y-6">
              {/* Feature Rows */}
              <div className="flex items-center group">
                <div className="w-40 text-label-md font-mono text-on-surface-variant truncate pr-4">User_History_CTR</div>
                <div className="flex-1 h-8 flex items-center">
                  <div className="h-full bg-primary/20 rounded-l-sm" style={{ width: '5%' }}></div>
                  <div className="w-px h-full bg-outline-variant"></div>
                  <div className="h-full bg-primary rounded-r-sm transition-all group-hover:bg-primary-container" style={{ width: '65%' }}></div>
                </div>
                <div className="w-16 text-right font-mono text-label-md text-primary ml-4">+0.65</div>
              </div>
              
              <div className="flex items-center group">
                <div className="w-40 text-label-md font-mono text-on-surface-variant truncate pr-4">Ad_Category_Match</div>
                <div className="flex-1 h-8 flex items-center">
                  <div className="h-full bg-primary/20 rounded-l-sm" style={{ width: '2%' }}></div>
                  <div className="w-px h-full bg-outline-variant"></div>
                  <div className="h-full bg-primary rounded-r-sm transition-all group-hover:bg-primary-container" style={{ width: '48%' }}></div>
                </div>
                <div className="w-16 text-right font-mono text-label-md text-primary ml-4">+0.48</div>
              </div>

              <div className="flex items-center group">
                <div className="w-40 text-label-md font-mono text-on-surface-variant truncate pr-4">Time_of_Day</div>
                <div className="flex-1 h-8 flex items-center">
                  <div className="h-full bg-error rounded-l-sm transition-all group-hover:bg-red-400" style={{ width: '20%' }}></div>
                  <div className="w-px h-full bg-outline-variant"></div>
                  <div className="h-full bg-primary/20 rounded-r-sm" style={{ width: '10%' }}></div>
                </div>
                <div className="w-16 text-right font-mono text-label-md text-error ml-4">-0.20</div>
              </div>

              <div className="flex items-center group">
                <div className="w-40 text-label-md font-mono text-on-surface-variant truncate pr-4">Device_Type</div>
                <div className="flex-1 h-8 flex items-center">
                  <div className="h-full bg-primary/20 rounded-l-sm" style={{ width: '0%' }}></div>
                  <div className="w-px h-full bg-outline-variant"></div>
                  <div className="h-full bg-primary rounded-r-sm transition-all group-hover:bg-primary-container" style={{ width: '32%' }}></div>
                </div>
                <div className="w-16 text-right font-mono text-label-md text-primary ml-4">+0.32</div>
              </div>

              <div className="flex items-center group">
                <div className="w-40 text-label-md font-mono text-on-surface-variant truncate pr-4">Historical_CTR</div>
                <div className="flex-1 h-8 flex items-center">
                  <div className="h-full bg-error rounded-l-sm transition-all group-hover:bg-red-400" style={{ width: '15%' }}></div>
                  <div className="w-px h-full bg-outline-variant"></div>
                  <div className="h-full bg-primary/20 rounded-r-sm" style={{ width: '5%' }}></div>
                </div>
                <div className="w-16 text-right font-mono text-label-md text-error ml-4">-0.15</div>
              </div>

              <div className="flex items-center group">
                <div className="w-40 text-label-md font-mono text-on-surface-variant truncate pr-4">User_Interest_Vector</div>
                <div className="flex-1 h-8 flex items-center">
                  <div className="h-full bg-primary/20 rounded-l-sm" style={{ width: '0%' }}></div>
                  <div className="w-px h-full bg-outline-variant"></div>
                  <div className="h-full bg-primary rounded-r-sm transition-all group-hover:bg-primary-container" style={{ width: '41%' }}></div>
                </div>
                <div className="w-16 text-right font-mono text-label-md text-primary ml-4">+0.41</div>
              </div>
            </div>
          </div>
          {/* Legend and Log Loss Footer (CHANGE 8) */}
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center text-label-md text-on-surface-variant border-t border-outline-variant/30 pt-4 gap-4">
            <div className="flex gap-4">
              <span className="flex items-center"><span className="w-3 h-3 bg-error rounded-full mr-2"></span> Negative Impact</span>
              <span className="flex items-center"><span className="w-3 h-3 bg-primary rounded-full mr-2"></span> Positive Impact</span>
            </div>
            <div className="font-mono text-xs text-on-surface-variant flex items-baseline gap-1.5">
              <span>Model log loss:</span>
              <span className="text-primary font-bold">0.421</span>
            </div>
          </div>
        </section>

        {/* Live Prediction Feed (Terminal Style) */}
        <section className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col h-[400px]">
          <div className="bg-surface-container-high px-4 py-2 border-b border-outline-variant flex items-center justify-between shrink-0">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-error/40"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary/40"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"></div>
            </div>
            <span className="text-label-md font-mono text-on-surface-variant">PREDICTION_STREAM:LIVE</span>
          </div>
          <div ref={terminalEndRef} className="p-4 flex-1 font-mono text-[12px] text-primary overflow-y-auto custom-scrollbar bg-[#050507]">
            <div className="space-y-3">
              {stream.map((log, index) => (
                <div key={index} className="flex justify-between items-start font-mono">
                  <span className="text-on-surface-variant">[{log.time}]</span>
                  <span className="text-tertiary">{log.user}</span>
                  <span className={`px-1 rounded ${log.isFraud ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                    {log.metric}
                  </span>
                </div>
              ))}
              <div className="pt-2 text-primary/60 italic flex items-center font-mono">
                Analyzing feature vectors... <span className="terminal-cursor"></span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ==========================================
          CHANGE 3 — ADD: Live CTR trend chart
          ========================================== */}
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg col-span-12">
        <div className="mb-4">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Live CTR trend</h3>
          <p className="text-body-md text-on-surface-variant">Updates every 3 seconds · Fraud-filtered vs raw</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ctrData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#464554" opacity={0.2} />
              <XAxis dataKey="time" stroke="#908fa0" style={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis domain={[0, 6]} tickFormatter={(v) => `${v}%`} stroke="#908fa0" style={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip 
                contentStyle={{ background: '#1f1f26', border: '1px solid #464554', borderRadius: 8 }}
                labelStyle={{ color: '#c7c4d7', fontFamily: 'monospace' }}
              />
              <Legend verticalAlign="bottom" height={36} />
              <Line type="monotone" dataKey="Raw CTR" stroke="#c0c1ff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="Fraud-filtered CTR" stroke="#ffb4ab" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-gutter">
        {/* Recommendation Explanation */}
        <section className="col-span-12 lg:col-span-7 bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg">
          <div className="flex items-center mb-6">
            <span className="material-symbols-outlined text-primary mr-3" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Recommendation Explanation</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-gutter">
            <div className="w-full md:w-1/3 shrink-0">
              <div className="aspect-square bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden relative group">
                <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQisxDyiqldwdfnHTc9168E7MJJZQU0YfsVNOA1JeYOZ50lRMIwEzOQuTJACVpO305PY89MR8UxQtMOxsV5cT3brLUEY4gnpxKc9uuhvMY8vSg35lfPgIgAfgvotDlBEVg69EutWzxJB3KxOTzPfVzl6apE9Mi25W5phTkcWf7X0-kkLuuumL8ggT_g4AiI253kxSiyXFkHMudL7QvTwb5HJ0pCBbfHd1gcSMZLZ6tPqafpOReDYxpxVqNingp94Wxe5XwlWaFbnEo" alt="Nike shoes ad" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
                <div className="absolute bottom-3 left-3">
                  <p className="text-label-md font-bold text-on-surface">Nike Shoes</p>
                  <p className="text-[10px] text-primary">Target: Performance</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-title-lg text-on-surface font-semibold">Why was "Nike Shoes" recommended?</p>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="material-symbols-outlined text-green-500 text-sm mt-1 mr-2">check_circle</span>
                  <p className="text-body-md text-on-surface-variant"><span className="text-on-surface font-bold">Similarity:</span> 89% match with previously purchased 'Jordan High-Tops'.</p>
                </div>
                <div className="flex items-start">
                  <span className="material-symbols-outlined text-green-500 text-sm mt-1 mr-2">check_circle</span>
                  <p className="text-body-md text-on-surface-variant"><span className="text-on-surface font-bold">Context:</span> User recently searched for "marathon training gear".</p>
                </div>
                <div className="flex items-start">
                  <span className="material-symbols-outlined text-green-500 text-sm mt-1 mr-2">check_circle</span>
                  <p className="text-body-md text-on-surface-variant"><span className="text-on-surface font-bold">Social Proof:</span> 4.2x higher conversion rate in 'Professional Runner' segment.</p>
                </div>
                <div className="flex items-start">
                  <span className="material-symbols-outlined text-primary text-sm mt-1 mr-2">info</span>
                  <p className="text-body-md text-on-surface-variant"><span className="text-on-surface font-bold">Confidence:</span> Model predicted 0.82 purchase probability.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            CHANGE 4 — ADD: Fraud alert panel
            ========================================== */}
        <section className="col-span-12 lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col h-[350px]">
          <div className="bg-surface-container-high px-4 py-2 border-b border-outline-variant flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
              <span className="text-label-md font-mono text-error font-bold">FRAUD_ALERT:LIVE</span>
            </div>
            <span className="text-xs font-mono font-bold text-error bg-error/10 px-2 py-0.5 rounded border border-error/20">
              {blockedToday} blocked today
            </span>
          </div>
          <div ref={fraudTerminalRef} className="p-4 flex-1 font-mono text-[11px] overflow-y-auto custom-scrollbar bg-[#090505]">
            <div className="space-y-3">
              {fraudAlerts.map((alert) => (
                <div key={alert.id} className="border-b border-outline-variant/10 pb-2 flex flex-col gap-1 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">[{alert.time}]</span>
                    <span className="text-on-surface font-semibold">{alert.ip}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      alert.score > 0.85 ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'
                    }`}>
                      Score {alert.score}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container text-on-surface border border-outline-variant">
                      {alert.category}
                    </span>
                    <span className="text-on-surface-variant italic truncate max-w-[150px]">
                      {alert.feature}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        {/* A/B Test Results (Fitted nicely in full width at the bottom) */}
        <section className="col-span-12 bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">A/B Test Results</h3>
              <span className="text-label-md bg-primary/10 text-primary px-2 py-1 rounded font-mono font-bold text-[10px]">LIVE TEST</span>
            </div>
            <div className="space-y-6">
              {/* Variant A */}
              <div className="relative p-4 rounded-lg bg-surface-container-lowest border border-outline-variant">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-on-surface-variant">VARIANT A (Control)</span>
                  <span className="text-title-lg font-mono text-on-surface font-black">2.4% CTR</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-outline-variant" style={{ width: '45%' }}></div>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-2">Static Banner + Traditional Copy</p>
              </div>
              {/* Variant B */}
              <div className="relative p-4 rounded-lg bg-primary/5 border border-primary/30">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-xs font-bold text-primary">VARIANT B (AI-Gen)</span>
                    <span className="material-symbols-outlined text-primary text-xs ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <span className="text-title-lg font-mono text-primary font-black">4.1% CTR</span>
                </div>
                <div className="w-full h-2 bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '78%' }}></div>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-[10px] text-primary/80">Dynamic Creative + Personalized Hook</p>
                  <span className="text-xs font-bold text-green-500 font-mono">+70.8% LIFT</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-center border-t border-outline-variant/20 pt-4">
            <button className="flex items-center text-label-md text-primary font-bold hover:underline group">
              Deploy Variant B as primary 
              <span className="material-symbols-outlined ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </section>
      </div>

    </div>
  )
}
