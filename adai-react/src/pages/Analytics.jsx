import { useState, useEffect, useRef, useCallback } from 'react'

// ─── helpers ──────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min
const randInt = (min, max) => Math.floor(rand(min, max + 1))
const fmt = (d) =>
  d.toLocaleTimeString('en-GB', { hour12: false })
const nowLabel = () => {
  const d = new Date()
  const now = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' })
  return now
}
const currentMonthRange = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = d.getMonth()
  const first = new Date(y, m, 1)
  const last = new Date(y, m + 1, 0)
  const opts = { day: '2-digit', month: 'short', year: 'numeric' }
  return `${first.toLocaleDateString('en-IN', opts)} – ${last.toLocaleDateString('en-IN', opts)}`
}

// ─── static data ──────────────────────────────────────────────────────────────
const FRAUD_TYPES = ['Bot Clicks', 'Click Farm', 'Suspicious Human', 'Domain Spoofing', 'IP Rotation', 'Proxy Traffic', 'Invalid Referral']
const FRAUD_IPS = ['103.21.44.', '192.168.', '45.33.32.', '172.16.4.', '10.0.0.', '185.220.', '91.108.']
const DEVICE_IDS = ['AND-7x92B', 'IOS-4kR21', 'WEB-9mP44', 'BOT-0xDE4F', 'AND-2sQ88', 'IOS-6jK15', 'EMU-1xA00']

const genFraudEntry = () => {
  const types = FRAUD_TYPES
  const type = types[randInt(0, types.length - 1)]
  const score =
    type === 'Bot Clicks' ? parseFloat(rand(0.88, 0.99).toFixed(2))
    : type === 'Click Farm' ? parseFloat(rand(0.75, 0.90).toFixed(2))
    : type === 'Domain Spoofing' ? parseFloat(rand(0.82, 0.95).toFixed(2))
    : type === 'Clean Traffic' ? parseFloat(rand(0.01, 0.10).toFixed(2))
    : parseFloat(rand(0.45, 0.75).toFixed(2))
  const ip = FRAUD_IPS[randInt(0, FRAUD_IPS.length - 1)] + randInt(1, 254)
  const device = DEVICE_IDS[randInt(0, DEVICE_IDS.length - 1)]
  const action = score > 0.8 ? 'Blocked' : score > 0.5 ? 'Flagged' : 'Allowed'
  return { ts: fmt(new Date()), ip, device, score, category: type, action, id: Math.random() }
}

const INITIAL_FRAUD = [
  { ts: '11:28:44', ip: '103.21.44.17', device: 'BOT-0xDE4F', score: 0.97, category: 'Bot Clicks', action: 'Blocked', id: 1 },
  { ts: '11:27:11', ip: '45.33.32.89', device: 'EMU-1xA00', score: 0.83, category: 'Click Farm', action: 'Blocked', id: 2 },
  { ts: '11:25:03', ip: '172.16.4.201', device: 'AND-7x92B', score: 0.61, category: 'Suspicious Human', action: 'Flagged', id: 3 },
  { ts: '11:22:57', ip: '192.168.1.45', device: 'IOS-4kR21', score: 0.04, category: 'Clean Traffic', action: 'Allowed', id: 4 },
  { ts: '11:19:30', ip: '185.220.101.4', device: 'WEB-9mP44', score: 0.91, category: 'Domain Spoofing', action: 'Blocked', id: 5 },
]

const CAMPAIGNS = [
  { name: 'Nike Shoes Q4', advertiser: 'Nike', raw: 45821, filtered: 44203, ctr: 3.2, spend: '₹4,20,000', roas: 4.8, status: 'Active' },
  { name: 'Gaming Laptop Deal', advertiser: 'Asus', raw: 31440, filtered: 28991, ctr: 2.7, spend: '₹2,80,000', roas: 3.1, status: 'Active' },
  { name: 'FinTech App Install', advertiser: 'Groww', raw: 18220, filtered: 17104, ctr: 1.9, spend: '₹1,50,000', roas: 2.4, status: 'Paused' },
  { name: 'Sports Nutrition', advertiser: 'MuscleBlaze', raw: 12005, filtered: 11888, ctr: 4.1, spend: '₹95,000', roas: 6.2, status: 'Active' },
  { name: 'Travel Booking', advertiser: 'MakeMyTrip', raw: 8440, filtered: 6201, ctr: 1.1, spend: '₹75,000', roas: 1.8, status: 'At Risk' },
]

