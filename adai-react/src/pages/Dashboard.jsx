import { useState } from 'react'
import { useInterval } from '@/hooks/useInterval'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import {
  INITIAL_EVENTS_HISTORY,
  INITIAL_FRAUD_ALERTS,
  INITIAL_CTR_HISTORY,
  INITIAL_CTR_TIMESTAMPS,
  INITIAL_TABLE_DATA,
  INITIAL_INFRA_STATUS,
  INITIAL_TERMINAL_LOGS,
  EXECUTIVE_SUMMARY,
  IP_POOL,
  FRAUD_CATEGORY_POOL,
  TERMINAL_LOG_POOL
} from '@/constants/mockData'

// Common & Dashboard sub-components
import KpiCard from '@/components/common/KpiCard'
import CtrTrendChart from '@/components/dashboard/CtrTrendChart'
import FraudAlertCenter from '@/components/dashboard/FraudAlertCenter'
import ShapExplainer from '@/components/dashboard/ShapExplainer'
import TerminalLogs from '@/components/dashboard/TerminalLogs'
import GeoTrafficMap from '@/components/dashboard/GeoTrafficMap'
import TopAdsTable from '@/components/dashboard/TopAdsTable'
import CampaignAnalytics from '@/components/dashboard/CampaignAnalytics'
import InfraStatus from '@/components/dashboard/InfraStatus'

