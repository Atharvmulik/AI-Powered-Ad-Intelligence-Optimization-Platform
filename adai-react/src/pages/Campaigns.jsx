import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Campaigns() {
  // ========== LIVE CHART DATA ==========
  const [ctrData, setCtrData] = useState(() => {
    const initialData = []
    const now = new Date()
    for (let i = 19; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3000)
      initialData.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ctr: 1.8 + Math.random() * 1.4,
        fraudRate: 0.8 + Math.random() * 1.3,
        events: 4000 + Math.floor(Math.random() * 2000)
      })
    }
    return initialData
  })

  const [eventsPerSec, setEventsPerSec] = useState(8420)
  const [activeUsers, setActiveUsers] = useState(14200)
  const [fraudBlockedToday, setFraudBlockedToday] = useState(24891)
  const [avgLatency, setAvgLatency] = useState(24)

  // ========== FRAUD EVENT FEED ==========
  const [fraudEvents, setFraudEvents] = useState([
    { id: 1, timestamp: new Date(Date.now() - 300000).toLocaleTimeString(), ip: '192.168.14.82', score: 0.94, category: 'Bot Traffic', campaign: 'Summer Sale 2024', action: 'Blocked', device: 'Chrome 124 • Windows • Desktop' },
    { id: 2, timestamp: new Date(Date.now() - 250000).toLocaleTimeString(), ip: '45.33.22.11', score: 0.87, category: 'Click Farm', campaign: 'Back to School', action: 'Blocked', device: 'Firefox 121 • Android • Mobile' },
    { id: 3, timestamp: new Date(Date.now() - 200000).toLocaleTimeString(), ip: '10.12.45.67', score: 0.56, category: 'Suspicious Human', campaign: 'Summer Sale 2024', action: 'Flagged', device: 'Safari 17 • iOS • Mobile' },
    { id: 4, timestamp: new Date(Date.now() - 150000).toLocaleTimeString(), ip: '172.31.88.23', score: 0.98, category: 'Bot Traffic', campaign: 'Back to School', action: 'Blocked', device: 'Chrome 124 • Windows • Desktop' },
    { id: 5, timestamp: new Date(Date.now() - 100000).toLocaleTimeString(), ip: '203.0.113.45', score: 0.32, category: 'Clean', campaign: 'Summer Sale 2024', action: 'Allowed', device: 'Edge 122 • Windows • Desktop' },
    { id: 6, timestamp: new Date(Date.now() - 50000).toLocaleTimeString(), ip: '198.51.100.78', score: 0.91, category: 'Bot Traffic', campaign: 'Back to School', action: 'Blocked', device: 'Chrome 123 • macOS • Desktop' },
    { id: 7, timestamp: new Date(Date.now() - 20000).toLocaleTimeString(), ip: '192.0.2.99', score: 0.73, category: 'Click Farm', campaign: 'Summer Sale 2024', action: 'Flagged', device: 'Firefox 120 • Android • Mobile' },
    { id: 8, timestamp: new Date(Date.now() - 5000).toLocaleTimeString(), ip: '2001:db8::142', score: 0.15, category: 'Clean', campaign: 'Back to School', action: 'Allowed', device: 'Safari 17 • iOS • Mobile' },
  ])

  // ========== COUNTDOWN TIMER ==========
  const [countdown, setCountdown] = useState(8 * 60) // 8 minutes in seconds

  // ========== SPARKLINE GENERATION ==========
  const getSparkline = useCallback(() => {
    return Array(5).fill(0).map(() => Math.floor(Math.random() * 30) + 10)
  }, [])

  const [sparklines, setSparklines] = useState({
    events: getSparkline(),
    users: getSparkline(),
    fraud: getSparkline(),
    latency: getSparkline()
  })

  // ========== REFS ==========
  const fraudFeedEndRef = useRef(null)

  // ========== MOCK CONSTANTS ==========
  const campaignsData = useMemo(() => ({
    summer: {
      name: 'Summer Sale 2024',
      rawClicks: 24800,
      cleanClicks: 21340,
      fraudFiltered: 3460,
      bidStrategy: 'Target ROAS',
      targetDemo: ['Age 25-44', 'Shoppers', 'Desktop'],
      fraudRisk: 'low',
      roasTrend: 'up',
      roasDelta: '+0.3x',
      cpaTrend: 'down',
      cpaDelta: '-$1.20',
      spend: 14240,
      budget: 20000,
      roas: 4.2,
      cpa: 12.40,
      channel: 'Meta Ads',
      type: 'Direct Response'
    },
    backToSchool: {
      name: 'Back to School',
      rawClicks: 18200,
      cleanClicks: 15890,
      fraudFiltered: 2310,
      bidStrategy: 'Max Conversions',
      targetDemo: ['Age 16-24', 'Mobile Users', 'Students'],
      fraudRisk: 'medium',
      reachTrend: 'up',
      reachDelta: '+120K',
      engagementTrend: 'up',
      engagementDelta: '+1.1%',
      spend: 8900,
      budget: 15000,
      reach: '1.2M',
      engagement: 8.4,
      channel: 'TikTok',
      type: 'Brand Awareness'
    },
    holiday: {
      name: 'Holiday Prep 2024',
      bidStrategy: 'Target CPA',
      targetDemo: ['Age 30-55', 'Multi-Channel', 'High LTV'],
      fraudRisk: 'low',
      status: 'Scheduled',
      budget: 50000,
      channel: 'Multi-Channel',
      type: 'Planning',
      startDate: 'Oct 15, 2024'
    }
  }), [])

  // ========== LIVE DATA UPDATES ==========
  useEffect(() => {
    // Chart data update every 3 seconds
    const chartInterval = setInterval(() => {
      const now = new Date()
      const newPoint = {
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ctr: 1.8 + Math.random() * 1.4,
        fraudRate: 0.8 + Math.random() * 1.3,
        events: 4000 + Math.floor(Math.random() * 2000)
      }
      setCtrData(prev => {
        const newData = [...prev.slice(1), newPoint]
        return newData
      })
    }, 3000)

    // Events per second update
    const eventsInterval = setInterval(() => {
      setEventsPerSec(prev => Math.max(7000, prev + (Math.random() - 0.5) * 200))
    }, 1000)

    // Active users update
    const usersInterval = setInterval(() => {
      setActiveUsers(prev => Math.max(12000, prev + (Math.random() - 0.5) * 300))
    }, 5000)

    // Fraud blocked increment
    const fraudInterval = setInterval(() => {
      setFraudBlockedToday(prev => prev + Math.floor(Math.random() * 5) + 1)
    }, 2000)

    // Latency update
    const latencyInterval = setInterval(() => {
      setAvgLatency(prev => Math.min(45, Math.max(15, prev + (Math.random() - 0.5) * 4)))
    }, 3000)

    // Sparkline updates
    const sparklineInterval = setInterval(() => {
      setSparklines({
        events: getSparkline(),
        users: getSparkline(),
        fraud: getSparkline(),
        latency: getSparkline()
      })
    }, 3000)

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 8 * 60
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(chartInterval)
      clearInterval(eventsInterval)
      clearInterval(usersInterval)
      clearInterval(fraudInterval)
      clearInterval(latencyInterval)
      clearInterval(sparklineInterval)
      clearInterval(countdownInterval)
    }
  }, [getSparkline])

  // ========== FRAUD EVENT GENERATION ==========
  useEffect(() => {
    const fraudCategories = ['Bot Traffic', 'Click Farm', 'Suspicious Human', 'Clean']
    const campaigns = ['Summer Sale 2024', 'Back to School']
    const actions = { 'Bot Traffic': 'Blocked', 'Click Farm': 'Blocked', 'Suspicious Human': 'Flagged', 'Clean': 'Allowed' }
    const devices = ['Chrome 124 • Windows • Desktop', 'Firefox 121 • Android • Mobile', 'Safari 17 • iOS • Mobile', 'Edge 122 • Windows • Desktop', 'Chrome 123 • macOS • Desktop']

    const fraudInterval = setInterval(() => {
      const category = fraudCategories[Math.floor(Math.random() * fraudCategories.length)]
      const score = category === 'Clean' ? 0.1 + Math.random() * 0.2 :
        category === 'Suspicious Human' ? 0.5 + Math.random() * 0.3 :
          category === 'Click Farm' ? 0.7 + Math.random() * 0.2 :
            0.85 + Math.random() * 0.14

      const newEvent = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        score: parseFloat(score.toFixed(2)),
        category,
        campaign: campaigns[Math.floor(Math.random() * campaigns.length)],
        action: actions[category],
        device: devices[Math.floor(Math.random() * devices.length)]
      }

      setFraudEvents(prev => {
        const newEvents = [newEvent, ...prev].slice(0, 12)
        return newEvents
      })
    }, 4500)

    return () => clearInterval(fraudInterval)
  }, [])

  // ========== AUTO-SCROLL FRAUD FEED ==========
  useEffect(() => {
    if (fraudFeedEndRef.current) {
      fraudFeedEndRef.current.scrollTop = 0
    }
  }, [fraudEvents])

  // ========== HELPER FUNCTIONS ==========
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getFraudColor = (score) => {
    if (score < 0.3) return 'bg-green-500'
    if (score < 0.7) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getFraudScoreLabel = (score) => {
    if (score < 0.3) return 'Low Risk'
    if (score < 0.7) return 'Medium Risk'
    return 'High Risk'
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container border border-outline-variant rounded-lg p-3 shadow-lg">
          <p className="text-xs text-on-surface-variant mb-1">{payload[0]?.payload.time}</p>
          <p className="text-sm text-primary">CTR: {payload[0]?.value?.toFixed(2)}%</p>
          <p className="text-sm text-error">Fraud Rate: {payload[1]?.value?.toFixed(2)}%</p>
          <p className="text-xs text-on-surface-variant mt-1">Events: {payload[0]?.payload.events.toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-stack-lg">
      {/* ========== SECTION 1: PAGE HEADER (KEPT ORIGINAL) ========== */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="font-body-md text-on-surface-variant">Real-time spend and performance optimization</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors font-body-md">
            <span className="material-symbols-outlined text-sm">add</span>
            New Campaign
          </button>
        </div>
      </section>

      {/* ========== SECTION 2: LIVE PERFORMANCE MONITOR ========== */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Live Performance Monitor</h2>
            <p className="font-body-md text-on-surface-variant">Real-time metrics streamed via Apache Kafka</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Chart Panel */}
          <div className="lg:col-span-2 bg-surface-container-low border border-outline-variant rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-title-lg text-title-lg">Click-Through Rate vs Fraud Rate — Live</h3>
                <p className="text-xs text-on-surface-variant mt-1">CTR Model: XGBoost v2.1 | Fraud Detection: Isolation Forest</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-bold text-green-500">LIVE</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ctrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="ctr" stroke="#6366f1" strokeWidth={2} dot={false} name="CTR" unit="%" />
                <Line type="monotone" dataKey="fraudRate" stroke="#ef4444" strokeWidth={2} dot={false} name="Fraud Rate" unit="%" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Live Counters */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-3">
            {/* Events/sec */}
            <div className="p-3 bg-surface-container rounded-lg border-l-4 border-primary">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-label-md text-on-surface-variant uppercase tracking-wider">Events / Second</p>
                <div className="flex gap-[2px] items-end h-6">
                  {sparklines.events.map((height, i) => (
                    <div key={i} className="w-1 bg-primary/60 rounded-sm" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
              </div>
              <p className="text-2xl font-bold text-primary">{Math.round(eventsPerSec).toLocaleString()}</p>
              <p className="text-[10px] text-on-surface-variant mt-1">Kafka stream: ad_impressions topic</p>
            </div>

            {/* Active Users */}
            <div className="p-3 bg-surface-container rounded-lg border-l-4 border-info">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-label-md text-on-surface-variant uppercase tracking-wider">Active Users</p>
                <div className="flex gap-[2px] items-end h-6">
                  {sparklines.users.map((height, i) => (
                    <div key={i} className="w-1 bg-info/60 rounded-sm" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
              </div>
              <p className="text-2xl font-bold text-info">{Math.round(activeUsers).toLocaleString()}</p>
              <p className="text-[10px] text-on-surface-variant mt-1">Real-time user sessions</p>
            </div>

            {/* Fraud Blocked Today */}
            <div className="p-3 bg-surface-container rounded-lg border-l-4 border-error">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-label-md text-on-surface-variant uppercase tracking-wider">Fraud Blocked Today</p>
                <div className="flex gap-[2px] items-end h-6">
                  {sparklines.fraud.map((height, i) => (
                    <div key={i} className="w-1 bg-error/60 rounded-sm" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
              </div>
              <p className="text-2xl font-bold text-error">{fraudBlockedToday.toLocaleString()}</p>
              <p className="text-[10px] text-on-surface-variant mt-1">Invalid clicks prevented</p>
            </div>

            {/* Avg Inference Latency */}
            {/* <div className="p-3 bg-surface-container rounded-lg border-l-4 border-tertiary">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-label-md text-on-surface-variant uppercase tracking-wider">Inference Latency</p>
                <div className="flex gap-[2px] items-end h-6">
                  {sparklines.latency.map((height, i) => (
                    <div key={i} className="w-1 bg-tertiary/60 rounded-sm" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
              </div>
              <p className="text-2xl font-bold text-tertiary">{avgLatency}ms</p>
              <p className="text-[10px] text-on-surface-variant mt-1">XGBoost + Isolation Forest inference</p>
            </div> */}
          </div>
        </div>
      </section>

      {/* ========== SECTION 3: CAMPAIGN INTELLIGENCE (UPGRADED) ========== */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Campaign Intelligence</h2>
            <p className="font-body-md text-on-surface-variant">ML-powered attribution and fraud-filtered metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {/* Campaign Card 1 - Summer Sale 2024 */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 hover:border-primary/50 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <h3 className="font-title-lg text-title-lg">{campaignsData.summer.name}</h3>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">more_vert</span>
            </div>

            {/* Fraud Risk Indicator */}
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-xs text-green-500 font-label-md">Low Fraud Risk</span>
              </div>
            </div>

            <p className="text-xs font-label-md text-on-surface-variant mb-2 tracking-wider uppercase">{campaignsData.summer.type} • {campaignsData.summer.channel}</p>

            {/* Bid Strategy Badge */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded border border-primary/50 text-primary">{campaignsData.summer.bidStrategy}</span>
              {campaignsData.summer.targetDemo.map((demo, idx) => (
                <span key={idx} className="px-2 py-0.5 text-[10px] font-bold rounded bg-surface-dim text-on-surface-variant">{demo}</span>
              ))}
            </div>

            {/* Fraud-Filtered Clicks Row */}
            <div className="mb-4 p-3 bg-surface-container rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-label-md text-on-surface-variant">Clicks Validation</span>
                <span className="material-symbols-outlined text-sm text-primary">verified</span>
              </div>
              <div className="flex justify-between items-baseline">
                <div>
                  <p className="text-[10px] text-on-surface-variant">Raw Clicks</p>
                  <p className="text-sm font-mono text-on-surface-variant">{campaignsData.summer.rawClicks.toLocaleString()}</p>
                </div>
                <span className="text-on-surface-variant">→</span>
                <div>
                  <p className="text-[10px] text-green-500">Clean Clicks</p>
                  <p className="text-sm font-mono text-green-500">{campaignsData.summer.cleanClicks.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">bug_report</span>
                    Filtered
                  </p>
                  <p className="text-sm font-mono text-error">-{campaignsData.summer.fraudFiltered.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-label-md">
                  <span className="text-on-surface-variant">Spend Progress</span>
                  <span className="text-on-surface">${campaignsData.summer.spend.toLocaleString()} / ${campaignsData.summer.budget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${(campaignsData.summer.spend / campaignsData.summer.budget) * 100}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-[10px] font-label-md text-on-surface-variant uppercase">ROAS</p>
                  <p className="text-lg font-bold text-tertiary">{campaignsData.summer.roas}x</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-xs text-green-500">arrow_upward</span>
                    <span className="text-[10px] text-green-500">{campaignsData.summer.roasDelta}</span>
                    <span className="text-[10px] text-on-surface-variant">vs last week</span>
                  </div>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-[10px] font-label-md text-on-surface-variant uppercase">CPA</p>
                  <p className="text-lg font-bold text-primary">${campaignsData.summer.cpa}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-xs text-green-500">arrow_downward</span>
                    <span className="text-[10px] text-green-500">{campaignsData.summer.cpaDelta}</span>
                    <span className="text-[10px] text-on-surface-variant">vs last week</span>
                  </div>
                </div>
              </div>
            </div>

            
          </div>

          

          {/* Campaign Card 2 - Back to School */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 hover:border-primary/50 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <h3 className="font-title-lg text-title-lg">{campaignsData.backToSchool.name}</h3>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">more_vert</span>
            </div>

            {/* Fraud Risk Indicator */}
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span className="text-xs text-amber-500 font-label-md">Medium Fraud Risk</span>
              </div>
            </div>

            <p className="text-xs font-label-md text-on-surface-variant mb-2 tracking-wider uppercase">{campaignsData.backToSchool.type} • {campaignsData.backToSchool.channel}</p>

            {/* Bid Strategy Badge */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded border border-primary/50 text-primary">{campaignsData.backToSchool.bidStrategy}</span>
              {campaignsData.backToSchool.targetDemo.map((demo, idx) => (
                <span key={idx} className="px-2 py-0.5 text-[10px] font-bold rounded bg-surface-dim text-on-surface-variant">{demo}</span>
              ))}
            </div>

            {/* Fraud-Filtered Clicks Row */}
            <div className="mb-4 p-3 bg-surface-container rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-label-md text-on-surface-variant">Clicks Validation</span>
                <span className="material-symbols-outlined text-sm text-amber-500">warning</span>
              </div>
              <div className="flex justify-between items-baseline">
                <div>
                  <p className="text-[10px] text-on-surface-variant">Raw Clicks</p>
                  <p className="text-sm font-mono text-on-surface-variant">{campaignsData.backToSchool.rawClicks.toLocaleString()}</p>
                </div>
                <span className="text-on-surface-variant">→</span>
                <div>
                  <p className="text-[10px] text-green-500">Clean Clicks</p>
                  <p className="text-sm font-mono text-green-500">{campaignsData.backToSchool.cleanClicks.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">bug_report</span>
                    Filtered
                  </p>
                  <p className="text-sm font-mono text-error">-{campaignsData.backToSchool.fraudFiltered.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-label-md">
                  <span className="text-on-surface-variant">Spend Progress</span>
                  <span className="text-on-surface">${campaignsData.backToSchool.spend.toLocaleString()} / ${campaignsData.backToSchool.budget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${(campaignsData.backToSchool.spend / campaignsData.backToSchool.budget) * 100}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Reach</p>
                  <p className="text-lg font-bold text-tertiary">{campaignsData.backToSchool.reach}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-xs text-green-500">arrow_upward</span>
                    <span className="text-[10px] text-green-500">{campaignsData.backToSchool.reachDelta}</span>
                    <span className="text-[10px] text-on-surface-variant">vs last week</span>
                  </div>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Engagement</p>
                  <p className="text-lg font-bold text-primary">{campaignsData.backToSchool.engagement}%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-xs text-green-500">arrow_upward</span>
                    <span className="text-[10px] text-green-500">{campaignsData.backToSchool.engagementDelta}</span>
                    <span className="text-[10px] text-on-surface-variant">vs last week</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Card 3 - Holiday Prep 2024 */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-on-surface-variant rounded-full"></span>
                <h3 className="font-title-lg text-title-lg">{campaignsData.holiday.name}</h3>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">more_vert</span>
            </div>

            {/* Fraud Risk Indicator */}
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-xs text-green-500 font-label-md">Low Fraud Risk</span>
              </div>
            </div>

            <p className="text-xs font-label-md text-on-surface-variant mb-2 tracking-wider uppercase">{campaignsData.holiday.type} • {campaignsData.holiday.channel}</p>

            {/* Bid Strategy Badge */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded border border-primary/50 text-primary">{campaignsData.holiday.bidStrategy}</span>
              {campaignsData.holiday.targetDemo.map((demo, idx) => (
                <span key={idx} className="px-2 py-0.5 text-[10px] font-bold rounded bg-surface-dim text-on-surface-variant">{demo}</span>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-label-md">
                  <span className="text-on-surface-variant">Scheduled Start</span>
                  <span className="text-on-surface">{campaignsData.holiday.startDate}</span>
                </div>
                <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden">
                  <div className="bg-outline-variant h-full rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 pt-2">
                <div className="p-3 bg-surface-container rounded-lg flex justify-between items-center">
                  <p className="text-xs font-label-md text-on-surface-variant uppercase">Budget Allocation</p>
                  <p className="text-body-md font-bold text-on-surface">${campaignsData.holiday.budget.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 4: COMPLIANCE & PERFORMANCE REPORTS (UPGRADED) ========== */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Compliance &amp; Performance Reports</h2>
            <p className="font-body-md text-on-surface-variant">Downloadable PDF summaries generated by AI</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-body-md hover:bg-surface-bright transition-colors">
              Scheduled Reports
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-6">
          {/* Report Card 1 */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-all">
            <div className="p-6 flex flex-row gap-6">
              <div className="w-24 h-32 bg-surface-dim rounded border border-outline-variant flex items-center justify-center group-hover:border-primary transition-colors shrink-0">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-primary">picture_as_pdf</span>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="font-title-lg text-title-lg mb-1">Campaign Performance Monthly</h3>
                  <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase tracking-widest">New</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-4">Comprehensive analysis of Q3 performance across all active acquisition channels, including AI attribution modeling.</p>
                <div className="flex items-center gap-4 text-[10px] font-label-md text-on-surface-variant flex-wrap">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">calendar_today</span> Sep 01, 2024</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">description</span> 24 Pages</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">database</span> 12.4 MB</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-surface-container border-t border-outline-variant flex justify-between items-center mt-auto">
              <button className="flex items-center gap-2 text-primary text-xs font-bold hover:underline">
                <span className="material-symbols-outlined text-sm">visibility</span>
                Quick Preview
              </button>
              <button className="flex items-center gap-2 bg-primary text-on-primary text-xs px-6 py-2 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-sm">download</span>
                Download PDF
              </button>
            </div>
          </div>

          {/* Report Card 2 */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-all">
            <div className="p-6 flex flex-row gap-6">
              <div className="w-24 h-32 bg-surface-dim rounded border border-outline-variant flex items-center justify-center group-hover:border-error transition-colors shrink-0">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-error">gpp_bad</span>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="font-title-lg text-title-lg mb-1">Fraud &amp; Bot Analysis Report</h3>
                  <span className="px-2 py-1 bg-tertiary/10 text-tertiary text-[10px] font-bold rounded uppercase tracking-widest">Critical</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-4">Detailed detection report of invalid traffic patterns and botnet activity identified by the AdAI Neural Guard.</p>
                <div className="flex items-center gap-4 text-[10px] font-label-md text-on-surface-variant flex-wrap">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">calendar_today</span> Aug 28, 2024</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">description</span> 18 Pages</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">database</span> 8.1 MB</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-surface-container border-t border-outline-variant flex justify-between items-center mt-auto">
              <button className="flex items-center gap-2 text-primary text-xs font-bold hover:underline">
                <span className="material-symbols-outlined text-sm">visibility</span>
                Quick Preview
              </button>
              <button className="flex items-center gap-2 bg-primary text-on-primary text-xs px-6 py-2 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-sm">download</span>
                Download PDF
              </button>
            </div>
          </div>

          {/* Report Card 3 - New ML Model Report */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-all">
            <div className="p-6 flex flex-row gap-6">
              <div className="w-24 h-32 bg-surface-dim rounded border border-outline-variant flex items-center justify-center group-hover:border-info transition-colors shrink-0">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-info">model_training</span>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="font-title-lg text-title-lg mb-1">ML Model Performance Report</h3>
                  <span className="px-2 py-1 bg-info/10 text-info text-[10px] font-bold rounded uppercase tracking-widest">Auto-Generated</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-4">XGBoost CTR model AUC-ROC tracking, LightGBM benchmarks, Isolation Forest precision/recall over last 30 days.</p>
                <div className="flex items-center gap-4 text-[10px] font-label-md text-on-surface-variant flex-wrap">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">calendar_today</span> {new Date().toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">description</span> 31 Pages</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">database</span> 9.8 MB</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-surface-container border-t border-outline-variant flex justify-between items-center mt-auto">
              <button className="flex items-center gap-2 text-primary text-xs font-bold hover:underline">
                <span className="material-symbols-outlined text-sm">visibility</span>
                Quick Preview
              </button>
              <button className="flex items-center gap-2 bg-primary text-on-primary text-xs px-6 py-2 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-sm">download</span>
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Scheduled Reports Expandable Row */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant">
            <h4 className="font-title-md text-title-md flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
              Scheduled Reports
            </h4>
          </div>
          <div className="divide-y divide-outline-variant">
            <div className="p-4 flex justify-between items-center">
              <div>
                <p className="font-body-md font-semibold text-on-surface">Daily Performance Digest</p>
                <p className="text-xs text-on-surface-variant">Daily 6:00 AM</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xs font-mono text-tertiary">in 14h 32m</p>
                <div className="w-10 h-5 bg-surface-dim rounded-full relative cursor-pointer">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-primary rounded-full transition-all"></div>
                </div>
              </div>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div>
                <p className="font-body-md font-semibold text-on-surface">Weekly Fraud Summary</p>
                <p className="text-xs text-on-surface-variant">Weekly Monday</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xs font-mono text-tertiary">in 2d 6h</p>
                <div className="w-10 h-5 bg-surface-dim rounded-full relative cursor-pointer">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-primary rounded-full transition-all"></div>
                </div>
              </div>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div>
                <p className="font-body-md font-semibold text-on-surface">ML Model Health Report</p>
                <p className="text-xs text-on-surface-variant">Monthly 1st</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xs font-mono text-tertiary">in 12d</p>
                <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-on-primary rounded-full transition-all"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 5: FRAUD DETECTION FEED + FRAUD SUMMARY ========== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Left Panel - Fraud Detection Feed */}
        <div className="lg:col-span-2 bg-[#050507] border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <h3 className="font-title-lg text-title-lg text-on-surface">Fraud Detection Feed</h3>
              </div>
              <span className="px-2 py-1 bg-red-500/20 text-red-500 text-[10px] font-bold rounded uppercase tracking-wider">ACTIVE</span>
            </div>
            <span className="text-[10px] font-mono text-on-surface-variant">Real-time • Isolation Forest v3.2</span>
          </div>

          <div ref={fraudFeedEndRef} className="h-[400px] overflow-y-auto space-y-2 p-4">
            {fraudEvents.map((event, idx) => (
              <div key={event.id} className="bg-surface-container/50 border border-outline-variant rounded-lg p-3 hover:bg-surface-container transition-all animate-fadeIn">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-on-surface-variant">{event.timestamp}</span>
                    <span className="font-mono text-xs text-primary">{event.ip}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getFraudColor(event.score)}`}></div>
                      <span className="text-xs font-mono text-on-surface-variant">{getFraudScoreLabel(event.score)}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${event.action === 'Blocked' ? 'bg-red-500/20 text-red-500' :
                      event.action === 'Flagged' ? 'bg-amber-500/20 text-amber-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>{event.action}</span>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-on-surface-variant">Fraud Score</span>
                    <span className="font-mono text-on-surface">{event.score}</span>
                  </div>
                  <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden">
                    <div className={`${getFraudColor(event.score)} h-full rounded-full transition-all`} style={{ width: `${event.score * 100}%` }}></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${event.category === 'Bot Traffic' ? 'bg-red-500/20 text-red-500' :
                      event.category === 'Click Farm' ? 'bg-amber-500/20 text-amber-500' :
                        event.category === 'Suspicious Human' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-green-500/20 text-green-500'
                      }`}>{event.category}</span>
                    <span className="text-on-surface-variant">Campaign: {event.campaign}</span>
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant">{event.device}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Fraud Summary + Automated Optimization */}
        <div className="space-y-4">
          {/* Fraud Summary */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
            <h4 className="font-title-md text-title-md mb-4">Fraud Summary — Today</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-surface-container rounded-lg">
                <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Total Blocked</p>
                <p className="text-xl font-bold text-error">{fraudBlockedToday.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-surface-container rounded-lg">
                <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Precision</p>
                <p className="text-xl font-bold text-green-500">93.2%</p>
              </div>
              <div className="p-3 bg-surface-container rounded-lg">
                <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Recall</p>
                <p className="text-xl font-bold text-info">87.6%</p>
              </div>
              <div className="p-3 bg-surface-container rounded-lg">
                <p className="text-[10px] font-label-md text-on-surface-variant uppercase">Budget Saved</p>
                <p className="text-xl font-bold text-primary">$12,440</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-label-md text-on-surface-variant">Traffic Breakdown</p>
              <div className="flex h-6 rounded-lg overflow-hidden">
                <div className="bg-green-500 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: '91.2%' }}>Clean 91.2%</div>
                <div className="bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: '5.4%' }}>Suspicious 5.4%</div>
                <div className="bg-red-500 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: '3.4%' }}>Blocked 3.4%</div>
              </div>
            </div>
          </div>

          {/* Automated Optimization */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-3">
            <h4 className="font-title-md text-title-md">Automated Optimization</h4>
            <p className="font-body-sm text-on-surface-variant text-xs">Our AI is currently managing 4 micro-adjustments per hour to maximize your ROAS.</p>

            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center p-3 bg-surface-container rounded-lg border-l-4 border-primary">
                <div>
                  <p className="text-xs font-label-md text-on-surface-variant">Last Action</p>
                  <p className="text-sm font-bold">CPC Cap Reduced</p>
                </div>
                <span className="text-xs text-on-surface-variant">2m ago</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-surface-container rounded-lg border-l-4 border-tertiary">
                <div>
                  <p className="text-xs font-label-md text-on-surface-variant">Insight Score</p>
                  <p className="text-sm font-bold">98/100 Efficiency</p>
                </div>
                <span className="material-symbols-outlined text-tertiary">bolt</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-surface-container rounded-lg border-l-4 border-info">
                <div>
                  <p className="text-xs font-label-md text-on-surface-variant">Next Scheduled Action</p>
                  <p className="text-sm font-bold">Bid Coefficient Update</p>
                </div>
                <span className="text-xs font-mono text-info">{formatCountdown(countdown)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECTION 6: ML PREDICTION INSIGHTS (SHAP) ========== */}
      <section>
        <div className="mb-6">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">ML Prediction Insights</h2>
          <p className="font-body-md text-on-surface-variant">SHAP-based feature importance for click probability predictions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {/* SHAP Card 1 - Summer Sale */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-title-lg text-title-lg">Summer Sale 2024 — Click Prediction</h3>
                <p className="text-xs text-on-surface-variant mt-1">Model: XGBoost v2.1 | AUC-ROC: 0.81</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">analytics</span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">user_interest=shopping</span>
                <div className="flex-1 mx-4 h-6 bg-surface-dim rounded relative overflow-hidden">
                  <div className="absolute right-1/2 w-[34%] h-full bg-primary rounded-r-sm"></div>
                  <div className="absolute left-1/2 w-[66%] h-full bg-surface-dim"></div>
                </div>
                <span className="font-mono text-primary">+0.34</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">device=desktop</span>
                <div className="flex-1 mx-4 h-6 bg-surface-dim rounded relative overflow-hidden">
                  <div className="absolute right-1/2 w-[21%] h-full bg-primary rounded-r-sm"></div>
                  <div className="absolute left-1/2 w-[79%] h-full bg-surface-dim"></div>
                </div>
                <span className="font-mono text-primary">+0.21</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">time_of_day=evening</span>
                <div className="flex-1 mx-4 h-6 bg-surface-dim rounded relative overflow-hidden">
                  <div className="absolute right-1/2 w-[18%] h-full bg-primary rounded-r-sm"></div>
                  <div className="absolute left-1/2 w-[82%] h-full bg-surface-dim"></div>
                </div>
                <span className="font-mono text-primary">+0.18</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">location=urban</span>
                <div className="flex-1 mx-4 h-6 bg-surface-dim rounded relative overflow-hidden">
                  <div className="absolute right-1/2 w-[12%] h-full bg-primary rounded-r-sm"></div>
                  <div className="absolute left-1/2 w-[88%] h-full bg-surface-dim"></div>
                </div>
                <span className="font-mono text-primary">+0.12</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">ad_format=video</span>
                <div className="flex-1 mx-4 h-6 bg-surface-dim rounded relative overflow-hidden">
                  <div className="absolute left-1/2 w-[9%] h-full bg-error rounded-l-sm"></div>
                  <div className="absolute right-1/2 w-[91%] h-full bg-surface-dim"></div>
                </div>
                <span className="font-mono text-error">-0.09</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-outline-variant">
              <div>
                <p className="text-[10px] text-on-surface-variant">Predicted CTR</p>
                <p className="text-xl font-bold text-tertiary">2.84%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-on-surface-variant">Last computed</p>
                <p className="text-xs font-mono text-on-surface-variant">2 min ago</p>
              </div>
              <button className="text-xs text-primary hover:underline">Recompute</button>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-3">SHAP values show each feature's contribution to click probability</p>
          </div>

          {/* SHAP Card 2 - Back to School */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-title-lg text-title-lg">Back to School — Click Prediction</h3>
                <p className="text-xs text-on-surface-variant mt-1">Model: XGBoost v2.1 | AUC-ROC: 0.79</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">analytics</span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">user_interest=education</span>
                <div className="flex-1 mx-4 h-6 bg-surface-dim rounded relative overflow-hidden">
                  <div className="absolute right-1/2 w-[38%] h-full bg-primary rounded-r-sm"></div>
                  <div className="absolute left-1/2 w-[62%] h-full bg-surface-dim"></div>
                </div>
                <span className="font-mono text-primary">+0.38</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">device=mobile</span>
                <div className="flex-1 mx-4 h-6 bg-surface-dim rounded relative overflow-hidden">
                  <div className="absolute right-1/2 w-[24%] h-full bg-primary rounded-r-sm"></div>
                  <div className="absolute left-1/2 w-[76%] h-full bg-surface-dim"></div>
                </div>
                <span className="font-mono text-primary">+0.24</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">age_group=16-24</span>
                <div className="flex-1 mx-4 h-6 bg-surface-dim rounded relative overflow-hidden">
                  <div className="absolute right-1/2 w-[19%] h-full bg-primary rounded-r-sm"></div>
                  <div className="absolute left-1/2 w-[81%] h-full bg-surface-dim"></div>
                </div>
                <span className="font-mono text-primary">+0.19</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">time_of_day=afternoon</span>
                <div className="flex-1 mx-4 h-6 bg-surface-dim rounded relative overflow-hidden">
                  <div className="absolute right-1/2 w-[11%] h-full bg-primary rounded-r-sm"></div>
                  <div className="absolute left-1/2 w-[89%] h-full bg-surface-dim"></div>
                </div>
                <span className="font-mono text-primary">+0.11</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">ad_category=apparel</span>
                <div className="flex-1 mx-4 h-6 bg-surface-dim rounded relative overflow-hidden">
                  <div className="absolute left-1/2 w-[6%] h-full bg-error rounded-l-sm"></div>
                  <div className="absolute right-1/2 w-[94%] h-full bg-surface-dim"></div>
                </div>
                <span className="font-mono text-error">-0.06</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-outline-variant">
              <div>
                <p className="text-[10px] text-on-surface-variant">Predicted CTR</p>
                <p className="text-xl font-bold text-tertiary">3.12%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-on-surface-variant">Last computed</p>
                <p className="text-xs font-mono text-on-surface-variant">1 min ago</p>
              </div>
              <button className="text-xs text-primary hover:underline">Recompute</button>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-3">SHAP values show each feature's contribution to click probability</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}