import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Dashboard() {
  // ==========================================
  // STATE MANAGEMENT FOR LIVE UPDATING WIDGETS
  // ==========================================

  // 1. Kafka Ingestion throughut & streaming sparkline (CHANGE 1)
  const [eventsRate, setEventsRate] = useState(14280)
  const [eventsHistory, setEventsHistory] = useState([14150, 14200, 14180, 14240, 14210, 14290, 14250, 14280, 14270, 14290, 14310, 14280])

  // 2. Fraud Alert Center state (CHANGE 2)
  const [fraudAlerts, setFraudAlerts] = useState([
    { id: 1, ip: '192.168.1.45', score: 0.97, category: 'Automated Clicker', status: 'Blocked', severity: 'CRITICAL', time: 'Just now' },
    { id: 2, ip: '10.24.8.12', score: 0.92, category: 'Bot Farm', status: 'Isolated', severity: 'HIGH', time: '1m ago' },
    { id: 3, ip: '172.16.5.8', score: 0.88, category: 'Click Injection', status: 'Investigating', severity: 'MEDIUM', time: '3m ago' },
    { id: 4, ip: '185.220.101.5', score: 0.95, category: 'Proxy Ingestion', status: 'Blocked', severity: 'CRITICAL', time: '5m ago' },
    { id: 5, ip: '45.22.10.87', score: 0.84, category: 'User-Agent Spoofing', status: 'Investigating', severity: 'MEDIUM', time: '8m ago' }
  ])

  // 3. CTR Performance Trend Graph state (CHANGE 3)
  const [ctrHistory, setCtrHistory] = useState([
    6.4, 6.8, 7.1, 6.9, 7.3, 7.0, 7.5, 7.8, 8.2, 8.0, 7.6, 7.9, 8.4, 8.6, 8.2, 8.8, 9.2, 9.6, 9.1, 8.7, 8.4
  ])
  const [ctrTimestamps, setCtrTimestamps] = useState([
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00'
  ])
  const [hoveredCtrPoint, setHoveredCtrPoint] = useState(null)
  const chartContainerRef = useRef(null)

  // 4. SHAP Campaign details (CHANGE 4)
  const [shapCampaign, setShapCampaign] = useState('Nike Air Max Pro')
  const shapData = {
    'Nike Air Max Pro': [
      { feature: 'Sports Interest', impact: 31, details: 'High-affinity overlap with historical premium athletics purchasers (+3.1x CTR likelihood).' },
      { feature: 'Mobile Device', impact: 18, details: 'In-app ad layout optimization for iOS/Android high-density screens (+1.8x engagement).' },
      { feature: 'Age 18-25', impact: 15, details: 'Targeting Gen-Z lifestyle segments with tailored high-energy visual creatives (+1.5x interaction).' },
      { feature: 'Mumbai Region', impact: 12, details: 'Strong geographic cluster response in metro hubs during active local events (+1.2x conversions).' },
      { feature: 'Previous Engagement', impact: 9, details: 'Re-targeting cookies from the last 7 days who visited product details page (+0.9x action).' }
    ],
    'Gaming Laptop': [
      { feature: 'Esports Affinity', impact: 28, details: 'User follows major gaming streamers or competitive titles.' },
      { feature: 'Desktop Device', impact: 22, details: 'High-performance screens suitable for high-bitrate video ads.' },
      { feature: 'Age 18-35', impact: 16, details: 'Active purchasing cohort for high-ticket hardware.' },
      { feature: 'Bangalore Region', impact: 14, details: 'Major IT tech hub geographic spike.' },
      { feature: 'High Cart Value History', impact: 10, details: 'User has bought items valued > ₹40,000 in past 90 days.' }
    ],
    'Bass Buds Pro': [
      { feature: 'Music Streaming', impact: 35, details: 'Heavy listener of Spotify, YouTube Music, or Apple Music.' },
      { feature: 'Mobile Device', impact: 20, details: 'On-the-go targeting aligned with earphone usage contexts.' },
      { feature: 'Age 15-28', impact: 18, details: 'High volume trend segment for accessories.' },
      { feature: 'Pune Region', impact: 10, details: 'Vibrant college student population hub.' },
      { feature: 'Social Commerce clicks', impact: 7, details: 'User frequently purchases via Instagram/Meta Audience network.' }
    ]
  }

  // 5. Top Performing Ads Table Upgrade (CHANGE 5)
  const [tableData, setTableData] = useState([
    { campaign: 'Nike Air Max', icon: 'shopping_bag', ctr: 12.4, clicks: 45200, revenue: 1240000, spend: 310000, roas: 4.0, fraudFiltered: 1245 },
    { campaign: 'Gaming Laptop', icon: 'computer', ctr: 10.1, clicks: 32800, revenue: 980000, spend: 280000, roas: 3.5, fraudFiltered: 840 },
    { campaign: 'Bass Buds Pro', icon: 'headphones', ctr: 9.2, clicks: 28400, revenue: 710000, spend: 220000, roas: 3.2, fraudFiltered: 920 },
  ])
  const [sortField, setSortField] = useState('ctr')
  const [sortDirection, setSortDirection] = useState('desc')

  // 6. Campaign Analytics counters state (CHANGE 6)
  const [rawClicks, setRawClicks] = useState(124567)
  const [fraudFilteredTotal, setFraudFilteredTotal] = useState(3450)
  const [conversionsTotal, setConversionsTotal] = useState(9450)
  const [revenueTotal, setRevenueTotal] = useState(420500)

  // 7. System Infrastructure Uptime (CHANGE 7)
  const [infraStatus, setInfraStatus] = useState([
    { name: 'Kafka Ingestion', status: 'Healthy', uptime: 99.98, type: 'core', lastBeat: 0 },
    { name: 'Redis Cache', status: 'Healthy', uptime: 99.99, type: 'core', lastBeat: 0 },
    { name: 'FastAPI Router', status: 'Healthy', uptime: 99.95, type: 'core', lastBeat: 0 },
    { name: 'PostgreSQL DB', status: 'Healthy', uptime: 99.99, type: 'database', lastBeat: 0 },
    { name: 'Recommendation Engine', status: 'Healthy', uptime: 99.97, type: 'ai', lastBeat: 0 },
    { name: 'Fraud Filter Engine', status: 'Healthy', uptime: 99.98, type: 'security', lastBeat: 0 }
  ])

  // 8. Pipeline Terminal Logs Upgrade (CHANGE 8)
  const [terminalLogs, setTerminalLogs] = useState([
    { time: '14:22:15', module: 'SYSTEM', msg: 'AdAI Pipeline Processor initialized v2.4.0', color: 'text-outline' },
    { time: '14:22:20', module: 'REDIS', msg: 'Cache store hot-reloaded: 18,402 active keys mapped', color: 'text-red-400' },
    { time: '14:22:25', module: 'KAFKA', msg: 'Stream consumer group: "adai-events-v2" partitions balanced', color: 'text-primary' },
    { time: '14:22:31', module: 'KAFKA', msg: 'KAFKA Producer sent 2,450 events', color: 'text-primary' },
    { time: '14:22:33', module: 'REDIS', msg: 'Redis cache hit ratio: 94.2%', color: 'text-red-400' },
    { time: '14:22:36', module: 'FRAUD', msg: 'Fraud Engine flagged 24 events from AS-South endpoints', color: 'text-[#ffb783]' },
    { time: '14:22:39', module: 'CTR_AI', msg: 'CTR Prediction generated dynamically for Shard APAC-1', color: 'text-secondary' },
    { time: '14:22:42', module: 'RECO', msg: 'Recommendation Engine served 320 ads (latency 14ms)', color: 'text-green-400' },
    { time: '14:22:45', module: 'SHAP', msg: 'SHAP explanation generated for campaign ID: #NikeAirPro', color: 'text-yellow-200' }
  ])
  const terminalEndRef = useRef(null)

  // 9. Geographic traffic hotspots interactive state (CHANGE 9)
  const [hoveredCity, setHoveredCity] = useState(null)
  const [citiesData, setCitiesData] = useState({
    'Mumbai': { traffic: '94%', fraud: '2.4% (Low)', conversions: '12.8% (High)', color: 'text-green-400', topCampaign: 'Nike Air Max' },
    'Delhi': { traffic: '88%', fraud: '14.2% (High)', conversions: '8.1% (Medium)', color: 'text-[#ffb783]', topCampaign: 'Bass Buds Pro' },
    'Bangalore': { traffic: '91%', fraud: '1.8% (Low)', conversions: '16.4% (Critical)', color: 'text-green-400', topCampaign: 'Gaming Laptop' },
    'Pune': { traffic: '76%', fraud: '3.1% (Low)', conversions: '10.2% (High)', color: 'text-green-400', topCampaign: 'Nike Air Max' },
    'Hyderabad': { traffic: '82%', fraud: '6.5% (Medium)', conversions: '11.5% (High)', color: 'text-green-400', topCampaign: 'Gaming Laptop' },
    'Chennai': { traffic: '78%', fraud: '2.2% (Low)', conversions: '9.0% (Medium)', color: 'text-[#ffb783]', topCampaign: 'Bass Buds Pro' }
  })

  // 10. AI Executive Summary dynamic insights (CHANGE 10)
  const [executiveSummary] = useState({
    insightText: "Platform recommendation: Ad budget allocation shift from Delhi towards Bangalore & Mumbai is currently yielding an exceptional +3.2x local ROAS boost.",
    insightsList: [
      { text: "CTR increased 12.4% over previous period.", trend: "+12.4%", status: "up" },
      { text: "Fraud traffic reduced by 18% globally.", trend: "-18.0%", status: "down" },
      { text: "Recommendation Engine generated ₹4.2L additional revenue.", trend: "+₹4.2L", status: "up" },
      { text: "Top audience segment: Urban Mobile Users (18-25)", trend: "64.5%", status: "neutral" },
      { text: "System operating at 99.98% pipeline health.", trend: "99.98%", status: "up" }
    ]
  })

  // ==========================================
  // SIMULATION LOOPS FOR REAL-TIME UPDATES
  // ==========================================

  // Kafka Throughput & Counters Sim
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Throughput fluctuation
      const delta = Math.floor(Math.random() * 150) - 70 // -70 to 80
      setEventsRate(prev => {
        const next = prev + delta
        const bounded = next < 13500 ? 13500 : next > 15000 ? 15000 : next
        setEventsHistory(h => {
          const nextHistory = [...h.slice(1), bounded]
          return nextHistory
        })
        return bounded
      })

      // 6. Campaign Analytics counters incrementing
      const clickInc = Math.floor(Math.random() * 4) + 1 // +1 to +4
      setRawClicks(prev => prev + clickInc)

      const fraudInc = Math.random() < 0.2 ? 1 : 0 // 20% chance of +1
      setFraudFilteredTotal(prev => prev + fraudInc)

      const convInc = Math.random() < 0.4 ? 1 : 0 // 40% chance of +1
      setConversionsTotal(prev => prev + convInc)

      const revInc = Math.floor(Math.random() * 350) + 50 // +₹50 to +₹400
      setRevenueTotal(prev => prev + revInc)

      // 7. Infra heartbeats
      setInfraStatus(prev =>
        prev.map(service => {
          const beat = Math.random() < 0.7 ? 0 : Math.min(service.lastBeat + 1, 9)
          return { ...service, lastBeat: beat }
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // CTR Performance Live Chart Updater (every 5 seconds)
  useEffect(() => {
    const chartInterval = setInterval(() => {
      setCtrHistory(prev => {
        const lastVal = prev[prev.length - 1]
        // Random walk around last value
        const shift = parseFloat((Math.random() * 0.6 - 0.25).toFixed(2)) // bias positive
        const nextVal = Math.max(5.5, Math.min(13.5, parseFloat((lastVal + shift).toFixed(2))))
        
        // Push timestamp
        const timeNow = new Date()
        const timeString = timeNow.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        
        setCtrTimestamps(t => [...t.slice(1), timeString])
        return [...prev.slice(1), nextVal]
      })
    }, 5000)

    return () => clearInterval(chartInterval)
  }, [])

  // Fraud Alert Center updates (every 7 seconds)
  useEffect(() => {
    const ipPool = [
      '185.120.44.12', '94.23.102.89', '210.45.166.4', '172.56.9.110', 
      '195.154.122.9', '43.250.241.15', '203.190.150.8'
    ]
    const catPool = [
      { cat: 'Bot Farm Ingestion', status: 'Isolated', severity: 'HIGH' },
      { cat: 'Click Injection Spill', status: 'Blocked', severity: 'CRITICAL' },
      { cat: 'Automated Clicker', status: 'Blocked', severity: 'CRITICAL' },
      { cat: 'Residential Proxy Abuse', status: 'Investigating', severity: 'MEDIUM' },
      { cat: 'User-Agent Hijack', status: 'Isolated', severity: 'HIGH' }
    ]

    const alertInterval = setInterval(() => {
      const randomIp = ipPool[Math.floor(Math.random() * ipPool.length)]
      const randomCat = catPool[Math.floor(Math.random() * catPool.length)]
      const score = parseFloat((0.80 + Math.random() * 0.19).toFixed(2)) // 0.80 to 0.99
      
      const newAlert = {
        id: Date.now(),
        ip: randomIp,
        score,
        category: randomCat.cat,
        status: randomCat.status,
        severity: randomCat.severity,
        time: 'Just now'
      }

      setFraudAlerts(prev => {
        // Increment times of old items slightly for UI realism
        const updated = prev.map(a => {
          if (a.time === 'Just now') return { ...a, time: '1m ago' }
          if (a.time === '1m ago') return { ...a, time: '3m ago' }
          if (a.time === '3m ago') return { ...a, time: '6m ago' }
          if (a.time === '6m ago') return { ...a, time: '10m ago' }
          return a
        })
        return [newAlert, ...updated.slice(0, 5)]
      })
    }, 7000)

    return () => clearInterval(alertInterval)
  }, [])

  // Terminal logs simulation (every 4 seconds)
  useEffect(() => {
    const logPool = [
      { module: 'KAFKA', msg: 'KAFKA Producer sent 2,450 events to partition #4', color: 'text-primary' },
      { module: 'REDIS', msg: 'Redis cache hit ratio: 94.2% (14,482 lookups)', color: 'text-red-400' },
      { module: 'FRAUD', msg: 'Fraud Engine flagged 24 events from proxy IPs', color: 'text-[#ffb783]' },
      { module: 'CTR_AI', msg: 'CTR Prediction generated and pushed to routing broker', color: 'text-secondary' },
      { module: 'RECO', msg: 'Recommendation Engine served 320 ads to Meta Audience partner', color: 'text-green-400' },
      { module: 'SHAP', msg: 'SHAP explanation generated for campaign ID: #NikeAirPro', color: 'text-yellow-200' },
      { module: 'KAFKA', msg: 'Topic "adai-impressions" throughput: 4.8MB/sec', color: 'text-primary' },
      { module: 'SYSTEM', msg: 'Neural inference model compiled successfully in 12ms', color: 'text-outline' },
      { module: 'FRAUD', msg: 'Ip block list synchronized with CloudStrike security agent', color: 'text-[#ffb783]' }
    ]

    const logInterval = setInterval(() => {
      const timeNow = new Date()
      const timeString = timeNow.toLocaleTimeString('en-GB', { hour12: false })
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)]

      setTerminalLogs(prev => {
        const next = [...prev, { time: timeString, ...randomLog }]
        return next.length > 25 ? next.slice(next.length - 25) : next
      })
    }, 4000)

    return () => clearInterval(logInterval)
  }, [])

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight
    }
  }, [terminalLogs])

  // ==========================================
  // HELPERS AND UTILITIES
  // ==========================================

  // Sort helper for table (CHANGE 5)
  const sortedTableData = [...tableData].sort((a, b) => {
    let valA = a[sortField]
    let valB = b[sortField]
    if (sortDirection === 'asc') {
      return valA > valB ? 1 : -1
    } else {
      return valA < valB ? 1 : -1
    }
  })

  const requestSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Event stream sparkline generator (CHANGE 1)
  const getSparklinePath = (data) => {
    const min = Math.min(...data) - 10
    const max = Math.max(...data) + 10
    const range = max - min || 1
    return data.map((val, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 40 - ((val - min) / range) * 35 - 2
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(' ')
  }

  // Interactive CTR Trend Curve Generator (CHANGE 3)
  const generateCurvePath = (data, w, h) => {
    const min = 5.0
    const max = 14.0
    const range = max - min
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((val - min) / range) * (h - 30) - 15
      return { x, y }
    })

    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const cpX1 = p0.x + (p1.x - p0.x) / 2
      const cpY1 = p0.y
      const cpX2 = p0.x + (p1.x - p0.x) / 2
      const cpY2 = p1.y
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`
    }
    return { lineD: d, areaD: `${d} L ${w} ${h} L 0 ${h} Z`, points }
  }

  const handleChartMouseMove = (e) => {
    if (!chartContainerRef.current) return
    const rect = chartContainerRef.current.getBoundingClientRect()
    const containerWidth = rect.width
    const relativeX = e.clientX - rect.left
    
    // Find nearest point
    const { points } = generateCurvePath(ctrHistory, containerWidth, 180)
    let nearestIndex = 0
    let minDistance = Infinity
    
    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - relativeX)
      if (dist < minDistance) {
        minDistance = dist
        nearestIndex = idx
      }
    })

    const tooltipX = Math.min(points[nearestIndex].x, containerWidth - 130)
    const tooltipY = Math.max(10, points[nearestIndex].y - 65)

    setHoveredCtrPoint({
      idx: nearestIndex,
      x: points[nearestIndex].x,
      y: points[nearestIndex].y,
      val: ctrHistory[nearestIndex],
      time: ctrTimestamps[nearestIndex],
      tooltipX,
      tooltipY
    })
  }

  const handleChartMouseLeave = () => {
    setHoveredCtrPoint(null)
  }

  const activeCtr = ctrHistory[ctrHistory.length - 1]
  const avgCtr = (ctrHistory.reduce((a, b) => a + b, 0) / ctrHistory.length).toFixed(2)
  const peakCtr = Math.max(...ctrHistory).toFixed(1)

  return (
    <div className="space-y-stack-lg max-w-full overflow-hidden">
      
      {/* ==========================================
          KPI CARDS GRID
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-stack-lg">
        {/* Total Clicks */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-2 hover:border-primary/50 transition-all group relative overflow-hidden">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase">Total Clicks</span>
          <div className="flex items-baseline justify-between">
            <span className="font-label-md text-headline-md font-black">
              {rawClicks.toLocaleString()}
            </span>
            <span className="text-primary font-label-md text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span>+12%
            </span>
          </div>
          <div className="h-12 w-full mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d="M0 30 Q10 25 20 28 T40 15 T60 25 T80 5 T100 20" fill="none" stroke="#c0c1ff" strokeWidth="2"></path>
            </svg>
          </div>
        </div>

        {/* CTR */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-2 hover:border-primary/50 transition-all group relative overflow-hidden">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase">CTR</span>
          <div className="flex items-baseline justify-between">
            <span className="font-label-md text-headline-md font-black text-on-surface">{activeCtr}%</span>
            <span className="text-primary font-label-md text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span>+1.2%
            </span>
          </div>
          <div className="h-12 w-full mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d="M0 35 Q20 30 40 32 T60 20 T80 25 T100 10" fill="none" stroke="#c0c1ff" strokeWidth="2"></path>
            </svg>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-2 hover:border-primary/50 transition-all group relative overflow-hidden">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase">Active Users</span>
          <div className="flex items-baseline justify-between">
            <span className="font-label-md text-headline-md font-black text-on-surface">{conversionsTotal * 1.3}</span>
            <span className="text-primary font-label-md text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span>+7.6%
            </span>
          </div>
          <div className="h-12 w-full mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d="M0 38 Q25 35 50 20 T75 15 T100 5" fill="none" stroke="#c0c1ff" strokeWidth="2"></path>
            </svg>
          </div>
        </div>

        {/* Fraud Score */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-2 hover:border-primary/50 transition-all group relative overflow-hidden">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase">Fraud Score</span>
          <div className="flex items-baseline justify-between">
            <span className="font-label-md text-headline-md font-black text-[#ffb783]">LOW RISK</span>
            <span className="text-on-surface-variant font-label-md text-xs">23/100</span>
          </div>
          <div className="h-12 w-full mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d="M0 10 Q25 15 50 18 T75 22 T100 25" fill="none" stroke="#ffb783" strokeWidth="2"></path>
            </svg>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-2 hover:border-primary/50 transition-all group relative overflow-hidden">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase">Revenue</span>
          <div className="flex items-baseline justify-between">
            <span className="font-label-md text-headline-md font-black text-on-surface">₹{(revenueTotal/100000).toFixed(2)}L</span>
            <span className="text-primary font-label-md text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span>+18%
            </span>
          </div>
          <div className="h-12 w-full mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d="M0 35 Q20 38 40 30 T60 15 T80 10 T100 2" fill="none" stroke="#c0c1ff" strokeWidth="2"></path>
            </svg>
          </div>
        </div>

        {/* Events/sec (CHANGE 1) */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-2 hover:border-primary/50 transition-all group relative overflow-hidden">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase flex items-center gap-1.5">
            Events/sec
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-label-md text-headline-md font-black text-on-surface font-mono">
              {eventsRate.toLocaleString()}
            </span>
            <span className="text-green-400 font-label-md text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span>+18%
            </span>
          </div>
          <span className="text-[10px] text-on-surface-variant -mt-1 font-mono uppercase tracking-tighter">Kafka Event Throughput</span>
          <div className="h-8 w-full mt-2 opacity-85 group-hover:opacity-100 transition-opacity">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d={getSparklinePath(eventsHistory)} fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* ==========================================
          AI EXECUTIVE SUMMARY & CTR TREND ROW
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        {/* Executive Summary Card (CHANGE 10) */}
        <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
          {/* Cyberpunk ambient top light */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">psychology</span>
              <h3 className="font-title-lg text-title-lg text-on-surface">AI Executive Summary</h3>
            </div>
            <div className="space-y-4">
              {executiveSummary.insightsList.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 p-2 bg-surface-container-low/40 rounded-lg hover:bg-surface-container-low transition-colors">
                  <div className="flex gap-2">
                    <span className="material-symbols-outlined text-sm text-primary mt-0.5">done_all</span>
                    <p className="text-xs font-medium leading-relaxed">{item.text}</p>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full ${
                    item.status === 'up' ? 'text-green-400 bg-green-500/10' :
                    item.status === 'down' ? 'text-error bg-error/10' : 'text-primary bg-primary/10'
                  }`}>
                    {item.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 p-3 bg-primary/5 rounded-lg border border-primary/20 flex gap-2 items-start">
            <span className="material-symbols-outlined text-sm text-primary mt-0.5">info</span>
            <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed font-mono">
              {executiveSummary.insightText}
            </p>
          </div>
        </div>

        {/* CTR Performance Trend Large Line Graph (CHANGE 3) */}
        <div className="lg:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-title-lg text-title-lg text-on-surface">CTR Performance Trend</h3>
              <p className="text-xs text-on-surface-variant font-mono">CTR vs Time (Last 24 Hours, Live updating every 5s)</p>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Current CTR</span>
                <span className="text-lg font-black text-primary font-mono">{activeCtr}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Average CTR</span>
                <span className="text-lg font-black text-on-surface font-mono">{avgCtr}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Peak CTR</span>
                <span className="text-lg font-black text-[#ffb783] font-mono">{peakCtr}%</span>
              </div>
            </div>
          </div>

          {/* SVG Interactive Line Chart */}
          <div 
            ref={chartContainerRef}
            className="flex-1 w-full h-[180px] relative bg-surface-container-low/30 border border-outline-variant/30 rounded-lg overflow-hidden cursor-crosshair"
            onMouseMove={handleChartMouseMove}
            onMouseLeave={handleChartMouseLeave}
          >
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 py-8">
              <div className="w-full border-t border-outline-variant/15"></div>
              <div className="w-full border-t border-outline-variant/15"></div>
              <div className="w-full border-t border-outline-variant/15"></div>
            </div>

            {/* Custom SVG Render */}
            <svg className="w-full h-full p-2" preserveAspectRatio="none" viewBox="0 0 500 180">
              <defs>
                <linearGradient id="chartGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgba(192, 193, 255, 0.25)', stopOpacity: 1 }}></stop>
                  <stop offset="100%" style={{ stopColor: 'rgba(192, 193, 255, 0)', stopOpacity: 1 }}></stop>
                </linearGradient>
                <filter id="shadowGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#8083ff" floodOpacity="0.45" />
                </filter>
              </defs>

              {/* Curve path */}
              <path 
                d={generateCurvePath(ctrHistory, 500, 180).areaD} 
                fill="url(#chartGlow)"
              />
              <path 
                d={generateCurvePath(ctrHistory, 500, 180).lineD} 
                fill="none" 
                stroke="#c0c1ff" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                filter="url(#shadowGlow)"
              />

              {/* Hover Indicator Vertical Line & Dot */}
              {hoveredCtrPoint && (
                <>
                  <line 
                    x1={hoveredCtrPoint.x} 
                    y1="0" 
                    x2={hoveredCtrPoint.x} 
                    y2="180" 
                    stroke="rgba(192, 193, 255, 0.4)" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 4" 
                  />
                  <circle 
                    cx={hoveredCtrPoint.x} 
                    cy={hoveredCtrPoint.y} 
                    r="5" 
                    fill="#c0c1ff" 
                    stroke="#13131a" 
                    strokeWidth="2" 
                    className="shadow-[0_0_10px_#8083ff]"
                  />
                </>
              )}
            </svg>

            {/* Custom Interactive Tooltip (CHANGE 3) */}
            {hoveredCtrPoint && (
              <div 
                className="absolute z-30 pointer-events-none bg-surface-container-high/95 border border-outline rounded-lg p-2.5 shadow-2xl text-[11px] font-mono w-[120px]"
                style={{ 
                  left: `${hoveredCtrPoint.tooltipX}px`, 
                  top: `${hoveredCtrPoint.tooltipY}px` 
                }}
              >
                <div className="text-on-surface-variant font-bold">Time: {hoveredCtrPoint.time}</div>
                <div className="text-primary font-extrabold text-sm mt-0.5">CTR: {hoveredCtrPoint.val.toFixed(2)}%</div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-3 text-[10px] text-on-surface-variant font-mono font-bold">
            <span>24h Ago</span>
            <span>-18h</span>
            <span>-12h</span>
            <span>-6h</span>
            <span>Live Trend</span>
          </div>
        </div>
      </div>

      {/* ==========================================
          MIDDLE GRID ROW (CAMPAIGN ANALYTICS, ADS TABLE, MAP)
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        {/* Campaign Analytics Widget (CHANGE 6) */}
        <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">analytics</span>
              <h3 className="font-title-lg text-title-lg text-on-surface">Campaign Analytics</h3>
            </div>
            <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[10px] font-mono text-green-400 font-bold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Streaming
            </div>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {/* Raw Clicks */}
            <div className="bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Raw Clicks</span>
                <p className="text-lg font-black mt-0.5 font-mono">{rawClicks.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className="text-green-400 text-xs font-bold flex items-center font-mono justify-end">
                  <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span>+12.4%
                </span>
                <span className="text-[9px] text-on-surface-variant font-mono block">In last hour</span>
              </div>
            </div>

            {/* Fraud Filtered Clicks */}
            <div className="bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Fraud Filtered Clicks</span>
                <p className="text-lg font-black text-[#ffb783] mt-0.5 font-mono">{fraudFilteredTotal.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className="text-green-400 text-xs font-bold flex items-center font-mono justify-end">
                  <span className="material-symbols-outlined text-[12px] mr-0.5">trending_down</span>-18.2%
                </span>
                <span className="text-[9px] text-on-surface-variant font-mono block">Active mitigation</span>
              </div>
            </div>

            {/* Effective CTR */}
            <div className="bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">Effective CTR</span>
                <p className="text-lg font-black text-primary mt-0.5 font-mono">{((rawClicks / (rawClicks + 1400000)) * 100).toFixed(2)}%</p>
              </div>
              <div className="text-right">
                <span className="text-green-400 text-xs font-bold flex items-center font-mono justify-end">
                  <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span>+1.8%
                </span>
                <span className="text-[9px] text-on-surface-variant font-mono block">Optimal performance</span>
              </div>
            </div>

            {/* Conversions & Revenue Combined */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/20">
                <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider block">Conversions</span>
                <span className="text-base font-black font-mono mt-0.5 block">{conversionsTotal.toLocaleString()}</span>
              </div>
              <div className="bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/20">
                <span className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider block">Est. Revenue</span>
                <span className="text-base font-black text-green-400 font-mono mt-0.5 block">₹{(revenueTotal/100000).toFixed(2)}L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Ads Table Upgrade (CHANGE 5) */}
        <div className="lg:col-span-5 bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex flex-col justify-between group">
          <div>
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-title-lg text-title-lg text-on-surface">Top Performing Ads</h3>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant">
                Sort Enabled
              </span>
            </div>
            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-surface-container-low/60 border-b border-outline-variant">
                    <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('campaign')}>
                      Campaign {sortField === 'campaign' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('ctr')}>
                      CTR {sortField === 'ctr' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('clicks')}>
                      Clicks {sortField === 'clicks' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('revenue')}>
                      Revenue {sortField === 'revenue' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('spend')}>
                      Spend {sortField === 'spend' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('roas')}>
                      ROAS {sortField === 'roas' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-on-surface-variant uppercase font-mono tracking-wider text-right cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('fraudFiltered')}>
                      Fraud Clicks {sortField === 'fraudFiltered' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  <AnimatePresence initial={false}>
                    {sortedTableData.map((row) => (
                      <motion.tr 
                        layout 
                        key={row.campaign}
                        className="hover:bg-surface-container-high transition-colors text-xs font-mono font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center text-primary">
                              <span className="material-symbols-outlined text-[13px]">{row.icon}</span>
                            </div>
                            <span className="font-semibold text-on-surface">{row.campaign}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-primary">{row.ctr}%</td>
                        <td className="px-4 py-3 text-right">{(row.clicks / 1000).toFixed(1)}k</td>
                        <td className="px-4 py-3 text-right text-green-400">₹{(row.revenue/100000).toFixed(1)}L</td>
                        <td className="px-4 py-3 text-right text-on-surface-variant">₹{(row.spend/100000).toFixed(1)}L</td>
                        <td className="px-4 py-3 text-right text-tertiary">{row.roas}x</td>
                        <td className="px-4 py-3 text-right text-error">{row.fraudFiltered.toLocaleString()}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-3 bg-surface-container-low/40 border-t border-outline-variant/30 text-[10px] text-on-surface-variant font-mono font-medium flex justify-between">
            <span>Showing top 3 production active campaigns</span>
            <span>Real-time tracking enabled</span>
          </div>
        </div>

        {/* Global Traffic & Geographic Hotspots Enhancements (CHANGE 9) */}
        <div className="lg:col-span-3 bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex flex-col justify-between group relative">
          <div className="px-6 py-4 border-b border-outline-variant">
            <h3 className="font-title-lg text-title-lg text-on-surface">Geographic Traffic</h3>
          </div>
          <div className="flex-1 relative bg-surface-container-low p-4 overflow-hidden min-h-[220px] flex items-center justify-center">
            {/* Ambient grid bg */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(circle, #c0c1ff 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
            </div>

            {/* India High-Tech Map Layout with pulsing interactive markers */}
            <div className="relative h-full w-full max-w-[200px] aspect-[4/5] flex items-center justify-center">
              {/* Futuristic Vector Representation of India Outline or Nodes Grid */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none pointer-events-none">
                <svg className="w-full h-full text-outline-variant" viewBox="0 0 100 120" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M45 5 L55 10 L65 25 L85 30 L80 40 L70 50 L60 65 L55 85 L50 115 L45 85 L35 70 L25 55 L15 45 L10 30 L20 20 L35 15 Z" />
                </svg>
              </div>

              {/* Hotspot Markers (Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai) */}
              {/* Mumbai */}
              <button 
                onMouseEnter={() => setHoveredCity('Mumbai')}
                onMouseLeave={() => setHoveredCity(null)}
                className="absolute top-[50%] left-[25%] w-3 h-3 bg-green-400 rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[0_0_8px_#4ade80] z-20 group/marker"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
              </button>

              {/* Delhi */}
              <button 
                onMouseEnter={() => setHoveredCity('Delhi')}
                onMouseLeave={() => setHoveredCity(null)}
                className="absolute top-[25%] left-[45%] w-3.5 h-3.5 bg-error rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[0_0_8px_#ffb4ab] z-20 group/marker"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-60"></span>
              </button>

              {/* Bangalore */}
              <button 
                onMouseEnter={() => setHoveredCity('Bangalore')}
                onMouseLeave={() => setHoveredCity(null)}
                className="absolute top-[70%] left-[38%] w-3 h-3 bg-green-400 rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[0_0_8px_#4ade80] z-20 group/marker"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
              </button>

              {/* Pune */}
              <button 
                onMouseEnter={() => setHoveredCity('Pune')}
                onMouseLeave={() => setHoveredCity(null)}
                className="absolute top-[55%] left-[30%] w-2 h-2 bg-green-400 rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[0_0_6px_#4ade80] z-20 group/marker"
              >
              </button>

              {/* Hyderabad */}
              <button 
                onMouseEnter={() => setHoveredCity('Hyderabad')}
                onMouseLeave={() => setHoveredCity(null)}
                className="absolute top-[60%] left-[45%] w-2.5 h-2.5 bg-green-400 rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[0_0_6px_#4ade80] z-20 group/marker"
              >
              </button>

              {/* Chennai */}
              <button 
                onMouseEnter={() => setHoveredCity('Chennai')}
                onMouseLeave={() => setHoveredCity(null)}
                className="absolute top-[72%] left-[48%] w-2.5 h-2.5 bg-[#ffb783] rounded-full cursor-pointer hover:scale-125 transition-transform shadow-[0_0_6px_#ffb783] z-20 group/marker"
              >
              </button>

              {/* Static Labels overlay */}
              <div className="absolute top-[20%] left-[58%] text-[8px] font-mono font-bold opacity-60 pointer-events-none">Delhi (Hotspot)</div>
              <div className="absolute top-[48%] left-[2%] text-[8px] font-mono font-bold opacity-60 pointer-events-none">Mumbai</div>
              <div className="absolute top-[75%] left-[20%] text-[8px] font-mono font-bold opacity-60 pointer-events-none">BLR</div>
            </div>

            {/* City interactive stats hover tooltip */}
            {hoveredCity && (
              <div className="absolute top-2 left-2 right-2 bg-surface-container-high/95 border border-outline rounded-lg p-2 shadow-2xl z-30 text-[10px] font-mono leading-relaxed">
                <div className="font-extrabold text-xs text-primary mb-1 uppercase tracking-wider">{hoveredCity} Hub</div>
                <div className="flex justify-between"><span>Traffic Vol:</span><span className="font-bold text-on-surface">{citiesData[hoveredCity].traffic}</span></div>
                <div className="flex justify-between"><span>Fraud Rate:</span><span className="font-bold text-error">{citiesData[hoveredCity].fraud}</span></div>
                <div className="flex justify-between"><span>Conv Rate:</span><span className={`font-bold ${citiesData[hoveredCity].color}`}>{citiesData[hoveredCity].conversions}</span></div>
                <div className="flex justify-between border-t border-outline-variant/30 mt-1 pt-1"><span>Top Segment:</span><span className="font-bold text-tertiary">{citiesData[hoveredCity].topCampaign}</span></div>
              </div>
            )}
          </div>

          <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 text-[8px] font-mono uppercase bg-surface-container-high/60 backdrop-blur-sm p-1.5 rounded border border-outline-variant/30 pointer-events-none">
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> High Conv</div>
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ffb783]"></span> Mid</div>
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-error"></span> Fraud Spill</div>
          </div>
        </div>
      </div>

      {/* ==========================================
          BOTTOM ROW (PIPELINE MONITOR, FRAUD ALERT CENTER)
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        {/* Pipeline Monitor Terminal Upgrade (CHANGE 8) */}
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
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
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

        {/* Fraud Alert Center Widget (CHANGE 2) */}
        <div className="lg:col-span-6 bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex flex-col h-[320px] relative group">
          {/* Cyberstrike branding border */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-error/40"></div>
          
          <div className="px-6 py-3 bg-surface-container flex items-center justify-between border-b border-outline-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-xl animate-bounce">security</span>
              <h3 className="font-title-lg text-title-lg text-on-surface">Fraud Alert Center</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-error font-mono font-bold bg-error/10 px-2 py-0.5 rounded border border-error/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span> MITIGATION SHIELD ON
              </span>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-2 terminal-scroll bg-[#0b0b10]">
            <AnimatePresence initial={false}>
              {fraudAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -30, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 30, height: 0 }}
                  transition={{ duration: 0.35 }}
                  className="bg-surface-container-low/60 border border-outline-variant/30 hover:border-error/30 p-2.5 rounded-lg flex items-center justify-between gap-4 transition-all hover:bg-surface-container-high/40 group/row"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      alert.severity === 'CRITICAL' ? 'bg-error-container/20 text-error' : 'bg-tertiary-container/20 text-[#ffb783]'
                    }`}>
                      <span className="material-symbols-outlined text-sm">
                        {alert.severity === 'CRITICAL' ? 'gpp_bad' : 'warning'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-extrabold text-on-surface">{alert.ip}</span>
                        <span className="text-[9px] font-bold font-mono px-1 bg-error/15 text-error rounded border border-error/10 uppercase tracking-tighter">
                          Score {alert.score}
                        </span>
                      </div>
                      <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                        {alert.category} · <span className="font-bold text-on-surface">{alert.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                      alert.status === 'Blocked' ? 'bg-error-container/40 text-error border border-error/20' : 
                      alert.status === 'Isolated' ? 'bg-tertiary-container/30 text-tertiary border border-tertiary/20' : 
                      'bg-outline/10 text-on-surface-variant border border-outline/20'
                    }`}>
                      {alert.status}
                    </span>
                    <span className="text-[9px] text-on-surface-variant font-mono block">{alert.time}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ==========================================
          EXPLAINABLE AI, INFRA HEALTH & AI RECOMMENDATIONS
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        {/* Explainable AI (SHAP) Insights Panel (CHANGE 4) */}
        <div className="lg:col-span-5 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">neurology</span>
                <h3 className="font-title-lg text-title-lg text-on-surface">Why This Ad Was Recommended</h3>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container-high border border-outline-variant p-1 rounded-lg">
                {Object.keys(shapData).map((campaign) => (
                  <button
                    key={campaign}
                    onClick={() => setShapCampaign(campaign)}
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-1 rounded transition-all ${
                      shapCampaign === campaign ? 'bg-primary text-on-primary shadow' : 'hover:bg-surface-bright text-on-surface-variant'
                    }`}
                  >
                    {campaign.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-on-surface-variant mb-5 font-mono">
              Campaign Model target: <span className="font-bold text-on-surface">{shapCampaign}</span> · SHAP Feature Contribution values (Transparency index: 94.8% reliable)
            </p>

            <div className="space-y-4">
              {shapData[shapCampaign].map((row, idx) => (
                <div key={idx} className="relative group/bar cursor-help">
                  <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                    <span className="text-on-surface flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      {row.feature}
                    </span>
                    <span className="text-green-400 font-extrabold">+{row.impact}%</span>
                  </div>
                  {/* Contribution bar */}
                  <div className="w-full bg-surface-container-low border border-outline-variant/30 h-2.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${row.impact * 2.5}%` }} 
                      transition={{ duration: 0.6 }}
                      className="h-full bg-primary rounded-full shadow-[0_0_8px_#8083ff]" 
                    />
                  </div>
                  
                  {/* Explanatory hovering tooltip */}
                  <div className="absolute left-0 right-0 -top-12 z-20 hidden group-hover/bar:block bg-surface-container-high border border-outline rounded-lg p-2 text-[10px] font-mono leading-relaxed shadow-2xl">
                    <div className="text-primary font-bold">{row.feature} Impact:</div>
                    <div className="text-on-surface-variant">{row.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-surface-container-low/40 rounded-lg border border-outline-variant/30 text-[10px] text-on-surface-variant font-mono font-medium mt-6 flex gap-2">
            <span className="material-symbols-outlined text-sm text-primary">visibility</span>
            <span>SHAP (SHapley Additive exPlanations) computes contribution weightings directly from the model's neural network shards.</span>
          </div>
        </div>

        {/* System Infrastructure Health Widget (CHANGE 7) */}
        <div className="lg:col-span-3 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl animate-spin" style={{ animationDuration: '4s' }}>settings</span>
                <h3 className="font-title-lg text-title-lg text-on-surface">Infrastructure Health</h3>
              </div>
              <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 font-bold">
                OPERATIONAL
              </span>
            </div>

            <div className="space-y-3.5">
              {infraStatus.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-mono font-bold hover:bg-surface-container-low/30 p-1 rounded transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${service.lastBeat === 0 ? 'bg-green-400' : 'bg-green-500'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${service.lastBeat === 0 ? 'bg-green-400' : 'bg-green-500'}`}></span>
                    </span>
                    <span className="text-on-surface">{service.name}</span>
                  </div>
                  
                  <div className="text-right flex items-center gap-3">
                    <span className="text-[9px] text-on-surface-variant font-medium">Uptime: <span className="font-bold text-on-surface">{service.uptime}%</span></span>
                    <span className="text-[8px] bg-surface-container-high px-1 py-0.5 rounded border border-outline-variant text-outline select-none">
                      {service.lastBeat}s ago
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-surface-container-low/40 rounded-lg border border-outline-variant/30 text-[10px] text-on-surface-variant font-mono font-medium mt-4">
            <div className="flex justify-between border-b border-outline-variant/20 pb-1 mb-1">
              <span>Avg Latency (P99):</span>
              <span className="font-bold text-primary">14.2ms</span>
            </div>
            <div className="flex justify-between">
              <span>Sync heartbeat:</span>
              <span className="font-bold text-green-400">ACKNOWLEDGED</span>
            </div>
          </div>
        </div>

        {/* AI Smart Recommendations (Existing, styled perfectly) */}
        <div className="lg:col-span-4 flex flex-col gap-stack-lg justify-between">
          <div className="grid grid-cols-2 gap-4 flex-1">
            {[
              {
                icon: 'psychology', iconColor: 'text-primary', badge: 'High Impact', badgeBg: 'bg-primary/10', badgeColor: 'text-primary',
                title: 'Scale "Nike Summer"', desc: 'Predicted ROI uplift of +14.2% if budget increases by 20%.', btnColor: 'text-primary', btnLabel: 'Apply Optimization', glow: true
              },
              {
                icon: 'warning', iconColor: 'text-[#ffb783]', badge: 'Budget Alert', badgeBg: 'bg-[#ffb783]/10', badgeColor: 'text-[#ffb783]',
                title: 'Keyword Exhaustion', desc: '"Best sneakers 2024" CPC rising. Shift focus to "Running Gear".', btnColor: 'text-[#ffb783]', btnLabel: 'Update Keywords'
              },
              {
                icon: 'groups', iconColor: 'text-secondary', badge: 'Audience', badgeBg: 'bg-secondary/10', badgeColor: 'text-secondary',
                title: 'New Segment Found', desc: "High engagement detected in 'Amateur Marathon' group (Ages 25-34).", btnColor: 'text-secondary', btnLabel: 'Target Group'
              },
              {
                icon: 'speed', iconColor: 'text-on-surface', badge: 'Performance', badgeBg: 'bg-on-surface/10', badgeColor: 'text-on-surface',
                title: 'Load Time Warning', desc: "Landing page 'SummerPromo-1' is slow (3.2s). CTR risk.", btnColor: 'text-on-surface', btnLabel: 'Fix Issues'
              },
            ].map((card, i) => (
              <div key={i} className={`bg-surface-container-high/40 border border-outline-variant rounded-xl p-4 hover:bg-surface-container-high transition-all flex flex-col justify-between ${card.glow ? 'border-primary/50' : ''}`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`material-symbols-outlined text-sm ${card.iconColor}`}>{card.icon}</span>
                    <span className={`px-2 py-0.5 rounded-full ${card.badgeBg} ${card.badgeColor} text-[8px] font-bold uppercase`}>{card.badge}</span>
                  </div>
                  <h4 className="font-semibold text-xs mb-1">{card.title}</h4>
                  <p className="text-[10px] leading-relaxed text-on-surface-variant">{card.desc}</p>
                </div>
                <button className={`${card.btnColor} text-[10px] font-bold mt-2 flex items-center gap-1 hover:underline justify-end`}>
                  {card.btnLabel} <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  )
}