const TOP_ADS = [
  { rank: 1, name: 'Nike Air Max Summer', category: 'Footwear', ctr: 4.8, revenue: '₹1,20,000', color: 'text-yellow-400' },
  { rank: 2, name: 'ASUS ROG Laptop Deal', category: 'Electronics', ctr: 3.9, revenue: '₹98,000', color: 'text-slate-300' },
  { rank: 3, name: 'Groww Invest Now', category: 'FinTech', ctr: 3.2, revenue: '₹76,000', color: 'text-orange-400' },
  { rank: 4, name: 'MuscleBlaze Whey', category: 'Nutrition', ctr: 2.8, revenue: '₹54,000', color: 'text-purple-400' },
  { rank: 5, name: 'Noise ColorFit Pro', category: 'Wearables', ctr: 2.1, revenue: '₹41,000', color: 'text-blue-400' },
]

const MAX_CTR_BAR = 4.8

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
function LiveCTRChart({ dataPoints }) {
  const W = 560
  const H = 200
  const PAD = { top: 16, right: 20, bottom: 36, left: 44 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const minY = 1.5
  const maxY = 3.8

  const toX = (i) => PAD.left + (i / (dataPoints.length - 1)) * chartW
  const toY = (v) => PAD.top + chartH - ((v - minY) / (maxY - minY)) * chartH

  const pts = dataPoints.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')

  const targetY = toY(2.5)

  // Y-axis ticks
  const yTicks = [1.8, 2.2, 2.5, 3.0, 3.4]
  // X-axis labels: every 5th point
  const xLabels = dataPoints
    .map((_, i) => i)
    .filter((i) => i % 5 === 0 || i === dataPoints.length - 1)

  const current = dataPoints[dataPoints.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left} y1={toY(t)} x2={W - PAD.right} y2={toY(t)}
            stroke="#2a2a3a" strokeWidth="1" strokeDasharray="4 4"
          />
          <text x={PAD.left - 6} y={toY(t) + 4} textAnchor="end" fontSize="9" fill="#6b6b8a">
            {t.toFixed(1)}%
          </text>
        </g>
      ))}

      {/* Target line (dashed gray) */}
      <line
        x1={PAD.left} y1={targetY} x2={W - PAD.right} y2={targetY}
        stroke="#555577" strokeWidth="1.5" strokeDasharray="6 3"
      />
      <text x={W - PAD.right + 4} y={targetY + 4} fontSize="9" fill="#555577">Target</text>

      {/* Area fill under CTR line */}
      {dataPoints.length > 1 && (
        <>
          <defs>
            <linearGradient id="ctrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#571bc1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#571bc1" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          <polygon
            points={`${pts} ${toX(dataPoints.length - 1)},${H - PAD.bottom} ${PAD.left},${H - PAD.bottom}`}
            fill="url(#ctrGrad)"
          />
          {/* CTR line */}
          <polyline
            points={pts}
            fill="none"
            stroke="#571bc1"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ transition: 'points 0.5s ease' }}
          />
          {/* Live dot */}
          <circle
            cx={toX(dataPoints.length - 1)}
            cy={toY(current)}
            r="5"
            fill="#571bc1"
            stroke="#c0c1ff"
            strokeWidth="2"
          />
        </>
      )}

      {/* X-axis labels */}
      {xLabels.map((i) => (
        <text key={i} x={toX(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="8" fill="#6b6b8a">
          {new Date(Date.now() - (dataPoints.length - 1 - i) * 5000).toLocaleTimeString('en-GB', { hour12: false })}
        </text>
      ))}

      {/* X-axis baseline */}
      <line
        x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom}
        stroke="#2a2a3a" strokeWidth="1"
      />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Analytics() {

  // ── KPI state ──
  const [activeUsers, setActiveUsers] = useState(1240)
  const [eventsPerSec, setEventsPerSec] = useState(14200)
  const [bidLatency, setBidLatency] = useState(42)
  const [fraudRate, setFraudRate] = useState(3.2)

  const [prevUsers, setPrevUsers] = useState(1240)
  const [prevEvents, setPrevEvents] = useState(14200)
  const [prevLatency, setPrevLatency] = useState(42)
  const [prevFraud, setPrevFraud] = useState(3.2)

  // ── CTR chart state ──
  const [ctrPoints, setCtrPoints] = useState(() =>
    Array.from({ length: 20 }, () => parseFloat(rand(1.8, 3.4).toFixed(2)))
  )
  const [currentCTR, setCurrentCTR] = useState(2.84)

  // ── Fraud table state ──
  const [fraudLog, setFraudLog] = useState(INITIAL_FRAUD)

  // ── Campaign sort ──
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  // ── Terminal logs ──
  const [logs, setLogs] = useState([
    { time: '14:31:02', msg: 'Initializing AdAI Neural Processor v4.2.1...', type: 'sys' },
    { time: '14:31:05', msg: 'Connecting to global data nodes [IN-WEST, IN-EAST, AS-SOUTH]...', type: 'info' },
    { time: '14:31:09', msg: 'Scanning campaign ID #8921-X for anomalies...', status: 'OK', type: 'info' },
    { time: '14:31:14', msg: 'Processing 14.2k events/second. Memory usage: 4.2GB / 32GB.', type: 'info' },
    { time: '14:31:20', msg: "Detected positive sentiment shift in 'Tech Gadgets' segment (+18.4%).", type: 'insight' },
  ])
  const terminalEndRef = useRef(null)

  // ── WebSocket simulation ──
  // In production replace this URL: ws://adai-realtime.internal/analytics-stream
  const [wsConnected] = useState(true)

  // ─── KPI intervals ────────────────────────────────────────────────────────
  useEffect(() => {
    // Active users — every 3s
    const u = setInterval(() => {
      setActiveUsers(prev => { setPrevUsers(prev); return prev + randInt(-5, 5) })
    }, 3000)
    // Events/sec — every 2s
    const e = setInterval(() => {
      setEventsPerSec(prev => { setPrevEvents(prev); return prev + randInt(-200, 200) })
    }, 2000)
    // Bid latency — every 4s
    const l = setInterval(() => {
      setBidLatency(prev => { setPrevLatency(prev); return Math.max(30, prev + randInt(-3, 3)) })
    }, 4000)
    // Fraud rate — every 5s
    const f = setInterval(() => {
      setFraudRate(prev => { setPrevFraud(prev); return parseFloat(Math.max(0, prev + rand(-0.1, 0.1)).toFixed(1)) })
    }, 5000)
    return () => { clearInterval(u); clearInterval(e); clearInterval(l); clearInterval(f) }
  }, [])

  // ─── CTR chart interval ───────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const v = parseFloat(rand(1.8, 3.4).toFixed(2))
      setCurrentCTR(v)
      setCtrPoints(prev => {
        const next = [...prev.slice(1), v]
        return next
      })
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // ─── Fraud log interval ───────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setFraudLog(prev => {
        const entry = genFraudEntry()
        const next = [entry, ...prev]
        return next.length > 8 ? next.slice(0, 8) : next
      })
    }, 8000)
    return () => clearInterval(id)
  }, [])

  // ─── WebSocket simulation interval ───────────────────────────────────────
  useEffect(() => {
    // Simulated WebSocket — replace URL with: ws://adai-realtime.internal/analytics-stream
    const wsInterval = setInterval(() => {
      const v = parseFloat(rand(1.8, 3.4).toFixed(2))
      setCurrentCTR(v)
      setActiveUsers(prev => prev + randInt(-5, 5))
      setEventsPerSec(prev => prev + randInt(-200, 200))
      setFraudRate(prev => parseFloat(Math.max(0, prev + rand(-0.05, 0.05)).toFixed(1)))
    }, 5000)
    return () => clearInterval(wsInterval)
  }, [])

  // ─── Terminal log interval ────────────────────────────────────────────────
  useEffect(() => {
    const phrases = [
      { type: 'info', msg: 'Recalculating geo-conversion rates for IN-West sector.' },
      { type: 'sys', msg: 'Refreshed client-side state cache. Ingestion buffer clean.' },
      { type: 'insight', msg: 'CTR prediction engine reports 94.2% stability on "FinTech & Crypto".' },
      { type: 'alert', msg: 'High latency detected on node APAC-2. Re-routing traffic.' },
      { type: 'info', msg: 'Synced reports payload schema to AWS S3 bucket us-east-1.' },
      { type: 'fraud', msg: 'Bot cluster detected: 47 events from subnet 103.21.x.x flagged and blocked.' },
      { type: 'fraud', msg: 'Isolation Forest model flagged anomaly — session entropy score: 0.03.' },
      { type: 'fraud', msg: 'XGBoost fraud classifier: campaign #8921-X shows 2.3% invalid click rate.' },
      { type: 'insight', msg: 'Bid optimization: raising floor price on Tier-1 placements by ₹0.08 CPM.' },
      { type: 'sys', msg: 'Neural bidder retrained on last 24h auction data. Delta: +1.2% win-rate.' },
    ]
    const id = setInterval(() => {
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false })
      const phrase = phrases[Math.floor(Math.random() * phrases.length)]
      setLogs(prev => {
        const next = [...prev, { time, msg: phrase.msg, type: phrase.type }]
        return next.length > 12 ? next.slice(next.length - 12) : next
      })
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // ─── Terminal scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight
    }
  }, [logs])

  // ─── Campaign sort ────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }
  const sortedCampaigns = [...CAMPAIGNS].sort((a, b) => {
    if (!sortKey) return 0
    return sortDir === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]
  })

  // ─── Derived helpers ──────────────────────────────────────────────────────
  const kpiTrend = (cur, prev) => cur >= prev
  const trendBadge = (cur, prev, suffix = '') => {
    const up = cur >= prev
    const delta = Math.abs(cur - prev)
    return (
      <span className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
        {up ? '▲' : '▼'} {typeof delta === 'number' && delta % 1 !== 0 ? delta.toFixed(1) : delta}{suffix}
      </span>
    )
  }

  const fraudScoreColor = (s) => s > 0.8 ? 'text-red-400' : s > 0.5 ? 'text-orange-400' : 'text-emerald-400'
  const fraudScoreBg = (s) => s > 0.8 ? 'bg-red-500/10 border border-red-500/30 text-red-400' : s > 0.5 ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
  const actionChip = (a) => {
    if (a === 'Blocked') return 'bg-red-500/10 border border-red-500/30 text-red-400'
    if (a === 'Flagged') return 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
    return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
  }
  const roasColor = (r) => r > 3 ? 'text-emerald-400' : r >= 2 ? 'text-yellow-400' : 'text-red-400'
  const statusColor = (s) =>
    s === 'Active' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
    : s === 'Paused' ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
    : 'bg-red-500/10 border border-red-500/30 text-red-400'
  const sortIcon = (key) => {
    if (sortKey !== key) return <span className="material-symbols-outlined text-[14px] opacity-30">unfold_more</span>
    return sortDir === 'asc'
      ? <span className="material-symbols-outlined text-[14px] text-primary">arrow_upward</span>
      : <span className="material-symbols-outlined text-[14px] text-primary">arrow_downward</span>
  }

  return (
    <div className="space-y-gutter">
      {/* ── Keyframe animations ──────────────────────────────────────────── */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .terminal-cursor {
          display: inline-block;
          width: 8px;
          height: 12px;
          background: #571bc1;
          animation: blink 1.1s step-end infinite;
          vertical-align: middle;
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform: scale(1); }
          50% { opacity:0.5; transform: scale(1.4); }
        }
        .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
        @keyframes ws-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(52,211,153,0); }
        }
        .ws-dot { animation: ws-pulse 2s ease infinite; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════
          LIVE KPI STRIP
      ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Users */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[20px]">group</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-label-md truncate">Active Users</p>
            <p className="text-2xl font-black text-on-surface leading-tight">{activeUsers.toLocaleString('en-IN')}</p>
            {trendBadge(activeUsers, prevUsers)}
          </div>
        </div>
        {/* Events / sec */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-400 text-[20px]">electric_bolt</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-label-md truncate">Events / sec</p>
            <p className="text-2xl font-black text-on-surface leading-tight">{eventsPerSec.toLocaleString('en-IN')}</p>
            {trendBadge(eventsPerSec, prevEvents)}
          </div>
        </div>
        {/* Avg Bid Latency */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-orange-400 text-[20px]">timer</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-label-md truncate">Avg Bid Latency</p>
            <p className="text-2xl font-black text-on-surface leading-tight">{bidLatency}ms</p>
            {trendBadge(bidLatency, prevLatency, 'ms')}
          </div>
        </div>
        {/* Fraud Rate */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-red-400 text-[20px]">security</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-label-md truncate">Fraud Rate</p>
            <p className="text-2xl font-black text-on-surface leading-tight">{fraudRate.toFixed(1)}%</p>
            {trendBadge(fraudRate, prevFraud, '%')}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TOOLBAR HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-on-surface-variant font-body-md">Deep-dive into performance metrics and AI-driven growth signals.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live WS Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high rounded border border-outline-variant text-xs font-bold">
            <span
              className="ws-dot inline-block w-2 h-2 rounded-full bg-emerald-400"
            />
            <span className="text-emerald-400">LIVE</span>
          </div>
          {/* Date range */}
          <div className="flex items-center bg-surface-container-high rounded px-3 py-2 border border-outline-variant text-sm font-medium cursor-pointer">
            <span className="material-symbols-outlined mr-2 text-primary">calendar_month</span>
            {currentMonthRange()}
            <span className="material-symbols-outlined ml-2">expand_more</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-outline-variant rounded hover:bg-surface-bright transition-all text-sm font-medium">
            <span className="material-symbols-outlined text-sm">compare_arrows</span>
            Compare
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded hover:brightness-110 transition-all text-sm font-bold shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-sm">download</span>
            Export
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BENTO GRID
      ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-gutter">

        {/* 1. Live CTR Line Chart (replaces Traffic Trend bar) */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-on-surface font-bold text-title-lg">Live CTR Trend</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/15 border border-primary/30 text-primary rounded-full">LIVE</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">Rolling 20-point click-through rate window</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-primary leading-none">{currentCTR.toFixed(2)}%</p>
              <p className="text-xs text-on-surface-variant mt-1">CTR</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-3 h-3 rounded-full bg-primary inline-block" />
              CTR
            </div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#555577" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
              Target 2.5%
            </div>
          </div>
          <div className="h-52">
            <LiveCTRChart dataPoints={ctrPoints} />
          </div>
        </div>

        {/* 2. Click Distribution */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6">
          <h3 className="text-on-surface font-bold mb-4 text-title-lg">Click Distribution</h3>
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#571bc1" strokeDasharray="60, 100" strokeWidth="4"></path>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#c0c1ff" strokeDasharray="40, 100" strokeDashoffset="-60" strokeWidth="4"></path>
              </svg>
              <div className="absolute text-center">
                <span className="block font-bold text-lg">12.4K</span>
                <span className="text-[10px] text-on-surface-variant uppercase">Total</span>
              </div>
            </div>
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs"><span className="text-on-surface-variant">Search Ads</span><span className="font-bold text-primary">60%</span></div>
              <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden"><div className="bg-primary h-full w-[60%]"></div></div>
              <div className="flex justify-between text-xs pt-2"><span className="text-on-surface-variant">Social Media</span><span className="font-bold text-secondary">40%</span></div>
              <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden"><div className="bg-secondary h-full w-[40%]"></div></div>
            </div>
          </div>
        </div>

        {/* 3. Engagement */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-on-surface font-bold text-title-lg">Engagement</h3>
              <p className="text-xs text-on-surface-variant">Avg. Session Duration</p>
            </div>
            <span className="text-[#ffb783] font-bold text-lg">+12.4%</span>
          </div>
          <div className="h-32 flex items-center justify-center border-b border-outline-variant/30 mb-4">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgba(192, 193, 255, 0.3)', stopOpacity: 1 }}></stop>
                  <stop offset="100%" style={{ stopColor: 'rgba(192, 193, 255, 0)', stopOpacity: 1 }}></stop>
                </linearGradient>
              </defs>
              <path d="M0 35 Q10 20 20 25 T40 10 T60 30 T80 5 T100 20" fill="none" stroke="#c0c1ff" strokeWidth="2"></path>
              <path d="M0 35 Q10 20 20 25 T40 10 T60 30 T80 5 T100 20 V40 H0 Z" fill="url(#grad1)"></path>
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-[10px] text-on-surface-variant uppercase">Scroll Depth</p><p className="text-lg font-bold">78%</p></div>
            <div><p className="text-[10px] text-on-surface-variant uppercase">Hover Ratio</p><p className="text-lg font-bold">14.2%</p></div>
          </div>
        </div>

        {/* 4. Device Split */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-surface-container-low border border-outline-variant rounded-xl p-6">
          <h3 className="text-on-surface font-bold mb-6 text-title-lg">Device Split</h3>
          <div className="space-y-4">
            {[
              { icon: 'smartphone', color: 'text-primary', label: 'Mobile', val: '64.5%', barColor: 'bg-primary', barW: '64.5%' },
              { icon: 'laptop', color: 'text-secondary', label: 'Desktop', val: '32.1%', barColor: 'bg-secondary', barW: '32.1%' },
              { icon: 'tablet', color: 'text-tertiary', label: 'Tablet', val: '3.4%', barColor: 'bg-tertiary', barW: '3.4%' },
            ].map((d, i) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><span className={`material-symbols-outlined ${d.color} text-sm`}>{d.icon}</span><span className="text-sm">{d.label}</span></div>
                  <span className="text-sm font-bold">{d.val}</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-1">
                  <div className={`${d.barColor} h-full`} style={{ width: d.barW }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Top Performing Ads */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-low border border-outline-variant rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-[20px]">workspace_premium</span>
            <h3 className="text-on-surface font-bold text-title-lg">Top Performing Ads</h3>
          </div>
          <div className="space-y-4">
            {TOP_ADS.map((ad) => (
              <div key={ad.rank} className="flex items-center gap-3">
                <span className={`text-xl font-black w-6 shrink-0 ${ad.color}`}>{ad.rank}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-on-surface truncate pr-2">{ad.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-high border border-outline-variant rounded text-on-surface-variant shrink-0">{ad.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${(ad.ctr / MAX_CTR_BAR) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold font-mono text-primary shrink-0">{ad.ctr}%</span>
                    <span className="text-[10px] text-on-surface-variant font-mono shrink-0">{ad.revenue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Global Reach */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/20">
            <h3 className="text-on-surface font-bold text-title-lg">Global Reach</h3>
            <span className="text-xs font-label-md px-2 py-0.5 bg-surface-container-high rounded border border-outline-variant">LIVE</span>
          </div>
          <div className="flex-1 relative min-h-[200px] bg-surface-container-highest/20">
            <img
              className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBD-xRM8v_mnFNnMo3Mm5OshU7vX77618yUkHA-5wAVg-G4t9vTFTXy30L2dVxi00PKGm1PFwuuKYv-JFuvGVEYpO7H7PTmA_FaS9Hw_hbDts_DITN0QftSRTSyfZDtZtPW6M-uOmn9m9qcJ0v-pB0QKM64NX0ny_ecEmSILlFvoHbWva4hVnhd5yTmpUSBm3mmm97bHdALBNR8pdSMj6ggIc_mRTaXzIGz_NEuVVmzvHr0p6HLlG4uo0xwHNuzbYarGkaxRzkoGPfQ"
              alt="Global reach map"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4 h-4 bg-primary rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2 text-xs font-medium">
            {[['India', '38%'], ['United States', '22%'], ['Germany', '12%'], ['Japan', '9%']].map(([country, pct]) => (
              <div key={country} className="flex justify-between p-2 bg-surface-container-high/50 rounded"><span>{country}</span><span className="font-bold">{pct}</span></div>
            ))}
          </div>
        </div>

        {/* 7. AI Growth Prediction */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6 ai-active">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">psychology</span>
            <h3 className="text-on-surface font-bold text-title-lg">AI Growth Prediction</h3>
          </div>
          <div className="flex items-center justify-center gap-12 py-4">
            <div className="text-center relative">
              <svg className="w-24 h-24 -rotate-90">
                <circle cx="48" cy="48" fill="none" r="40" stroke="#34343c" strokeWidth="8"></circle>
                <circle cx="48" cy="48" fill="none" r="40" stroke="#c0c1ff" strokeDasharray="251" strokeDashoffset="25" strokeWidth="8"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black">92%</span>
                <span className="text-[8px] uppercase tracking-widest text-on-surface-variant font-mono">Accuracy</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-surface-container-lowest rounded-lg border border-primary/20">
              <p className="text-xs text-primary font-bold">Recommendation</p>
              <p className="text-sm mt-1">Increase ad spend in "Technology" interest group by 15% for optimal ROI.</p>
            </div>
          </div>
        </div>

        {/* 8. User Interests */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6">
          <h3 className="text-on-surface font-bold mb-6 text-title-lg">User Interests</h3>
          <div className="space-y-5">
            {[
              { label: 'FinTech & Crypto', val: '88%', color: 'bg-primary', w: '88%', shadow: 'shadow-[0_0_8px_rgba(192,193,255,0.4)]' },
              { label: 'SaaS & Cloud', val: '72%', color: 'bg-secondary', w: '72%' },
              { label: 'AI Research', val: '64%', color: 'bg-tertiary', w: '64%' },
              { label: 'Digital Nomadism', val: '45%', color: 'bg-outline', w: '45%' },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>{item.label}</span>
                  <span className="font-mono">{item.val}</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full">
                  <div className={`${item.color} h-full rounded-full ${item.shadow || ''}`} style={{ width: item.w }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 9. Conversion Funnel */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6">
          <h3 className="text-on-surface font-bold mb-8 text-title-lg">Conversion Funnel</h3>
          <div className="space-y-1">
            {[
              { label: 'Impressions', val: '1.2M', indent: 'ml-0', bg: 'bg-primary/20', border: 'border-primary' },
              { label: 'Clicks', val: '45.8K', indent: 'ml-4', bg: 'bg-primary/30', border: 'border-primary/60' },
              { label: 'Add to Cart', val: '12.2K', indent: 'ml-8', bg: 'bg-primary/50', border: 'border-primary/40' },
              { label: 'Purchases', val: '2.4K', indent: 'ml-12', bg: 'bg-primary', border: 'border-primary/20', valColor: 'text-primary' },
            ].map((row, i) => (
              <div key={i} className={`flex items-center ${row.indent}`}>
                <div className={`flex-1 ${row.bg} h-12 flex items-center px-4 rounded-l-lg border-l-4 ${row.border}`}>
                  <span className="text-sm font-bold">{row.label}</span>
                </div>
                <div className={`w-24 text-right pr-4 font-mono font-bold ${row.valColor || ''}`}>{row.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 10. Engagement Heatmap */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container/20">
            <h3 className="text-on-surface font-bold text-title-lg">Engagement Heatmap</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-surface-container-high rounded text-xs font-bold border border-primary">Clicks</button>
              <button className="px-3 py-1 bg-surface-container-low rounded text-xs font-bold border border-outline-variant">Scroll</button>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] relative" style={{ background: '#050507' }}>
            <div className="absolute inset-0 overflow-hidden opacity-40">
              <div className="absolute top-[20%] left-[30%] w-32 h-32 bg-primary blur-3xl rounded-full opacity-60"></div>
              <div className="absolute top-[40%] left-[60%] w-48 h-48 bg-error blur-[64px] rounded-full opacity-40"></div>
              <div className="absolute top-[10%] left-[80%] w-24 h-24 bg-tertiary blur-3xl rounded-full opacity-30"></div>
              <div className="absolute bottom-[20%] left-[10%] w-56 h-56 bg-secondary blur-[80px] rounded-full opacity-20"></div>
            </div>
            <div className="absolute inset-0 p-8 flex flex-col gap-6 opacity-80 pointer-events-none">
              <div className="w-full h-12 bg-surface-container-high/50 rounded"></div>
              <div className="grid grid-cols-4 gap-4 h-full">
                <div className="col-span-3 bg-surface-container-high/30 rounded border border-outline-variant/20"></div>
                <div className="bg-surface-container-high/30 rounded border border-outline-variant/20"></div>
              </div>
            </div>
            <div className="absolute top-[40%] left-[62%] w-4 h-4 bg-error rounded-full animate-ping"></div>
            <div className="absolute top-[22%] left-[32%] w-3 h-3 bg-primary rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>

        {/* 11. Data Export Console */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col">
          <h3 className="text-on-surface font-bold mb-6 text-title-lg">Data Export Console</h3>
          <div className="flex-grow flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant font-bold uppercase font-mono">Include in Report</p>
              <div className="space-y-3">
                {[
                  ['Campaign Performance Metrics', true],
                  ['Audience Demographic Data', true],
                  ['Fraud Detection Log (Detailed)', false],
                  ['AI Forecasting & Trends', true],
                ].map(([label, checked]) => (
                  <label key={label} className="flex items-center gap-3 cursor-pointer group">
                    <input defaultChecked={checked} className="w-5 h-5 rounded border-outline bg-surface-container-high text-primary focus:ring-primary" type="checkbox" />
                    <span className="text-sm group-hover:text-primary transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-outline-variant/30 mt-auto">
              <p className="text-xs text-on-surface-variant font-bold uppercase mb-4 font-mono">Automation</p>
              <button className="w-full py-3 bg-surface-container-highest rounded border border-outline-variant flex items-center justify-between px-4 hover:bg-surface-bright transition-all group">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="material-symbols-outlined text-tertiary">schedule</span>
                  Schedule Weekly Export
                </span>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          FRAUD DETECTION ALERT PANEL
      ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-surface-container-low border border-red-500/20 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between bg-red-500/5">
          <div className="flex items-center gap-3">
            <span className="pulse-dot inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="material-symbols-outlined text-red-400">gpp_bad</span>
            <h3 className="text-on-surface font-bold text-title-lg">Fraud Detection Monitor</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-full animate-pulse">LIVE</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">shield</span>
            Powered by XGBoost + Isolation Forest
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 text-[11px] uppercase text-on-surface-variant font-label-md">
                <th className="text-left px-5 py-3">Timestamp</th>
                <th className="text-left px-5 py-3">IP Address</th>
                <th className="text-left px-5 py-3">Device ID</th>
                <th className="text-left px-5 py-3">Fraud Score</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {fraudLog.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-outline-variant/20 transition-colors hover:bg-surface-container-high/30 ${i === 0 ? 'bg-red-500/5' : ''}`}
                >
                  <td className="px-5 py-3 font-mono text-xs text-on-surface-variant">{row.ts}</td>
                  <td className="px-5 py-3 font-mono text-xs text-on-surface">{row.ip}</td>
                  <td className="px-5 py-3 font-mono text-xs text-on-surface-variant">{row.device}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${fraudScoreBg(row.score)}`}>
                      {row.score.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-medium text-on-surface">{row.category}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${actionChip(row.action)}`}>
                      {row.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary chips */}
        <div className="p-4 flex flex-wrap gap-3 border-t border-outline-variant/20 bg-surface-container-lowest">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="material-symbols-outlined text-red-400 text-sm">block</span>
            <span className="text-xs font-bold text-red-400">Blocked Today:</span>
            <span className="text-xs font-black text-on-surface">1,247</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <span className="material-symbols-outlined text-yellow-400 text-sm">flag</span>
            <span className="text-xs font-bold text-yellow-400">Flagged:</span>
            <span className="text-xs font-black text-on-surface">389</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
            <span className="text-xs font-bold text-emerald-400">Clean:</span>
            <span className="text-xs font-black text-on-surface">98.2K</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CAMPAIGN PERFORMANCE TABLE
      ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">campaign</span>
            <h3 className="text-on-surface font-bold text-title-lg">Campaign Performance</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/15 border border-primary/30 text-primary rounded-full">Live</span>
          </div>
          <p className="text-xs text-on-surface-variant">Click column headers to sort</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 text-[11px] uppercase text-on-surface-variant font-label-md">
                <th className="text-left px-5 py-3">Campaign</th>
                <th className="text-left px-5 py-3">Advertiser</th>
                <th className="text-left px-5 py-3">Raw Clicks</th>
                <th className="text-left px-5 py-3">Fraud Filtered</th>
                <th
                  className="text-left px-5 py-3 cursor-pointer hover:text-primary transition-colors select-none"
                  onClick={() => handleSort('ctr')}
                >
                  <span className="flex items-center gap-1">Effective CTR {sortIcon('ctr')}</span>
                </th>
                <th className="text-left px-5 py-3">Spend</th>
                <th
                  className="text-left px-5 py-3 cursor-pointer hover:text-primary transition-colors select-none"
                  onClick={() => handleSort('roas')}
                >
                  <span className="flex items-center gap-1">ROAS {sortIcon('roas')}</span>
                </th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedCampaigns.map((c, i) => {
                const fraudDelta = c.raw - c.filtered
                return (
                  <tr key={c.name} className="border-b border-outline-variant/20 hover:bg-surface-container-high/30 transition-colors">
                    <td className="px-5 py-4 font-semibold text-on-surface">{c.name}</td>
                    <td className="px-5 py-4 text-on-surface-variant text-xs">{c.advertiser}</td>
                    <td className="px-5 py-4 font-mono text-xs">{c.raw.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-on-surface">{c.filtered.toLocaleString('en-IN')}</span>
                      <span className="block text-[10px] text-red-400 font-mono">-{fraudDelta.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-primary text-xs">{c.ctr}%</td>
                    <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">{c.spend}</td>
                    <td className={`px-5 py-4 font-mono font-black text-sm ${roasColor(c.roas)}`}>{c.roas}x</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusColor(c.status)}`}>{c.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TERMINAL CONSOLE
      ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#050507] border border-outline-variant rounded-xl p-4 font-label-md text-label-md relative group">
        <div className="flex items-center gap-2 mb-3 border-b border-outline-variant/30 pb-2">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-error"></div>
            <div className="w-2 h-2 rounded-full bg-tertiary"></div>
            <div className="w-2 h-2 rounded-full bg-primary-container"></div>
          </div>
          <span className="text-on-surface-variant ml-2 opacity-60">Real-time AI Analysis Log</span>
        </div>
        <div ref={terminalEndRef} className="space-y-1 h-40 overflow-y-auto pr-4 font-mono text-[12px]">
          {logs.map((log, index) => {
            let color = 'text-on-surface-variant'
            if (log.type === 'sys') color = 'text-primary opacity-80'
            if (log.type === 'info' && !log.status) color = 'text-on-surface'
            if (log.type === 'insight') color = 'text-tertiary font-bold'
            if (log.type === 'alert') color = 'text-yellow-400'
            if (log.type === 'fraud') color = 'text-red-400'
            return (
              <p key={index} className={color}>
                <span className="opacity-40">[{log.time}]</span>{' '}
                {log.msg}{' '}
                {log.status && <span className="text-primary font-bold">{log.status}</span>}
              </p>
            )
          })}
          <div className="flex items-center space-x-1">
            <span className="opacity-40">[{new Date().toLocaleTimeString('en-GB', { hour12: false })}]</span>
            <span className="text-on-surface">Awaiting user interaction...</span>
            <span className="terminal-cursor"></span>
          </div>
        </div>
      </div>
    </div>
  )
}
