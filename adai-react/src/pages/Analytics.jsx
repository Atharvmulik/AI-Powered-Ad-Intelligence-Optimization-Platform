// src/pages/Analytics.jsx
// Orchestrator — owns shared cross-component state (KPIs, CTR chart, toasts,
// date range, modals, export checkboxes) and composes all analytics sub-components.

import { useState, useEffect } from 'react'
import { rand, randInt, getDateRange, generateToastId } from '@/utils/analyticsHelpers'

// Layout / animation
import AnalyticsAnimations      from '@/components/analytics/AnalyticsAnimations'
import { ToastContainer }       from '@/components/analytics/Toast'

// Modals
import ComparePeriodModal       from '@/components/analytics/ComparePeriodModal'
import ScheduleExportModal      from '@/components/analytics/ScheduleExportModal'

// Sections
import AnalyticsKpiStrip        from '@/components/analytics/AnalyticsKpiStrip'
import AnalyticsToolbar         from '@/components/analytics/AnalyticsToolbar'
import LiveCTRPanel             from '@/components/analytics/LiveCTRPanel'
import ClickDistribution        from '@/components/analytics/ClickDistribution'
import EngagementPanel          from '@/components/analytics/EngagementPanel'
import DeviceSplit              from '@/components/analytics/DeviceSplit'
import TopAdsPanel              from '@/components/analytics/TopAdsPanel'
import AiGrowthPrediction       from '@/components/analytics/AiGrowthPrediction'
import UserInterests            from '@/components/analytics/UserInterests'
import ConversionFunnel         from '@/components/analytics/ConversionFunnel'
import AdPlacementPerformance   from '@/components/analytics/AdPlacementPerformance'
import DataExportConsole        from '@/components/analytics/DataExportConsole'
import FraudDetectionMonitor    from '@/components/analytics/FraudDetectionMonitor'
import CampaignPerformanceTable from '@/components/analytics/CampaignPerformanceTable'
import AnalyticsTerminal        from '@/components/analytics/AnalyticsTerminal'

const INITIAL_EXPORT_SELECTIONS = {
  'Campaign Performance Metrics':    true,
  'Audience Demographic Data':       true,
  'Fraud Detection Log (Detailed)':  false,
  'AI Forecasting & Trends':         true,
}