export default function Dashboard() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [eventsRate, setEventsRate] = useState(14280)
  const [eventsHistory, setEventsHistory] = useState(INITIAL_EVENTS_HISTORY)
  const [fraudAlerts, setFraudAlerts] = useState(INITIAL_FRAUD_ALERTS)
  const [ctrHistory, setCtrHistory] = useState(INITIAL_CTR_HISTORY)
  const [ctrTimestamps, setCtrTimestamps] = useState(INITIAL_CTR_TIMESTAMPS)
  const [tableData] = useState(INITIAL_TABLE_DATA)
  
  const [rawClicks, setRawClicks] = useState(124567)
  const [fraudFilteredTotal, setFraudFilteredTotal] = useState(3450)
  const [conversionsTotal, setConversionsTotal] = useState(9450)
  const [revenueTotal, setRevenueTotal] = useState(420500)
  
  const [infraStatus, setInfraStatus] = useState(INITIAL_INFRA_STATUS)
  const [terminalLogs, setTerminalLogs] = useState(INITIAL_TERMINAL_LOGS)
  const [executiveSummary] = useState(EXECUTIVE_SUMMARY)

  // ==========================================
  // SIMULATION LOOPS (declarative & memory-safe)
  // ==========================================

  // 1. Kafka Ingestion throughput, counters & infra beats (1s)
  useInterval(() => {
    // Throughput fluctuation
    const delta = Math.floor(Math.random() * 150) - 70 // -70 to 80
    setEventsRate(prev => {
      const next = prev + delta
      const bounded = next < 13500 ? 13500 : next > 15000 ? 15000 : next
      setEventsHistory(h => [...h.slice(1), bounded])
      return bounded
    })

    // Click increment counters
    const clickInc = Math.floor(Math.random() * 4) + 1
    setRawClicks(prev => prev + clickInc)

    // Fraud count (20% chance)
    if (Math.random() < 0.2) {
      setFraudFilteredTotal(prev => prev + 1)
    }

    // Conversions (40% chance)
    if (Math.random() < 0.4) {
      setConversionsTotal(prev => prev + 1)
    }

    // Revenue increment
    const revInc = Math.floor(Math.random() * 350) + 50
    setRevenueTotal(prev => prev + revInc)

    // Infra beat updater
    setInfraStatus(prev =>
      prev.map(service => {
        const beat = Math.random() < 0.7 ? 0 : Math.min(service.lastBeat + 1, 9)
        return { ...service, lastBeat: beat }
      })
    )
  }, 1000)

  // 2. CTR Performance Live Chart Updater (5s)
  useInterval(() => {
    setCtrHistory(prev => {
      const lastVal = prev[prev.length - 1]
      const shift = parseFloat((Math.random() * 0.6 - 0.25).toFixed(2))
      const nextVal = Math.max(5.5, Math.min(13.5, parseFloat((lastVal + shift).toFixed(2))))
      
      const timeNow = new Date()
      const timeString = timeNow.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      
      setCtrTimestamps(t => [...t.slice(1), timeString])
      return [...prev.slice(1), nextVal]
    })
  }, 5000)

  // 3. Fraud Alert Center Feed Updates (7s)
  useInterval(() => {
    const randomIp = IP_POOL[Math.floor(Math.random() * IP_POOL.length)]
    const randomCat = FRAUD_CATEGORY_POOL[Math.floor(Math.random() * FRAUD_CATEGORY_POOL.length)]
    const score = parseFloat((0.80 + Math.random() * 0.19).toFixed(2))
    
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

  // 4. Pipeline terminal logs updates (4s)
  useInterval(() => {
    const timeNow = new Date()
    const timeString = timeNow.toLocaleTimeString('en-GB', { hour12: false })
    const randomLog = TERMINAL_LOG_POOL[Math.floor(Math.random() * TERMINAL_LOG_POOL.length)]

    setTerminalLogs(prev => {
      const next = [...prev, { time: timeString, ...randomLog }]
      return next.length > 25 ? next.slice(next.length - 25) : next
    })
  }, 4000)

  // ==========================================
  // HELPERS
  // ==========================================
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

  const activeCtr = ctrHistory[ctrHistory.length - 1]

  return (
    <div className="space-y-stack-lg max-w-full overflow-hidden">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-stack-lg">
        <KpiCard
          label="Total Clicks"
          value={formatNumber(rawClicks)}
          trendText="+12%"
          trendDirection="up"
          sparklineElement={
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d="M0 30 Q10 25 20 28 T40 15 T60 25 T80 5 T100 20" fill="none" stroke="#c0c1ff" strokeWidth="2"></path>
            </svg>
          }
        />
        
        <KpiCard
          label="CTR"
          value={`${activeCtr}%`}
          trendText="+1.2%"
          trendDirection="up"
          sparklineElement={
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d="M0 35 Q20 30 40 32 T60 20 T80 25 T100 10" fill="none" stroke="#c0c1ff" strokeWidth="2"></path>
            </svg>
          }
        />

        <KpiCard
          label="Active Users"
          value={formatNumber(conversionsTotal * 1.3)}
          trendText="+7.6%"
          trendDirection="up"
          sparklineElement={
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d="M0 38 Q25 35 50 20 T75 15 T100 5" fill="none" stroke="#c0c1ff" strokeWidth="2"></path>
            </svg>
          }
        />

        <KpiCard
          label="Fraud Score"
          value="LOW RISK"
          trendText="23/100"
          trendDirection="neutral"
          color="warning"
          sparklineElement={
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d="M0 10 Q25 15 50 18 T75 22 T100 25" fill="none" stroke="#ffb783" strokeWidth="2"></path>
            </svg>
          }
        />

        <KpiCard
          label="Revenue"
          value={formatCurrency(revenueTotal)}
          trendText="+18%"
          trendDirection="up"
          sparklineElement={
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d="M0 35 Q20 38 40 30 T60 15 T80 10 T100 2" fill="none" stroke="#c0c1ff" strokeWidth="2"></path>
            </svg>
          }
        />

        <KpiCard
          label="Events/sec"
          value={formatNumber(eventsRate)}
          trendText="+18%"
          trendDirection="success"
          showLivePulse
          subText="Kafka Event Throughput"
          sparklineElement={
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
              <path d={getSparklinePath(eventsHistory)} fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"></path>
            </svg>
          }
        />
      </div>

      {/* AI Summary and CTR Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        {/* Executive Summary Card */}
        <div className="lg:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
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

        {/* CTR Performance Line Graph */}
        <CtrTrendChart ctrHistory={ctrHistory} ctrTimestamps={ctrTimestamps} />
      </div>

      {/* Middle Row (Campaign Analytics, Ads Table, Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        <CampaignAnalytics
          rawClicks={rawClicks}
          fraudFilteredTotal={fraudFilteredTotal}
          conversionsTotal={conversionsTotal}
          revenueTotal={revenueTotal}
        />

        <TopAdsTable tableData={tableData} />

        <GeoTrafficMap />
      </div>

      {/* Bottom Row (Pipeline Monitor, Fraud Center) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        <TerminalLogs terminalLogs={terminalLogs} />

        <FraudAlertCenter fraudAlerts={fraudAlerts} />
      </div>

      {/* Explainable AI, Infra & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        <ShapExplainer />

        <InfraStatus infraStatus={infraStatus} />

        {/* AI Recommendations */}
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
