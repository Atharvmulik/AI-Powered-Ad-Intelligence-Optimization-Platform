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

// Generate SHAP data for a user
const generateShapForUser = (isFraud) => {
  if (isFraud) {
    return {
      isFraud: true,
      features: [
        { feature: 'Click Velocity', plain: 'Abnormal click speed', value: parseFloat((0.6 + Math.random() * 0.35).toFixed(2)), positive: false },
        { feature: 'IP Reputation', plain: 'Suspicious IP address', value: parseFloat((0.4 + Math.random() * 0.4).toFixed(2)), positive: false },
        { feature: 'Session Entropy', plain: 'No natural browsing pattern', value: parseFloat((0.3 + Math.random() * 0.4).toFixed(2)), positive: false },
        { feature: 'Mouse Movement', plain: 'No natural mouse movement', value: parseFloat((0.2 + Math.random() * 0.4).toFixed(2)), positive: false },
      ]
    }
  }
  // Normal user — mix of positive and negative
  return {
    isFraud: false,
    features: [
      { feature: 'User_History_CTR', plain: 'Interest match', value: parseFloat((Math.random() * 0.7).toFixed(2)), positive: Math.random() > 0.3 },
      { feature: 'Ad_Category_Match', plain: 'Category relevance', value: parseFloat((Math.random() * 0.55).toFixed(2)), positive: Math.random() > 0.25 },
      { feature: 'Time_of_Day', plain: 'Timing factor', value: parseFloat((Math.random() * 0.35).toFixed(2)), positive: Math.random() > 0.5 },
      { feature: 'Device_Type', plain: 'Device preference', value: parseFloat((Math.random() * 0.4).toFixed(2)), positive: Math.random() > 0.4 },
      { feature: 'User_Interest_Vector', plain: 'Profile similarity', value: parseFloat((Math.random() * 0.5).toFixed(2)), positive: Math.random() > 0.3 },
    ]
  }
}

// Generate dynamic prediction stream item with SHAP data
const generateStreamItemWithShap = () => {
  const userId = `USER_${Math.floor(1000 + Math.random() * 9000)}`
  const isFraud = Math.random() < 0.15
  const score = isFraud 
    ? parseFloat((0.75 + Math.random() * 0.24).toFixed(2))
    : parseFloat((0.05 + Math.random() * 0.93).toFixed(2))
  
  const shapData = generateShapForUser(isFraud)
  const time = new Date().toLocaleTimeString('en-GB', { hour12: false })
  
  return {
    time,
    user: userId,
    metric: isFraud ? `fraud: ${score} !!` : `p(click): ${score}`,
    isFraud,
    score,
    shapData
  }
}

// Get plain English subtitle for feature
const getFeatureSubtitle = (feature, value, positive) => {
  const absValue = Math.abs(value)
  switch(feature) {
    case 'User_History_CTR':
      return positive ? `User clicked ${Math.floor(absValue * 10)} similar ads recently` : 'First time seeing this ad category'
    case 'Ad_Category_Match':
      return positive ? 'Ad category aligns with browsing history' : 'Ad category not in user interest profile'
    case 'Time_of_Day':
      return positive ? 'Peak engagement hours for this user' : 'Late night — low engagement window'
    case 'Device_Type':
      return positive ? 'User most active on this device type' : 'User rarely converts on this device'
    case 'Historical_CTR':
      return positive ? `This ad has ${(absValue * 5).toFixed(1)}% CTR in similar segments` : 'This ad historically underperforms'
    case 'User_Interest_Vector':
      return positive ? `${Math.floor(absValue * 100)}% vector similarity to target demographic` : 'Low similarity to target demographic'
    default:
      return positive ? 'Strong signal for conversion' : 'Negative signal detected'
  }
}

