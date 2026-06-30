// src/pages/Analytics.jsx
// Orchestrator — composes all analytics sub-components, backed entirely by
// useAnalytics() + useAnalyticsWebSocket().

import { useState } from 'react'
import { getDateRange, generateToastId } from '@/utils/analyticsHelpers'
import { exportCSV, exportPDF, exportExcel, scheduleAnalyticsExport } from '@/services/analyticsService'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAnalyticsWebSocket } from '@/hooks/useAnalyticsWebSocket'

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
  const {
    overview, setOverview,
    ctrTrend, setCtrTrend,
    terminalLogs, setTerminalLogs,
    fraudMonitor, setFraudMonitor,
    loading, error,
  } = useAnalytics()

  useAnalyticsWebSocket(setOverview, setTerminalLogs, setFraudMonitor, setCtrTrend)

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

  const handleScheduleSubmit = async () => {
    if (!scheduleEmail.trim()) { addToast('error', 'Please enter an email address'); return }
    try {
      await scheduleAnalyticsExport({ email: scheduleEmail, day: scheduleDay, format: scheduleFormat })
      addToast('success', `Weekly export scheduled! Reports will be sent to ${scheduleEmail} every ${scheduleDay} in ${scheduleFormat} format.`)
      setIsScheduleOpen(false)
      setScheduleEmail('')
    } catch {
      addToast('error', 'Failed to schedule export. Please try again.')
    }
  }

  const handleExportCSV = async () => {
    try {
      await exportCSV()
      addToast('success', 'CSV exported successfully!')
    } catch {
      addToast('error', 'CSV export failed. Please try again.')
    }
  }

  const handleExportPDF = async () => {
    try {
      addToast('info', 'PDF export in progress...')
      await exportPDF()
      addToast('success', 'PDF exported successfully!')
    } catch {
      addToast('error', 'PDF export failed. Please try again.')
    }
  }

  const handleExportExcel = async () => {
    try {
      addToast('info', 'Excel export in progress...')
      await exportExcel()
      addToast('success', 'Excel exported successfully!')
    } catch {
      addToast('error', 'Excel export failed. Please try again.')
    }
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
        activeUsers={overview.active_users}     eventsPerSec={overview.events_per_second}
        bidLatency={overview.avg_bid_latency}    fraudRate={overview.fraud_rate}
        prevUsers={overview.previous_active_users}      prevEvents={overview.previous_events_per_second}
        prevLatency={overview.previous_avg_bid_latency} prevFraud={overview.previous_fraud_rate}
      />

      {/* Toolbar */}
      <AnalyticsToolbar
        isConnected={!error}
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
        <LiveCTRPanel
          ctrPoints={ctrTrend.points.map(p => ({ value: p.ctr, time: p.timestamp }))}
          currentCTR={ctrTrend.current_ctr}
        />
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