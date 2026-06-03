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

// --- Date range helpers ---
const getToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const formatRange = (start, end) => {
  const opts = { day: '2-digit', month: 'short', year: 'numeric' }
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`
}

const getDateRange = (preset, referenceDate = null) => {
  const today = referenceDate ? new Date(referenceDate) : getToday()
  today.setHours(0, 0, 0, 0)
  let start = new Date(today)
  let end = new Date(today)
  switch (preset) {
    case 'Last 7 Days':
      start.setDate(today.getDate() - 7)
      break
    case 'Last 30 Days':
      start.setDate(today.getDate() - 30)
      break
    case 'Last 90 Days':
      start.setDate(today.getDate() - 90)
      break
    case 'This Quarter':
      const quarterMonth = Math.floor(today.getMonth() / 3) * 3
      start = new Date(today.getFullYear(), quarterMonth, 1)
      break
    default:
      start.setDate(today.getDate() - 30)
  }
  return { start, end, label: preset, display: formatRange(start, end) }
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
  { name: 'Nike Air Max Summer', advertiser: 'Nike', raw: 45821, filtered: 44203, ctr: 4.8, spend: '₹4,20,000', roas: 4.8, status: 'Active' },
  { name: 'ASUS ROG Laptop Deal', advertiser: 'Asus', raw: 31440, filtered: 28991, ctr: 3.9, spend: '₹2,80,000', roas: 3.1, status: 'Active' },
  { name: 'Groww Invest Now', advertiser: 'Groww', raw: 18220, filtered: 17104, ctr: 3.2, spend: '₹1,50,000', roas: 2.4, status: 'Paused' },
  { name: 'MuscleBlaze Whey', advertiser: 'MuscleBlaze', raw: 12005, filtered: 11888, ctr: 2.8, spend: '₹95,000', roas: 6.2, status: 'Active' },
  { name: 'Noise ColorFit Pro', advertiser: 'Noise', raw: 8440, filtered: 6201, ctr: 2.1, spend: '₹75,000', roas: 1.8, status: 'At Risk' },
]

const TOP_ADS = [
  { rank: 1, name: 'Nike Air Max Summer', category: 'Footwear', ctr: 4.8, revenue: 120000, revenueDisplay: '₹1,20,000', brand: 'Nike', status: 'Active' },
  { rank: 2, name: 'ASUS ROG Laptop Deal', category: 'Electronics', ctr: 3.9, revenue: 98000, revenueDisplay: '₹98,000', brand: 'Asus', status: 'Active' },
  { rank: 3, name: 'Groww Invest Now', category: 'FinTech', ctr: 3.2, revenue: 76000, revenueDisplay: '₹76,000', brand: 'Groww', status: 'Paused' },
  { rank: 4, name: 'MuscleBlaze Whey', category: 'Nutrition', ctr: 2.8, revenue: 54000, revenueDisplay: '₹54,000', brand: 'MuscleBlaze', status: 'Active' },
  { rank: 5, name: 'Noise ColorFit Pro', category: 'Wearables', ctr: 2.1, revenue: 41000, revenueDisplay: '₹41,000', brand: 'Noise', status: 'Active' },
]

const MAX_CTR_BAR = 4.8

// ─── Toast Context ─────────────────────────────────────────────────────────────
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
}

const Toast = ({ id, type, message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 3000)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  const icons = {
    success: (
      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-emerald-400 text-sm">check</span>
      </div>
    ),
    error: (
      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-red-400 text-sm">close</span>
      </div>
    ),
    info: (
      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-yellow-400 text-sm">warning</span>
      </div>
    ),
  }

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 flex items-center gap-3 min-w-[280px] shadow-2xl animate-slide-in">
      {icons[type]}
      <p className="text-sm text-on-surface flex-1">{message}</p>
      <button onClick={() => onDismiss(id)} className="text-on-surface-variant hover:text-on-surface transition-colors">
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  )
}

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

// ─── Tooltip Component ────────────────────────────────────────────────────────
const Tooltip = ({ children, content, show }) => {
  if (!show) return children
  return (
    <div className="relative">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xl text-xs whitespace-nowrap z-50 animate-fade-in">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-surface-container-lowest"></div>
      </div>
    </div>
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

  // ── UI state for new features ──
  const [toasts, setToasts] = useState([])
  const [dateRangePreset, setDateRangePreset] = useState('Last 30 Days')
  const [dateRangeDisplay, setDateRangeDisplay] = useState(() => getDateRange('Last 30 Days').display)
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false)
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [comparePeriodBPreset, setComparePeriodBPreset] = useState('Last 7 Days')
  const [selectedExports, setSelectedExports] = useState({
    'Campaign Performance Metrics': true,
    'Audience Demographic Data': true,
    'Fraud Detection Log (Detailed)': false,
    'AI Forecasting & Trends': true,
  })
  const [scheduleEmail, setScheduleEmail] = useState('')
  const [scheduleDay, setScheduleDay] = useState('Monday')
  const [scheduleFormat, setScheduleFormat] = useState('CSV')
  
  // ── Engagement panel state ──
  const [sessionDuration] = useState('3m 42s')
  const [scrollDepth, setScrollDepth] = useState(78)
  const [hoverRatio, setHoverRatio] = useState(14.2)
  
  // ── Device split state ──
  const [mobilePct, setMobilePct] = useState(64.5)
  const [desktopPct, setDesktopPct] = useState(32.1)
  const [tabletPct, setTabletPct] = useState(3.4)
  
  // ── Top ads state ──
  const [topAds, setTopAds] = useState([...TOP_ADS])
  const [tooltipAd, setTooltipAd] = useState(null)

  // ── Conversion funnel state ──
  const [impressions, setImpressions] = useState(1200000)
  const [clicks, setClicks] = useState(45800)
  const [conversions, setConversions] = useState(12200)
  const [revenueEvents, setRevenueEvents] = useState(2400)
  
  const dateDropdownRef = useRef(null)
  const exportDropdownRef = useRef(null)
  const compareModalRef = useRef(null)
  const scheduleModalRef = useRef(null)

  // ── Add toast helper ──
  const addToast = (type, message) => {
    const id = Math.random()
    setToasts(prev => [...prev, { id, type, message }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // ── Click outside handlers ──
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false)
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setIsExportDropdownOpen(false)
      }
      if (compareModalRef.current && !compareModalRef.current.contains(event.target) && isCompareModalOpen) {
        setIsCompareModalOpen(false)
      }
      if (scheduleModalRef.current && !scheduleModalRef.current.contains(event.target) && isScheduleModalOpen) {
        setIsScheduleModalOpen(false)
      }
      // Close tooltip on outside click
      if (tooltipAd !== null) {
        setTooltipAd(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCompareModalOpen, isScheduleModalOpen, tooltipAd])

  // ─── KPI intervals ────────────────────────────────────────────────────────
  useEffect(() => {
    const u = setInterval(() => {
      setActiveUsers(prev => { setPrevUsers(prev); return prev + randInt(-5, 5) })
    }, 3000)
    const e = setInterval(() => {
      setEventsPerSec(prev => { setPrevEvents(prev); return prev + randInt(-200, 200) })
    }, 2000)
    const l = setInterval(() => {
      setBidLatency(prev => { setPrevLatency(prev); return Math.max(30, prev + randInt(-3, 3)) })
    }, 4000)
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
      setCtrPoints(prev => [...prev.slice(1), v])
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
    const wsInterval = setInterval(() => {
      const v = parseFloat(rand(1.8, 3.4).toFixed(2))
      setCurrentCTR(v)
      setActiveUsers(prev => prev + randInt(-5, 5))
      setEventsPerSec(prev => prev + randInt(-200, 200))
      setFraudRate(prev => parseFloat(Math.max(0, prev + rand(-0.05, 0.05)).toFixed(1)))
    }, 5000)
    return () => clearInterval(wsInterval)
  }, [])

  // ─── Engagement panel live updates ────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setScrollDepth(prev => {
        let newVal = prev + randInt(-2, 2)
        return Math.min(95, Math.max(65, newVal))
      })
      setHoverRatio(prev => {
        let newVal = prev + parseFloat(rand(-1.5, 1.5).toFixed(1))
        return Math.min(22, Math.max(8, newVal))
      })
    }, 8000)
    return () => clearInterval(id)
  }, [])

  // ─── Device split live updates ────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setMobilePct(prev => {
        let newVal = prev + parseFloat(rand(-0.3, 0.3).toFixed(1))
        return Math.min(70, Math.max(58, newVal))
      })
      setDesktopPct(prev => {
        let newVal = prev + parseFloat(rand(-0.3, 0.3).toFixed(1))
        return Math.min(38, Math.max(26, newVal))
      })
      setTabletPct(prev => {
        let newVal = prev + parseFloat(rand(-0.3, 0.3).toFixed(1))
        return Math.min(8, Math.max(2.5, newVal))
      })
    }, 12000)
    return () => clearInterval(id)
  }, [])

  // ─── Top ads revenue live updates ─────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTopAds(prev => prev.map(ad => {
        const increment = randInt(100, 500)
        const newRevenue = ad.revenue + increment
        const formatRevenue = (val) => {
          if (val >= 100000) return `₹${Math.floor(val / 1000)},${(val % 1000).toString().padStart(3, '0')}`
          return `₹${val.toLocaleString('en-IN')}`
        }
        return {
          ...ad,
          revenue: newRevenue,
          revenueDisplay: formatRevenue(newRevenue)
        }
      }))
    }, 6000)
    return () => clearInterval(id)
  }, [])

  // ─── Conversion funnel live updates ───────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setImpressions(prev => prev + randInt(-5000, 8000))
      setClicks(prev => prev + randInt(-200, 400))
      setConversions(prev => prev + randInt(-80, 150))
      setRevenueEvents(prev => prev + randInt(-20, 40))
    }, 10000)
    return () => clearInterval(id)
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

  // ─── Date range handler ───────────────────────────────────────────────────
  const handleDatePresetSelect = (preset) => {
    if (preset === 'Custom Range') {
      addToast('info', 'Custom range coming soon!')
      setIsDateDropdownOpen(false)
      return
    }
    const range = getDateRange(preset)
    setDateRangePreset(preset)
    setDateRangeDisplay(range.display)
    setIsDateDropdownOpen(false)
  }

  // ─── Export handlers ──────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const csvData = [
      ['Campaign', 'Clicks', 'CTR', 'Spend', 'ROAS'],
      ['Nike Air Max Summer', '45821', '4.8%', '420000', '4.8x'],
      ['ASUS ROG Laptop Deal', '31440', '3.9%', '280000', '3.1x'],
      ['Groww Invest Now', '18220', '3.2%', '150000', '2.4x'],
      ['MuscleBlaze Whey', '12005', '2.8%', '95000', '6.2x'],
      ['Noise ColorFit Pro', '8440', '2.1%', '75000', '1.8x'],
    ]
    const csvString = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().split('T')[0]
    a.href = url
    a.download = `adai-analytics-export-${date}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addToast('success', 'CSV exported successfully!')
    setIsExportDropdownOpen(false)
  }

  const handleExportPDF = () => {
    addToast('info', 'PDF export queued — ready in ~10 seconds')
    setTimeout(() => {
      const date = new Date().toISOString().split('T')[0]
      addToast('success', `PDF ready! adai-report-${date}.pdf downloaded`)
    }, 10000)
    setIsExportDropdownOpen(false)
  }

  const handleExportExcel = () => {
    addToast('info', 'Excel export queued — ready in ~10 seconds')
    setTimeout(() => {
      const date = new Date().toISOString().split('T')[0]
      addToast('success', `Excel ready! adai-report-${date}.xlsx downloaded`)
    }, 10000)
    setIsExportDropdownOpen(false)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    addToast('success', 'Dashboard link copied to clipboard!')
    setIsExportDropdownOpen(false)
  }

  // ─── Compare modal handlers ───────────────────────────────────────────────
  const handleCompare = () => {
    const periodARange = getDateRange(dateRangePreset)
    const periodBRange = getDateRange(comparePeriodBPreset)
    addToast('success', `Comparison active: ${periodARange.display} vs ${periodBRange.display}`)
    setIsCompareModalOpen(false)
  }

  // ─── Schedule modal handlers ──────────────────────────────────────────────
  const handleScheduleSubmit = () => {
    if (!scheduleEmail.trim()) {
      addToast('error', 'Please enter an email address')
      return
    }
    addToast('success', `Weekly export scheduled! Reports will be sent to ${scheduleEmail} every ${scheduleDay} in ${scheduleFormat} format.`)
    setIsScheduleModalOpen(false)
    setScheduleEmail('')
  }

  // ─── Checkbox handler ─────────────────────────────────────────────────────
  const handleExportCheckboxChange = (label) => {
    setSelectedExports(prev => ({ ...prev, [label]: !prev[label] }))
  }

  // ─── Derived helpers ──────────────────────────────────────────────────────
  const trendBadge = (cur, prev, suffix = '') => {
    const up = cur >= prev
    const delta = Math.abs(cur - prev)
    return (
      <span className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
        {up ? '▲' : '▼'} {typeof delta === 'number' && delta % 1 !== 0 ? delta.toFixed(1) : delta}{suffix}
      </span>
    )
  }

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

  // Get bar opacity based on rank
  const getBarOpacity = (rank) => {
    if (rank === 1) return 'opacity-100'
    if (rank === 2) return 'opacity-85'
    if (rank === 3) return 'opacity-70'
    return 'opacity-50'
  }

  // Funnel calculations
  const clicksRate = ((clicks / impressions) * 100).toFixed(1)
  const conversionsRate = ((conversions / clicks) * 100).toFixed(1)
  const revenueRate = ((revenueEvents / conversions) * 100).toFixed(1)
  const impressionsToClicksDrop = (100 - parseFloat(clicksRate)).toFixed(1)
  const clicksToConversionsDrop = (100 - parseFloat(conversionsRate)).toFixed(1)
  const conversionsToRevenueDrop = (100 - parseFloat(revenueRate)).toFixed(1)

  // Calculate widths for funnel (max width = impressions, each subsequent is proportionally smaller)
  const maxWidth = 100
  const clicksWidth = (clicks / impressions) * maxWidth
  const conversionsWidth = (conversions / impressions) * maxWidth
  const revenueWidth = (revenueEvents / impressions) * maxWidth

  // Ad Placement Performance data
  const adPlacements = [
    { name: 'Above the Fold', impressions: 420000, ctr: 4.2, revenue: 184000, isBest: true },
    { name: 'Mid Article', impressions: 280000, ctr: 2.8, revenue: 98000, isBest: false },
    { name: 'Sidebar', impressions: 190000, ctr: 1.4, revenue: 42000, isBest: false },
    { name: 'Below Fold', impressions: 95000, ctr: 0.7, revenue: 12000, isBest: false },
    { name: 'Sticky Footer', impressions: 120000, ctr: 1.1, revenue: 28000, isBest: false },
  ]
  const maxCtr = 4.2

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
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast key={toast.id} id={toast.id} type={toast.type} message={toast.message} onDismiss={removeToast} />
        ))}
      </div>

      {/* Compare Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div ref={compareModalRef} className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-md w-full mx-4 p-6 animate-scale-in">
            <h2 className="text-xl font-bold text-on-surface mb-4">Compare Periods</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">Period A (Current)</label>
                <div className="bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface">
                  {dateRangeDisplay}
                </div>
              </div>
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">Period B</label>
                <div className="relative">
                  <button
                    onClick={() => {}}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface flex justify-between items-center"
                  >
                    <span>{comparePeriodBPreset}</span>
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                  </button>
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-low border border-outline-variant rounded-xl shadow-xl z-10">
                    {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Quarter'].map(preset => (
                      <button
                        key={preset}
                        onClick={() => setComparePeriodBPreset(preset)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-high transition-colors flex justify-between items-center"
                      >
                        {preset}
                        {comparePeriodBPreset === preset && (
                          <span className="material-symbols-outlined text-primary text-sm">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCompare} className="flex-1 bg-primary text-on-primary rounded-lg px-4 py-2 font-bold hover:brightness-110 transition-all">
                Compare
              </button>
              <button onClick={() => setIsCompareModalOpen(false)} className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 font-medium hover:bg-surface-bright transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div ref={scheduleModalRef} className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-md w-full mx-4 p-6 animate-scale-in">
            <h2 className="text-xl font-bold text-on-surface mb-4">Schedule Weekly Export</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">Send to email</label>
                <input
                  type="email"
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                  placeholder="analyst@company.com"
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm text-on-surface-variant mb-1 block">Day of week</label>
                <select
                  value={scheduleDay}
                  onChange={(e) => setScheduleDay(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Monday">Monday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-on-surface-variant mb-2 block">Format</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={scheduleFormat === 'CSV'}
                      onChange={() => setScheduleFormat('CSV')}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">CSV</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={scheduleFormat === 'PDF'}
                      onChange={() => setScheduleFormat('PDF')}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">PDF</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleScheduleSubmit} className="flex-1 bg-primary text-on-primary rounded-lg px-4 py-2 font-bold hover:brightness-110 transition-all">
                Activate Schedule
              </button>
              <button onClick={() => setIsScheduleModalOpen(false)} className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 font-medium hover:bg-surface-bright transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
            <span className="ws-dot inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400">LIVE</span>
          </div>
          {/* Date range dropdown */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="flex items-center bg-surface-container-high rounded px-3 py-2 border border-outline-variant text-sm font-medium cursor-pointer hover:bg-surface-bright transition-all"
            >
              <span className="material-symbols-outlined mr-2 text-primary">calendar_month</span>
              {dateRangeDisplay}
              <span className="material-symbols-outlined ml-2">expand_more</span>
            </button>
            {isDateDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-low border border-outline-variant rounded-xl shadow-xl z-50 animate-fade-in">
                {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Quarter', 'Custom Range'].map(preset => (
                  <button
                    key={preset}
                    onClick={() => handleDatePresetSelect(preset)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-high transition-colors flex justify-between items-center group"
                    title={preset === 'Custom Range' ? 'Coming Soon' : ''}
                  >
                    {preset}
                    {dateRangePreset === preset && (
                      <span className="material-symbols-outlined text-primary text-sm">check</span>
                    )}
                    {preset === 'Custom Range' && (
                      <span className="text-[10px] text-on-surface-variant opacity-60">Coming soon</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Compare Button */}
          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-outline-variant rounded hover:bg-surface-bright transition-all text-sm font-medium"
          >
            <span className="material-symbols-outlined text-sm">compare_arrows</span>
            Compare
          </button>
          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded hover:brightness-110 transition-all text-sm font-bold shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
            {isExportDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 bg-surface-container-low border border-outline-variant rounded-xl shadow-xl z-50 min-w-[200px] animate-fade-in">
                <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-high transition-colors">Export as CSV</button>
                <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-high transition-colors">Export as PDF</button>
                <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-high transition-colors">Export as Excel (.xlsx)</button>
                <button onClick={handleCopyLink} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-high transition-colors">Copy Dashboard Link</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BENTO GRID - Equal height cards row
      ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-gutter items-stretch">

        {/* 1. Live CTR Line Chart */}
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
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6 h-full">
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
      </div>

      {/* Engagement, Device Split, Top Ads - Equal Height Row */}
      <div className="grid grid-cols-12 gap-gutter items-stretch">
        
        {/* 3. Engagement Panel */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6 h-full flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-on-surface font-bold text-title-lg">Engagement</h3>
              <p className="text-xs text-on-surface-variant">Avg. Session Duration</p>
            </div>
            <div className="text-right">
              <span className="text-[#ffb783] font-bold text-lg">+12.4%</span>
              <p className="text-sm font-mono text-on-surface mt-1">{sessionDuration}</p>
            </div>
          </div>
          <div className="h-32 flex items-center justify-center border-b border-outline-variant/30 mb-4">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgba(192, 193, 255, 0.3)', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: 'rgba(192, 193, 255, 0)', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <path d="M0 35 Q10 20 20 25 T40 10 T60 30 T80 5 T100 20" fill="none" stroke="#c0c1ff" strokeWidth="2" />
              <path d="M0 35 Q10 20 20 25 T40 10 T60 30 T80 5 T100 20 V40 H0 Z" fill="url(#grad1)" />
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-auto">
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase">Scroll Depth</p>
              <p className="text-lg font-bold">{scrollDepth}%</p>
              <p className="text-[9px] text-emerald-400 mt-0.5">↑ +{randInt(1, 3)}% vs yesterday</p>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase">Hover Ratio</p>
              <p className="text-lg font-bold">{hoverRatio.toFixed(1)}%</p>
              <p className="text-[9px] text-emerald-400 mt-0.5">↑ +{randInt(0, 2)}.{randInt(0, 9)}% vs yesterday</p>
            </div>
          </div>
        </div>

        {/* 4. Device Split */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-surface-container-low border border-outline-variant rounded-xl p-6 h-full flex flex-col">
          <h3 className="text-on-surface font-bold mb-6 text-title-lg">Device Split</h3>
          <div className="space-y-4 flex-1">
            {[
              { icon: 'smartphone', color: 'text-primary', label: 'Mobile', val: mobilePct, barColor: 'bg-primary', barW: `${Math.min(100, mobilePct)}%`, trend: 'up', trendVal: '+2.1% vs last week' },
              { icon: 'laptop', color: 'text-secondary', label: 'Desktop', val: desktopPct, barColor: 'bg-secondary', barW: `${Math.min(100, desktopPct)}%`, trend: 'down', trendVal: '-1.8% vs last week' },
              { icon: 'tablet', color: 'text-tertiary', label: 'Tablet', val: tabletPct, barColor: 'bg-tertiary', barW: `${Math.max(8, Math.min(100, tabletPct))}%`, trend: 'neutral', trendVal: '' },
            ].map((d, i) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined ${d.color} text-sm`}>{d.icon}</span>
                    <span className="text-sm">{d.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{d.val.toFixed(1)}%</span>
                    {d.trendVal && (
                      <p className={`text-[9px] ${d.trend === 'up' ? 'text-emerald-400' : 'text-red-400'} mt-0.5`}>{d.trendVal}</p>
                    )}
                  </div>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-1">
                  <div className={`${d.barColor} h-full`} style={{ width: d.barW }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Top Performing Ads */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-low border border-outline-variant rounded-xl p-6 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-[20px]">workspace_premium</span>
            <h3 className="text-on-surface font-bold text-title-lg">Top Performing Ads</h3>
          </div>
          <div className="space-y-4 flex-1">
            {topAds.map((ad) => (
              <Tooltip
                key={ad.rank}
                content={`Campaign: ${ad.name} | Status: ${ad.status} | Advertiser: ${ad.brand}`}
                show={tooltipAd === ad.rank}
              >
                <div
                  className="flex items-center gap-3 group cursor-pointer transition-all duration-200 hover:bg-surface-container-high/50 rounded-lg p-2 -mx-2"
                  onMouseEnter={() => setTooltipAd(ad.rank)}
                  onMouseLeave={() => setTooltipAd(null)}
                >
                  <span className={`text-xl font-black w-6 shrink-0 transition-opacity ${ad.rank === 1 ? 'text-yellow-400' : ad.rank === 2 ? 'text-slate-300' : ad.rank === 3 ? 'text-orange-400' : ad.rank === 4 ? 'text-purple-400' : 'text-blue-400'}`}>
                    {ad.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-on-surface truncate pr-2">{ad.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-high border border-outline-variant rounded text-on-surface-variant shrink-0">
                        {ad.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`bg-primary h-full rounded-full transition-all ${getBarOpacity(ad.rank)}`}
                          style={{ width: `${(ad.ctr / MAX_CTR_BAR) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold font-mono text-primary shrink-0">{ad.ctr}%</span>
                      <span className="text-[10px] text-on-surface-variant font-mono shrink-0 group-hover:text-primary transition-colors">
                        {ad.revenueDisplay}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all -mr-1 text-sm">
                    chevron_right
                  </span>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      {/* New row: AI Growth Prediction + User Interests + Conversion Funnel */}
      <div className="grid grid-cols-12 gap-gutter mt-6">
        {/* AI Growth Prediction */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6">
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

        {/* User Interests */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-surface-container-low border border-outline-variant rounded-xl p-6">
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

        {/* 9. Conversion Funnel - IMPROVED */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-low border border-outline-variant rounded-xl p-6">
          <h3 className="text-on-surface font-bold text-title-lg mb-2">Conversion Funnel</h3>
          <p className="text-xs text-on-surface-variant mb-6">User journey from impressions to revenue events</p>
          <div className="space-y-3">
            {/* Impressions */}
            <div className="flex items-center gap-4">
              <div className="w-32 text-right">
                <span className="text-sm font-bold text-on-surface">Impressions</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-black text-primary">{impressions.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-surface-container-high h-8 rounded-lg overflow-hidden">
                  <div className="bg-primary/30 h-full rounded-lg" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-red-400 text-right -mt-2">↓ {impressionsToClicksDrop}% drop</p>

            {/* Clicks */}
            <div className="flex items-center gap-4">
              <div className="w-32 text-right">
                <span className="text-sm font-bold text-on-surface">Clicks</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-black text-primary">{clicks.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-emerald-400">{clicksRate}% of impressions</span>
                </div>
                <div className="w-full bg-surface-container-high h-8 rounded-lg overflow-hidden">
                  <div className="bg-primary/40 h-full rounded-lg" style={{ width: `${clicksWidth}%` }}></div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-red-400 text-right -mt-2" style={{ marginLeft: 'calc(32px + 1rem)' }}>↓ {clicksToConversionsDrop}% drop</p>

            {/* Conversions (formerly Add to Cart) */}
            <div className="flex items-center gap-4">
              <div className="w-32 text-right">
                <span className="text-sm font-bold text-on-surface">Conversions</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-black text-primary">{conversions.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-emerald-400">{conversionsRate}% of clicks</span>
                </div>
                <div className="w-full bg-surface-container-high h-8 rounded-lg overflow-hidden">
                  <div className="bg-primary/50 h-full rounded-lg" style={{ width: `${conversionsWidth}%` }}></div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-red-400 text-right -mt-2" style={{ marginLeft: 'calc(64px + 1rem)' }}>↓ {conversionsToRevenueDrop}% drop</p>

            {/* Revenue Events (formerly Purchases) */}
            <div className="flex items-center gap-4">
              <div className="w-32 text-right">
                <span className="text-sm font-bold text-on-surface">Revenue Events</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-black text-primary">{revenueEvents.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-emerald-400">{revenueRate}% of conversions</span>
                </div>
                <div className="w-full bg-surface-container-high h-8 rounded-lg overflow-hidden">
                  <div className="bg-primary/60 h-full rounded-lg" style={{ width: `${revenueWidth}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Placement Performance Panel - REPLACES Engagement Heatmap */}
      <div className="grid grid-cols-12 gap-gutter mt-6">
        <div className="col-span-12 bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container/20">
            <div>
              <h3 className="text-on-surface font-bold text-title-lg">Ad Placement Performance</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">RL Agent Optimization Results</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-1 bg-primary/15 border border-primary/30 text-primary rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">psychology</span>
                Powered by RL Agent
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-[11px] uppercase text-on-surface-variant font-label-md">
                  <th className="text-left px-6 py-4">Placement</th>
                  <th className="text-left px-6 py-4">Impressions</th>
                  <th className="text-left px-6 py-4">CTR</th>
                  <th className="text-left px-6 py-4">Revenue</th>
                  <th className="text-left px-6 py-4">Performance</th>
                 </tr>
              </thead>
              <tbody>
                {adPlacements.map((placement) => (
                  <tr
                    key={placement.name}
                    className={`border-b border-outline-variant/20 transition-colors hover:bg-surface-container-high/30 ${placement.isBest ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-on-surface">{placement.name}</span>
                        {placement.isBest && (
                          <span className="text-[10px] px-2 py-0.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 rounded-full flex items-center gap-1">
                            🏆 Best Performer
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface">{placement.impressions.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-primary text-xs">{placement.ctr}%</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-emerald-400 font-bold">
                      ₹{(placement.revenue / 1000).toFixed(0)},{String(placement.revenue % 1000).padStart(3, '0')}
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary to-secondary h-full rounded-full"
                            style={{ width: `${(placement.ctr / maxCtr) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-on-surface-variant font-mono w-12">{(placement.ctr / maxCtr * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest">
            <p className="text-[10px] text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">trending_up</span>
              RL Agent recommends increasing Above the Fold allocation by 15% for optimal ROI
            </p>
          </div>
        </div>
      </div>

      {/* Data Export Console + Fraud Detection row */}
      <div className="grid grid-cols-12 gap-gutter mt-6">
        {/* Data Export Console - Interactive */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col">
          <h3 className="text-on-surface font-bold mb-6 text-title-lg">Data Export Console</h3>
          <div className="flex-grow flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant font-bold uppercase font-mono">Include in Report</p>
              <div className="space-y-3">
                {Object.entries(selectedExports).map(([label, checked]) => (
                  <label key={label} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      checked={checked}
                      onChange={() => handleExportCheckboxChange(label)}
                      className="w-5 h-5 rounded border-outline bg-surface-container-high text-primary focus:ring-primary"
                      type="checkbox"
                    />
                    <span className="text-sm group-hover:text-primary transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-outline-variant/30 mt-auto">
              <p className="text-xs text-on-surface-variant font-bold uppercase mb-4 font-mono">Automation</p>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="w-full py-3 bg-surface-container-highest rounded border border-outline-variant flex items-center justify-between px-4 hover:bg-surface-bright transition-all group"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="material-symbols-outlined text-tertiary">schedule</span>
                  Schedule Weekly Export
                </span>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Fraud Detection Panel - condensed */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low border border-red-500/20 rounded-xl overflow-hidden">
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
                {fraudLog.slice(0, 4).map((row, i) => (
                  <tr key={row.id} className={`border-b border-outline-variant/20 transition-colors hover:bg-surface-container-high/30 ${i === 0 ? 'bg-red-500/5' : ''}`}>
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
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CAMPAIGN PERFORMANCE TABLE
      ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden mt-6">
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
                <th className="text-left px-5 py-3 cursor-pointer hover:text-primary transition-colors select-none" onClick={() => handleSort('ctr')}>
                  <span className="flex items-center gap-1">Effective CTR {sortIcon('ctr')}</span>
                </th>
                <th className="text-left px-5 py-3">Spend</th>
                <th className="text-left px-5 py-3 cursor-pointer hover:text-primary transition-colors select-none" onClick={() => handleSort('roas')}>
                  <span className="flex items-center gap-1">ROAS {sortIcon('roas')}</span>
                </th>
                <th className="text-left px-5 py-3">Status</th>
               </tr>
            </thead>
            <tbody>
              {sortedCampaigns.map((c) => {
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
      <div className="bg-[#050507] border border-outline-variant rounded-xl p-4 font-label-md text-label-md relative group mt-6">
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