// Get impact level badge
const getImpactLevel = (value) => {
  const absValue = Math.abs(value)
  if (absValue > 0.50) return { label: 'HIGH', color: 'bg-red-500/20 text-red-500 border-red-500/30' }
  if (absValue >= 0.25) return { label: 'MEDIUM', color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' }
  return { label: 'LOW', color: 'bg-green-500/20 text-green-500 border-green-500/30' }
}

// Get threat level for fraud signals
const getThreatLevel = (value) => {
  const absValue = Math.abs(value)
  if (absValue > 0.8) return { label: 'CRITICAL', color: 'bg-red-600', width: '100%' }
  if (absValue > 0.6) return { label: 'HIGH', color: 'bg-red-500', width: '80%' }
  if (absValue > 0.4) return { label: 'MEDIUM', color: 'bg-orange-500', width: '60%' }
  return { label: 'LOW', color: 'bg-yellow-500', width: '40%' }
}

export default function AIInsights() {
  // Existing stream log state
  const [stream, setStream] = useState(() => {
    const initialStream = []
    for (let i = 0; i < 6; i++) {
      initialStream.push(generateStreamItemWithShap())
    }
    return initialStream
  })

  const terminalEndRef = useRef(null)

  // Kafka & Pipeline metrics
  const [kafkaEventsSec, setKafkaEventsSec] = useState(8420)
  const [pipelineLatency, setPipelineLatency] = useState(18)

  // Fraud Alert Panel state
  const initialFraudAlerts = [
    { id: 1, time: '14:30:12', ip: '185.220.101.5', score: 0.97, category: 'Bot', feature: 'click_velocity: 340/min' },
    { id: 2, time: '14:30:45', ip: '94.23.102.89', score: 0.92, category: 'Click Farm', feature: 'ip_reputation: poor' },
    { id: 3, time: '14:31:18', ip: '203.190.150.8', score: 0.82, category: 'Suspicious Human', feature: 'hover_duration: 0.05s' },
    { id: 4, time: '14:31:55', ip: '45.22.10.87', score: 0.88, category: 'Bot', feature: 'user_agent: headless' }
  ]
  const [fraudAlerts, setFraudAlerts] = useState(initialFraudAlerts)
  const [blockedToday, setBlockedToday] = useState(47)
  const fraudTerminalRef = useRef(null)

  // SHAP feature data state
  const [shapFeatures, setShapFeatures] = useState([
    { name: 'User_History_CTR', value: 0.65 },
    { name: 'Ad_Category_Match', value: 0.48 },
    { name: 'Time_of_Day', value: -0.20 },
    { name: 'Device_Type', value: 0.32 },
    { name: 'Historical_CTR', value: -0.15 },
    { name: 'User_Interest_Vector', value: 0.41 }
  ])

  // Model degradation simulation state
  const [isDegraded, setIsDegraded] = useState(false)

  // Toast notification state
  const [toast, setToast] = useState({ message: '', visible: false })

  // New state for redesigned section
  const [selectedPrediction, setSelectedPrediction] = useState(null)
  const [viewMode, setViewMode] = useState('business') // 'business' or 'ml'
  const [selectedShapData, setSelectedShapData] = useState(null)
  const [selectedIsFraud, setSelectedIsFraud] = useState(false)

  // Per-Ad Intelligence data
  const [adsData, setAdsData] = useState([
    {
      id: '1',
      name: 'Nike Running Shoes',
      category: 'Sports',
      clickProbability: 0.82,
      fraudRisk: 'LOW',
      shapReason: 'User interest match: +0.48',
      expanded: false,
      shapFeatures: [
        { name: 'User_History_CTR', value: 0.42 },
        { name: 'Ad_Category_Match', value: 0.48 },
        { name: 'Time_of_Day', value: 0.12 },
        { name: 'Device_Type', value: 0.08 }
      ],
      confidence: 0.89,
      segments: ['Active Runners', 'Age 22-35', 'Mobile'],
      filteredClicks: 182,
      rawClicks: 210
    },
    {
      id: '2',
      name: 'Gaming Laptop Pro',
      category: 'Tech',
      clickProbability: 0.45,
      fraudRisk: 'MEDIUM',
      shapReason: 'Device type mismatch: -0.22',
      expanded: false,
      shapFeatures: [
        { name: 'User_History_CTR', value: 0.15 },
        { name: 'Ad_Category_Match', value: 0.08 },
        { name: 'Time_of_Day', value: -0.18 },
        { name: 'Device_Type', value: -0.22 }
      ],
      confidence: 0.67,
      segments: ['Gamers', 'Age 18-30', 'Desktop'],
      filteredClicks: 95,
      rawClicks: 128
    },
    {
      id: '3',
      name: 'Protein Supplement',
      category: 'Health',
      clickProbability: 0.91,
      fraudRisk: 'LOW',
      shapReason: 'User purchase history: +0.61',
      expanded: false,
      shapFeatures: [
        { name: 'User_History_CTR', value: 0.61 },
        { name: 'Ad_Category_Match', value: 0.32 },
        { name: 'Time_of_Day', value: 0.14 },
        { name: 'Device_Type', value: 0.05 }
      ],
      confidence: 0.94,
      segments: ['Fitness Enthusiasts', 'Age 20-40', 'All Devices'],
      filteredClicks: 341,
      rawClicks: 365
    },
    {
      id: '4',
      name: 'Travel Insurance',
      category: 'Finance',
      clickProbability: 0.28,
      fraudRisk: 'HIGH',
      shapReason: 'Previous claim history: -0.35',
      expanded: false,
      shapFeatures: [
        { name: 'User_History_CTR', value: -0.12 },
        { name: 'Ad_Category_Match', value: -0.08 },
        { name: 'Time_of_Day', value: -0.35 },
        { name: 'Device_Type', value: -0.05 }
      ],
      confidence: 0.52,
      segments: ['Travelers', 'Age 35-55', 'Desktop'],
      filteredClicks: 42,
      rawClicks: 88
    },
    {
      id: '5',
      name: 'Mobile Banking App',
      category: 'Finance',
      clickProbability: 0.73,
      fraudRisk: 'LOW',
      shapReason: 'Location match: +0.39',
      expanded: false,
      shapFeatures: [
        { name: 'User_History_CTR', value: 0.28 },
        { name: 'Ad_Category_Match', value: 0.39 },
        { name: 'Time_of_Day', value: 0.21 },
        { name: 'Device_Type', value: 0.11 }
      ],
      confidence: 0.81,
      segments: ['Tech-Savvy', 'Age 25-45', 'Mobile'],
      filteredClicks: 267,
      rawClicks: 298
    }
  ])

  // Show toast notification
  const showToast = (message) => {
    setToast({ message, visible: true })
    setTimeout(() => {
      setToast({ message: '', visible: false })
    }, 3000)
  }

  // Toggle ad explanation expansion
  const toggleAdExpansion = (id) => {
    setAdsData(prev => prev.map(ad => 
      ad.id === id ? { ...ad, expanded: !ad.expanded } : ad
    ))
  }

  // Dynamic stream generation with SHAP data
  useEffect(() => {
    const id = setInterval(() => {
      const newItem = generateStreamItemWithShap()
      setStream(prev => {
        const next = [...prev, newItem]
        return next.length > 10 ? next.slice(next.length - 10) : next
      })
    }, 4000)
    return () => clearInterval(id)
  }, [])

  // Auto-scroll for existing terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight
    }
  }, [stream])

  // Simulating Kafka Events & Latency
  useEffect(() => {
    const kafkaInterval = setInterval(() => {
      setKafkaEventsSec(prev => {
        const delta = Math.floor(Math.random() * 600) - 300
        const next = prev + delta
        return next < 7000 ? 7000 : next > 10000 ? 10000 : next
      })
    }, 1500)

    const latencyInterval = setInterval(() => {
      setPipelineLatency(prev => {
        const delta = Math.floor(Math.random() * 8) - 4
        const next = prev + delta
        return next < 8 ? 8 : next > 28 ? 28 : next
      })
    }, 2000)

    return () => {
      clearInterval(kafkaInterval)
      clearInterval(latencyInterval)
    }
  }, [])

  // Simulating Live Fraud Alerts
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

  // Dynamic SHAP simulation
  useEffect(() => {
    const shapInterval = setInterval(() => {
      setShapFeatures(prev => prev.map(feature => ({
        ...feature,
        value: feature.value + (Math.random() - 0.5) * 0.05
      })))
    }, 10000)
    return () => clearInterval(shapInterval)
  }, [])

  // Get severity class for fraud alerts
  const getFraudSeverityClass = (score) => {
    if (score > 0.90) return 'critical'
    if (score >= 0.70) return 'high'
    return 'medium'
  }

  // Get click probability badge color
  const getClickProbColor = (prob) => {
    if (prob > 0.7) return 'bg-green-500/10 text-green-500 border-green-500/20'
    if (prob >= 0.4) return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    return 'bg-red-500/10 text-red-500 border-red-500/20'
  }

  // Get fraud risk badge color
  const getFraudRiskColor = (risk) => {
    switch(risk) {
      case 'LOW': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'HIGH': return 'bg-red-500/10 text-red-500 border-red-500/20'
      default: return 'bg-surface-container text-on-surface-variant'
    }
  }

  return (
    <div className="space-y-gutter relative">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-4 right-4 bg-surface-container-high border border-primary/30 rounded-lg p-4 shadow-lg z-50 animate-in slide-in-from-bottom-2">
          <p className="text-primary font-mono text-sm">{toast.message}</p>
        </div>
      )}

      {/* Model degradation warning banner */}
      {isDegraded && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-xl p-4 mb-4">
          <div className="flex items-center">
            <span className="material-symbols-outlined text-amber-500 mr-3">warning</span>
            <p className="text-amber-500 text-sm font-mono">
              ⚠ Model degradation detected — Click Prediction AUC-ROC below acceptance threshold. Retraining triggered automatically.
            </p>
          </div>
        </div>
      )}

      {/* Kafka metrics section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
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

      {/* AI Model Status Cards with Model Degradation Toggle */}
      <div className="relative">
        <button
          onClick={() => setIsDegraded(!isDegraded)}
          className="absolute top-2 right-2 z-10 px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded-lg text-xs font-mono hover:border-primary/50 transition-all"
        >
          {isDegraded ? '🔴 Reset Model' : '🟢 Simulate Degradation'}
        </button>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {/* Click Prediction */}
          <div className="bg-surface-container-low border border-outline-variant p-stack-lg rounded-xl glow-indigo">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">ads_click</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isDegraded ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${
                  isDegraded ? 'bg-amber-500' : 'bg-green-500'
                }`}></span>
                {isDegraded ? 'DEGRADED' : 'ONLINE'}
              </span>
            </div>
            <h3 className="font-title-lg text-title-lg text-on-surface">Click Prediction</h3>
            <p className="text-xs text-on-surface-variant mt-1">XGBoost / LightGBM Ensemble v4.2</p>
            <div className="mt-4 pt-4 border-t border-outline-variant/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label-md text-on-surface-variant uppercase tracking-wider">AUC-ROC</span>
                <span className={`text-label-md font-bold font-mono ${isDegraded ? 'text-amber-500' : 'text-primary'}`}>
                  {isDegraded ? '0.743' : '0.812'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
                <span>Retrained 2h ago · Next in 22h</span>
                <span>8%</span>
              </div>
              <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary" style={{ width: '8%' }}></div>
              </div>
            </div>
          </div>

          {/* Fraud Detection */}
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
            <div className="mt-4 pt-4 border-t border-outline-variant/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Avg latency</span>
                <span className="text-label-md font-bold text-primary font-mono">14ms</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
                <span>Retrained 45min ago · Next in 23h</span>
                <span>3%</span>
              </div>
              <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary" style={{ width: '3%' }}></div>
              </div>
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
            <div className="mt-4 pt-4 border-t border-outline-variant/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Coverage</span>
                <span className="text-label-md font-bold text-primary font-mono">88.5%</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
                <span>Retrained 5h ago · Next in 1h</span>
                <span>79%</span>
              </div>
              <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary" style={{ width: '79%' }}></div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* REDESIGNED SECTION - SHAP & Prediction Stream */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* SHAP Feature Importance - REDESIGNED */}
        <section className="col-span-12 lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg flex flex-col justify-between">
          {/* Score Journey Bar - at the top */}
          {selectedPrediction && selectedShapData && (
            <div className="mb-6 p-3 bg-surface-container-high rounded-lg border border-outline-variant/30">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant flex-wrap">
                  <span className="px-2 py-1 bg-surface-container-lowest rounded">Base 0.50</span>
                  <span className="text-lg">→</span>
                  {selectedShapData.features
                    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
                    .slice(0, 3)
                    .map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-mono ${feat.positive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {feat.positive ? '↑' : '↓'} {feat.positive ? '+' : '-'}{Math.abs(feat.value).toFixed(2)}
                        </span>
                        <span className="text-lg">→</span>
                      </div>
                    ))}
                  <span className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg font-bold">
                    Final: {selectedPrediction.score}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                {selectedPrediction ? (
                  <>
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                      {selectedIsFraud 
                        ? `Why was ${selectedPrediction.user} flagged as fraud?`
                        : `Why did ${selectedPrediction.user} get score ${selectedPrediction.score}?`
                      }
                    </h3>
                    <p className="text-body-sm text-on-surface-variant mt-1">
                      {selectedIsFraud 
                        ? `Fraud score: ${selectedPrediction.score} · Real-time explanation`
                        : `Click probability: ${(selectedPrediction.score * 100).toFixed(0)}% · Feature breakdown`
                      }
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Model Explanation</h3>
                    <p className="text-body-md text-on-surface-variant">Select a prediction to inspect</p>
                  </>
                )}
              </div>
              
              {/* View Toggle Switch */}
              {selectedPrediction && !selectedIsFraud && (
                <div className="flex items-center gap-1 bg-surface-container-high rounded-lg p-1 border border-outline-variant">
                  <button
                    onClick={() => setViewMode('business')}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                      viewMode === 'business' 
                        ? 'bg-primary text-on-primary shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Business View
                  </button>
                  <button
                    onClick={() => setViewMode('ml')}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                      viewMode === 'ml' 
                        ? 'bg-primary text-on-primary shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    ML View
                  </button>
                </div>
              )}
            </div>

            {/* Content based on selection state */}
            {!selectedPrediction ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">ads_click</span>
                <h4 className="text-title-md text-on-surface font-semibold mb-2">Select a prediction to inspect</h4>
                <p className="text-body-md text-on-surface-variant mb-6 max-w-md">
                  Click any event in the live stream to see a full AI explanation of why that score was assigned
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 text-xs rounded-full border border-outline-variant text-on-surface-variant">User History</span>
                  <span className="px-3 py-1.5 text-xs rounded-full border border-outline-variant text-on-surface-variant">Ad Category</span>
                  <span className="px-3 py-1.5 text-xs rounded-full border border-outline-variant text-on-surface-variant">Time of Day</span>
                </div>
              </div>
            ) : selectedIsFraud ? (
              /* Fraud Signal Breakdown */
              <div className="space-y-5">
                {/* SECTION A - Top fraud signals */}
                <div>
                  <h4 className="text-label-md font-mono text-error mb-3">🚨 Top Fraud Signals</h4>
                  <div className="space-y-3">
                    {selectedShapData.features.slice(0, 3).map((signal, idx) => {
                      const threat = getThreatLevel(signal.value)
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-on-surface font-medium">{signal.plain}</span>
                            <span className={`text-xs font-mono px-2 py-0.5 rounded ${threat.label === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : threat.label === 'HIGH' ? 'bg-orange-500/20 text-orange-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                              {threat.label}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${threat.color}`} style={{ width: threat.width }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* SECTION B - Behavioral comparison */}
                <div>
                  <h4 className="text-label-md font-mono text-on-surface-variant mb-3">Behavioral Comparison</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <p className="text-[10px] font-mono text-green-500 mb-2">Normal User</p>
                      <div className="space-y-1 text-xs font-mono text-on-surface-variant">
                        <div className="flex justify-between"><span>Clicks/min:</span><span>2-4</span></div>
                        <div className="flex justify-between"><span>Session time:</span><span>4-8 min</span></div>
                        <div className="flex justify-between"><span>Scroll events:</span><span>15-30</span></div>
                        <div className="flex justify-between"><span>Mouse moves:</span><span>200+</span></div>
                      </div>
                    </div>
                    <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <p className="text-[10px] font-mono text-red-500 mb-2">This Session</p>
                      <div className="space-y-1 text-xs font-mono text-on-surface-variant">
                        <div className="flex justify-between"><span>Clicks/min:</span><span className="text-red-500">340</span></div>
                        <div className="flex justify-between"><span>Session time:</span><span className="text-red-500">12 sec</span></div>
                        <div className="flex justify-between"><span>Scroll events:</span><span className="text-red-500">0</span></div>
                        <div className="flex justify-between"><span>Mouse moves:</span><span className="text-red-500">3</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION C - Action taken */}
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-500 font-mono flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">block</span>
                    Click NOT attributed to campaign · Advertiser budget protected · Flagged for review
                  </p>
                </div>
              </div>
            ) : viewMode === 'business' ? (
              /* Business View - Human-readable cards */
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedShapData.features.map((feature, idx) => {
                  const impact = getImpactLevel(feature.value)
                  const subtitle = getFeatureSubtitle(feature.feature, feature.value, feature.positive)
                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-lg border transition-all ${
                        feature.positive 
                          ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40' 
                          : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-sm ${feature.positive ? 'text-green-500' : 'text-red-500'}`}>
                            {feature.positive ? 'check_circle' : 'cancel'}
                          </span>
                          <span className="font-semibold text-on-surface">{feature.plain}</span>
                        </div>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${impact.color}`}>
                          {impact.label}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant ml-7">{subtitle}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* ML View - SHAP bar chart */
              <div>
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedShapData.features.map((feature, idx) => {
                    const isPositive = feature.positive
                    const absValue = Math.abs(feature.value)
                    const maxAbsValue = Math.max(...selectedShapData.features.map(f => Math.abs(f.value)))
                    const widthPercent = Math.min((absValue / maxAbsValue) * 100, 100)
                    
                    return (
                      <div key={idx} className="flex items-center group">
                        <div className="w-40 text-label-md font-mono text-on-surface-variant truncate pr-4">{feature.feature}</div>
                        <div className="flex-1 h-8 flex items-center relative">
                          <div className="absolute left-1/2 w-px h-full bg-outline-variant z-10"></div>
                          
                          {isPositive && (
                            <div 
                              className="h-full bg-primary rounded-r-sm transition-all group-hover:bg-primary-container absolute"
                              style={{ 
                                left: '50%', 
                                width: `${widthPercent}%`,
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0
                              }}
                            />
                          )}
                          
                          {!isPositive && (
                            <div 
                              className="h-full bg-error rounded-l-sm transition-all group-hover:bg-red-400 absolute"
                              style={{ 
                                right: '50%', 
                                width: `${widthPercent}%`,
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0
                              }}
                            />
                          )}
                        </div>
                        <div className={`w-16 text-right font-mono text-label-md ml-4 ${isPositive ? 'text-primary' : 'text-error'}`}>
                          {isPositive ? '+' : '-'}{absValue.toFixed(2)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer - only show in ML view or fraud view */}
          {selectedPrediction && !selectedIsFraud && viewMode === 'ml' && (
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
          )}
        </section>

        {/* Live Prediction Feed - Clickable Terminal */}
        <section className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col h-[400px]">
          <div className="bg-surface-container-high px-4 py-2 border-b border-outline-variant flex items-center justify-between shrink-0">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-error/40"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary/40"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"></div>
            </div>
            <span className="text-label-md font-mono text-on-surface-variant">PREDICTION_STREAM:LIVE</span>
          </div>
          
          <div ref={terminalEndRef} className="p-4 flex-1 font-mono text-[12px] overflow-y-auto custom-scrollbar bg-surface-container-lowest">
            <div className="space-y-2">
              {stream.map((log, index) => (
                <div 
                  key={index} 
                  onClick={() => {
                    setSelectedPrediction(log)
                    setSelectedShapData(log.shapData)
                    setSelectedIsFraud(log.isFraud)
                    setViewMode('business')
                  }}
                  className={`flex justify-between items-start font-mono p-2 rounded cursor-pointer transition-all ${
                    selectedPrediction?.user === log.user && selectedPrediction?.time === log.time
                      ? 'bg-primary/10 border-l-4 border-l-primary pl-3'
                      : 'hover:bg-surface-container-high'
                  }`}
                >
                  <span className="text-on-surface-variant text-[11px]">[{log.time}]</span>
                  <span className="text-tertiary text-[11px] font-bold">{log.user}</span>
                  <span className={`px-1.5 rounded text-[11px] font-bold ${log.isFraud ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                    {log.metric}
                  </span>
                </div>
              ))}
              <div className="pt-2 text-primary/60 italic flex items-center font-mono text-[11px]">
                <span className="material-symbols-outlined text-xs mr-1">ads_click</span>
                Click any prediction to inspect
              </div>
            </div>
          </div>
        </section>
      </div>

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
      </div>

      {/* Per-Ad Intelligence Drill-Down Panel */}
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg col-span-12">
        <div className="mb-6">
          <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Per-Ad Intelligence</h3>
          <p className="text-body-md text-on-surface-variant">ML scores and explainability for individual ads</p>
        </div>
        
        <div className="space-y-3">
          {adsData.map((ad) => (
            <div key={ad.id} className="border border-outline-variant rounded-lg overflow-hidden">
              {/* Main row */}
              <div className="p-4 bg-surface-container-lowest hover:bg-surface-container-high transition-colors">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-12 md:col-span-2">
                    <p className="font-semibold text-on-surface">{ad.name}</p>
                    <p className="text-xs text-on-surface-variant">{ad.category}</p>
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-mono border ${getClickProbColor(ad.clickProbability)}`}>
                      {(ad.clickProbability * 100).toFixed(0)}% click prob
                    </span>
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-mono border ${getFraudRiskColor(ad.fraudRisk)}`}>
                      {ad.fraudRisk} risk
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <p className="text-xs font-mono text-on-surface-variant truncate">{ad.shapReason}</p>
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <button
                      onClick={() => toggleAdExpansion(ad.id)}
                      className="w-full text-xs text-primary hover:text-primary/80 font-mono flex items-center justify-center gap-1"
                    >
                      {ad.expanded ? 'Hide Explanation' : 'View Full Explanation'}
                      <span className="material-symbols-outlined text-sm">{ad.expanded ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expanded section */}
              {ad.expanded && (
                <div className="border-t border-outline-variant/30 p-4 bg-surface-container-high">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Mini SHAP chart */}
                    <div>
                      <p className="text-xs font-mono text-primary mb-3">Feature Impact for this Ad</p>
                      <div className="space-y-2">
                        {ad.shapFeatures.map((feature, idx) => (
                          <div key={idx} className="flex items-center">
                            <div className="w-32 text-[10px] font-mono text-on-surface-variant truncate">{feature.name}</div>
                            <div className="flex-1 h-4 bg-surface-container-lowest rounded overflow-hidden">
                              <div 
                                className={`h-full ${feature.value >= 0 ? 'bg-primary' : 'bg-error'}`}
                                style={{ 
                                  width: `${Math.min(Math.abs(feature.value) * 100, 100)}%`,
                                  marginLeft: feature.value < 0 ? 'auto' : '0'
                                }}
                              />
                            </div>
                            <div className={`w-12 text-right text-[10px] font-mono ml-2 ${feature.value >= 0 ? 'text-primary' : 'text-error'}`}>
                              {feature.value >= 0 ? '+' : ''}{feature.value.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Other metrics */}
                    <div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-mono">Recommendation Confidence</p>
                          <p className="text-sm font-mono text-primary">{(ad.confidence * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-mono">Targeted Segments</p>
                          <p className="text-xs text-on-surface">{ad.segments.join(' · ')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-mono">Ad Performance</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-primary">{ad.filteredClicks} filtered clicks</span>
                            <span className="text-xs text-on-surface-variant">vs</span>
                            <span className="text-xs text-on-surface-variant line-through">{ad.rawClicks} raw clicks</span>
                            <span className="text-xs text-green-500">-{Math.round((1 - ad.filteredClicks/ad.rawClicks) * 100)}% fraud filtered</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-12 gap-gutter">
      </div>
    </div>
  )
}