export default function Analytics() {
  // ── KPI state ──────────────────────────────────────────────────────────────
  const [activeUsers,   setActiveUsers]   = useState(1240)
  const [eventsPerSec,  setEventsPerSec]  = useState(14200)
  const [bidLatency,    setBidLatency]    = useState(42)
  const [fraudRate,     setFraudRate]     = useState(3.2)

  const [prevUsers,     setPrevUsers]     = useState(1240)
  const [prevEvents,    setPrevEvents]    = useState(14200)
  const [prevLatency,   setPrevLatency]   = useState(42)
  const [prevFraud,     setPrevFraud]     = useState(3.2)

  // ── CTR chart state ────────────────────────────────────────────────────────
  const [ctrPoints, setCtrPoints] = useState(() => {
    const now = Date.now()
    return Array.from({ length: 20 }, (_, i) => ({
      value: parseFloat(rand(1.8, 3.4).toFixed(2)),
      time: now - (19 - i) * 5000,
    }))
  })
  const [currentCTR, setCurrentCTR] = useState(2.84)

  // ── Toast state ────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([])
  const addToast = (type, message) => {
    const id = generateToastId()
    setToasts(prev => [...prev, { id, type, message }])
  }
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  // ── Date range state ───────────────────────────────────────────────────────
  const [dateRangePreset,   setDateRangePreset]   = useState('Last 30 Days')
  const [dateRangeDisplay,  setDateRangeDisplay]  = useState(() => getDateRange('Last 30 Days').display)

  // ── Modal state ────────────────────────────────────────────────────────────
  const [isCompareOpen,         setIsCompareOpen]         = useState(false)
  const [isScheduleOpen,        setIsScheduleOpen]        = useState(false)
  const [comparePeriodBPreset,  setComparePeriodBPreset]  = useState('Last 7 Days')

  // ── Schedule form state ────────────────────────────────────────────────────
  const [scheduleEmail,   setScheduleEmail]   = useState('')
  const [scheduleDay,     setScheduleDay]     = useState('Monday')
  const [scheduleFormat,  setScheduleFormat]  = useState('CSV')

  // ── Export checkboxes ──────────────────────────────────────────────────────
  const [selectedExports, setSelectedExports] = useState(INITIAL_EXPORT_SELECTIONS)

  // ── KPI live intervals ─────────────────────────────────────────────────────
  useEffect(() => {
    const u = setInterval(() => { setActiveUsers(prev  => { setPrevUsers(prev);    return prev + randInt(-5, 5) }) },     3000)
    const e = setInterval(() => { setEventsPerSec(prev => { setPrevEvents(prev);   return prev + randInt(-200, 200) }) }, 2000)
    const l = setInterval(() => { setBidLatency(prev   => { setPrevLatency(prev);  return Math.max(30, prev + randInt(-3, 3)) }) }, 4000)
    const f = setInterval(() => { setFraudRate(prev    => { setPrevFraud(prev);    return parseFloat(Math.max(0, prev + rand(-0.1, 0.1)).toFixed(1)) }) }, 5000)
    return () => { clearInterval(u); clearInterval(e); clearInterval(l); clearInterval(f) }
  }, [])

  // ── CTR chart interval ─────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const v = parseFloat(rand(1.8, 3.4).toFixed(2))
      setCurrentCTR(v)
      setCtrPoints(prev => [...prev.slice(1), { value: v, time: Date.now() }])
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // ── WebSocket simulation ───────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const v = parseFloat(rand(1.8, 3.4).toFixed(2))
      setCurrentCTR(v)
      setActiveUsers(prev  => prev + randInt(-5, 5))
      setEventsPerSec(prev => prev + randInt(-200, 200))
      setFraudRate(prev    => parseFloat(Math.max(0, prev + rand(-0.05, 0.05)).toFixed(1)))
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDatePresetSelect = (preset) => {
    if (preset === 'Custom Range') { addToast('info', 'Custom range coming soon!'); return }
    const range = getDateRange(preset)
    setDateRangePreset(preset)
    setDateRangeDisplay(range.display)
  }

  const handleCompare = () => {
    const periodA = getDateRange(dateRangePreset)
    const periodB = getDateRange(comparePeriodBPreset)
    addToast('success', `Comparison active: ${periodA.display} vs ${periodB.display}`)
    setIsCompareOpen(false)
  }

  const handleScheduleSubmit = () => {
    if (!scheduleEmail.trim()) { addToast('error', 'Please enter an email address'); return }
    addToast('success', `Weekly export scheduled! Reports will be sent to ${scheduleEmail} every ${scheduleDay} in ${scheduleFormat} format.`)
    setIsScheduleOpen(false)
    setScheduleEmail('')
  }

  const handleExportCSV = () => {
    const rows = [
      ['Campaign', 'Clicks', 'CTR', 'Spend', 'ROAS'],
      ['Nike Air Max Summer',  '45821', '4.8%', '420000', '4.8x'],
      ['ASUS ROG Laptop Deal', '31440', '3.9%', '280000', '3.1x'],
      ['Groww Invest Now',     '18220', '3.2%', '150000', '2.4x'],
      ['MuscleBlaze Whey',     '12005', '2.8%', '95000',  '6.2x'],
      ['Noise ColorFit Pro',   '8440',  '2.1%', '75000',  '1.8x'],
    ]
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `adai-analytics-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addToast('success', 'CSV exported successfully!')
  }

  const handleExportPDF = () => {
    addToast('info', 'PDF export queued — ready in ~10 seconds')
    setTimeout(() => addToast('success', `PDF ready! adai-report-${new Date().toISOString().split('T')[0]}.pdf downloaded`), 10000)
  }

  const handleExportExcel = () => {
    addToast('info', 'Excel export queued — ready in ~10 seconds')
    setTimeout(() => addToast('success', `Excel ready! adai-report-${new Date().toISOString().split('T')[0]}.xlsx downloaded`), 10000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    addToast('success', 'Dashboard link copied to clipboard!')
  }

  const handleExportCheckboxChange = (label) => {
    setSelectedExports(prev => ({ ...prev, [label]: !prev[label] }))
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-gutter">
      <AnalyticsAnimations />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Modals */}
      <ComparePeriodModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onCompare={handleCompare}
        currentRangeDisplay={dateRangeDisplay}
        comparePeriodBPreset={comparePeriodBPreset}
        onComparePeriodBChange={setComparePeriodBPreset}
      />
      <ScheduleExportModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSubmit={handleScheduleSubmit}
        email={scheduleEmail}
        onEmailChange={setScheduleEmail}
        day={scheduleDay}
        onDayChange={setScheduleDay}
        format={scheduleFormat}
        onFormatChange={setScheduleFormat}
      />

      {/* KPI strip */}
      <AnalyticsKpiStrip
        activeUsers={activeUsers}   eventsPerSec={eventsPerSec}
        bidLatency={bidLatency}     fraudRate={fraudRate}
        prevUsers={prevUsers}       prevEvents={prevEvents}
        prevLatency={prevLatency}   prevFraud={prevFraud}
      />

      {/* Toolbar */}
      <AnalyticsToolbar
        dateRangeDisplay={dateRangeDisplay}
        dateRangePreset={dateRangePreset}
        onDatePresetSelect={handleDatePresetSelect}
        onCompareOpen={() => setIsCompareOpen(true)}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onCopyLink={handleCopyLink}
      />

      {/* Bento row 1: CTR chart + Click Distribution */}
      <div className="grid grid-cols-12 gap-gutter items-stretch">
        <LiveCTRPanel ctrPoints={ctrPoints} currentCTR={currentCTR} />
        <ClickDistribution />
      </div>

      {/* Bento row 2: Engagement + Device Split + Top Ads */}
      <div className="grid grid-cols-12 gap-gutter items-stretch">
        <EngagementPanel />
        <DeviceSplit />
        <TopAdsPanel />
      </div>

      {/* Row 3: AI Growth + User Interests + Conversion Funnel */}
      <div className="grid grid-cols-12 gap-gutter">
        <AiGrowthPrediction />
        <UserInterests />
        <ConversionFunnel />
      </div>

      {/* Ad Placement Performance */}
      <div className="grid grid-cols-12 gap-gutter">
        <AdPlacementPerformance />
      </div>

      {/* Data Export Console + Fraud Detection */}
      <div className="grid grid-cols-12 gap-gutter">
        <DataExportConsole
          selectedExports={selectedExports}
          onCheckboxChange={handleExportCheckboxChange}
          onScheduleOpen={() => setIsScheduleOpen(true)}
        />
        <FraudDetectionMonitor />
      </div>

      {/* Campaign Performance Table */}
      <CampaignPerformanceTable />

      {/* Terminal */}
      <AnalyticsTerminal />
    </div>
  )
}