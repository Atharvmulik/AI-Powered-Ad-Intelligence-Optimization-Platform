// ============================================================
// src/pages/AdManagement.jsx
// ============================================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

// Only keep allowedAudienceTags and keywordSuggestions from mock data
// Everything else now comes from the API
import {
  allowedAudienceTags,
  keywordSuggestions,
} from '@/constants/adManagementMockData'

import CampaignPortfolioTable from '@/components/adManagement/CampaignPortfolioTable'
import CreativeForm from '@/components/adManagement/CreativeForm/CreativeForm'
import NetworkHealthScore from '@/components/adManagement/NetworkHealthScore'
import OptimizationFeed from '@/components/adManagement/OptimizationFeed'
import GlobalStatusChart from '@/components/adManagement/GlobalStatusChart'
import AnalysisTerminal from '@/components/adManagement/AnalysisTerminal'

import { adManagementService, createAnalysisLogSocket } from '@/services/adManagementService'

import {
  adaptCampaign,
  adaptNetworkHealth,
  adaptOptimizationFeed,
  adaptGlobalStatus,
  adaptLogMessage,
} from '@/utils/adManagementAdapters'

export default function AdManagement() {

  // -------------------------------------------------------------------------
  // API data state
  // -------------------------------------------------------------------------
  const [campaigns, setCampaigns] = useState([])
  const [networkHealth, setNetworkHealth] = useState({
    score: 0,
    label: '...',
    quote: '',
    gaugeOffset: 502.65,
  })
  const [optimizationItems, setOptimizationItems] = useState([])
  const [globalStatus, setGlobalStatus]   = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)

  // Deploy state
  const [deployLoading, setDeployLoading] = useState(false)
  const [deployError, setDeployError]     = useState('')
  const [deploySuccess, setDeploySuccess] = useState('')

  // -------------------------------------------------------------------------
  // WebSocket / terminal state
  // -------------------------------------------------------------------------
  const [logs, setLogs]       = useState([])
  const terminalEndRef        = useRef(null)
  const wsRef                 = useRef(null)

  // -------------------------------------------------------------------------
  // Gauge animation state (separate from networkHealth so we can animate)
  // -------------------------------------------------------------------------
  const [gaugeOffset, setGaugeOffset] = useState(502.65)

  // -------------------------------------------------------------------------
  // Form state
  // -------------------------------------------------------------------------
  const [campaignTitle, setCampaignTitle]         = useState('')
  const [dailyBudget, setDailyBudget]             = useState('')
  const [adFormat, setAdFormat]                   = useState('Banner')
  const [startDate, setStartDate]                 = useState('')
  const [endDate, setEndDate]                     = useState('')
  const [bidStrategy, setBidStrategy]             = useState('CPC')
  const [adCategory, setAdCategory]               = useState('Technology')
  const [keywords, setKeywords]                   = useState([])
  const [newKeywordInput, setNewKeywordInput]     = useState('')
  const [showKeywordInput, setShowKeywordInput]   = useState(false)
  const [tags, setTags]                           = useState(['Gen-Z', 'Urban Commuters', 'Tech Early Adopters'])
  const [newTagInput, setNewTagInput]             = useState('')
  const [showAddTag, setShowAddTag]               = useState(false)
  const [tagValidationError, setTagValidationError] = useState('')

  // -------------------------------------------------------------------------
  // Load all REST data on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true)
        setError(null)

  console.log("Loading campaigns...")
const campaignsRaw =
await adManagementService.getCampaigns()

console.log("Campaigns finished")

console.log("Loading network")
const healthRaw =
await adManagementService.getNetworkHealth()

console.log("Network finished")

console.log("Loading feed")
const feedRaw =
await adManagementService.getOptimizationFeed()

console.log("Feed finished")

console.log("Loading global")
const statusRaw =
await adManagementService.getGlobalStatus()

console.log("Global finished")
          console.log("campaignsRaw =", campaignsRaw)
console.log("healthRaw =", healthRaw)
console.log("feedRaw =", feedRaw)
console.log("statusRaw =", statusRaw)

console.log(
  "campaignsRaw is array:",
  Array.isArray(campaignsRaw)
)
        setCampaigns(campaignsRaw.map(adaptCampaign))

        const health = adaptNetworkHealth(healthRaw)
        setNetworkHealth(health)
        // Slight delay so CSS transition plays visibly
        setTimeout(() => setGaugeOffset(health.gaugeOffset), 150)

        setOptimizationItems(adaptOptimizationFeed(feedRaw))
        setGlobalStatus(adaptGlobalStatus(statusRaw))

      } catch (err) {
        console.error('AdManagement load error:', err)
        setError('Failed to load data. Is your backend running on port 8000?')
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [])

  // // -------------------------------------------------------------------------
  // // WebSocket — Analysis Terminal
  // // -------------------------------------------------------------------------
  // useEffect(() => {
  //   wsRef.current = createAnalysisLogSocket(
  //     (data) => {
  //       const entry = adaptLogMessage(data)
  //       setLogs((prev) => {
  //         const next = [...prev, entry]
  //         return next.length > 15 ? next.slice(next.length - 15) : next
  //       })
  //     },
  //     (err) => console.error('WS error:', err)
  //   )

  //   return () => {
  //     if (wsRef.current) wsRef.current.close()
  //   }
  // }, [])

  // // Auto-scroll terminal on new logs
  // useEffect(() => {
  //   if (terminalEndRef.current) {
  //     terminalEndRef.current.scrollTop =
  //       terminalEndRef.current.scrollHeight
  //   }
  // }, [logs])

  // -------------------------------------------------------------------------
  // Derived values (no useEffect needed — computed inline)
  // -------------------------------------------------------------------------
  const tagAutocompleteSuggestions = useMemo(() => {
    if (!newTagInput.trim()) return []
    return allowedAudienceTags
      .filter((t) =>
        t.toLowerCase().includes(newTagInput.toLowerCase())
      )
      .slice(0, 5)
  }, [newTagInput])

  const dateError = useMemo(() => {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return 'End date must be after start date'
    }
    return ''
  }, [startDate, endDate])

  const getDurationInDays = () => {
    if (startDate && endDate && !dateError) {
      return Math.ceil(
        Math.abs(new Date(endDate) - new Date(startDate)) /
          (1000 * 60 * 60 * 24)
      )
    }
    return null
  }

  const isDeployDisabled =
    deployLoading ||
    !campaignTitle.trim() ||
    !dailyBudget ||
    parseFloat(dailyBudget) === 0 ||
    tags.length === 0 ||
    !startDate ||
    !endDate ||
    !!dateError

  // -------------------------------------------------------------------------
  // Tag handlers
  // -------------------------------------------------------------------------
  const handleAddTag = (tagToAdd) => {
    const trimmed = tagToAdd.trim()
    if (!trimmed || tags.includes(trimmed)) return
    if (allowedAudienceTags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setNewTagInput('')
      setShowAddTag(false)
      setTagValidationError('')
    } else {
      setTagValidationError('Please select a valid audience segment')
    }
  }

  const handleRemoveTag = (tag) =>
    setTags(tags.filter((t) => t !== tag))

  // -------------------------------------------------------------------------
  // Keyword handlers
  // -------------------------------------------------------------------------
  const handleAddKeyword = (kw) => {
    const trimmed = kw.trim()
    if (!trimmed || keywords.includes(trimmed)) return
    setKeywords([...keywords, trimmed])
    setNewKeywordInput('')
    setShowKeywordInput(false)
  }

  const handleRemoveKeyword = (kw) =>
    setKeywords(keywords.filter((k) => k !== kw))

  // -------------------------------------------------------------------------
  // Discard draft
  // -------------------------------------------------------------------------
  const handleDiscardDraft = () => {
    setCampaignTitle('')
    setDailyBudget('')
    setAdFormat('Banner')
    setStartDate('')
    setEndDate('')
    setBidStrategy('CPC')
    setAdCategory('Technology')
    setKeywords([])
    setTags(['Gen-Z', 'Urban Commuters', 'Tech Early Adopters'])
    setShowAddTag(false)
    setShowKeywordInput(false)
    setNewTagInput('')
    setNewKeywordInput('')
    setTagValidationError('')
    setDeployError('')
    setDeploySuccess('')
  }

  // -------------------------------------------------------------------------
  // Deploy campaign → POST /api/v1/ad-management/campaigns
  // -------------------------------------------------------------------------
  const handleDeploy = async () => {
    setDeployLoading(true)
    setDeployError('')
    setDeploySuccess('')
    try {
      const payload = {
        campaign_name:       campaignTitle,
        daily_budget:        parseFloat(dailyBudget),
        ad_format:           adFormat,
        start_date:          startDate,
        end_date:            endDate,
        bid_strategy:        bidStrategy,
        target_demographics: tags,
        category:            adCategory,
        keywords:            keywords,
      }
      const created = await adManagementService.createCampaign(payload)
      // Prepend new campaign to table immediately (optimistic update)
      setCampaigns((prev) => [adaptCampaign(created), ...prev])
      setDeploySuccess(
        `Campaign "${created.campaign_name}" deployed successfully!`
      )
      handleDiscardDraft()
    } catch (err) {
      setDeployError(err.message || 'Failed to deploy campaign.')
    } finally {
      setDeployLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // Apply optimization recommendation
  // -------------------------------------------------------------------------
  const handleApplyRecommendation = useCallback(async (itemId) => {
    try {
      await adManagementService.applyRecommendation(itemId)
        const [feedRaw, healthRaw] = await Promise.all([
          adManagementService.getOptimizationFeed(),
          adManagementService.getNetworkHealth(),
])
      setOptimizationItems(adaptOptimizationFeed(feedRaw))
      const health = adaptNetworkHealth(healthRaw)
      setNetworkHealth(health)
      setGaugeOffset(health.gaugeOffset)
    } catch (err) {
      console.error('Apply recommendation failed:', err)
    }
  }, [])

  // -------------------------------------------------------------------------
  // Error screen
  // -------------------------------------------------------------------------
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-red-400 text-4xl">
            error
          </span>
          <p className="text-red-400">{error}</p>
          <button
            className="text-primary text-sm underline"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-stack-lg">

      {/* Header */}
      <section className="flex justify-between items-end">
        <p className="text-on-surface-variant font-body-md">
          Real-time intelligence and asset distribution across networks.
        </p>
      </section>

      {/* Deploy feedback banners */}
      {deploySuccess && (
        <div className="bg-green-900/30 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{deploySuccess}</span>
          <button onClick={() => setDeploySuccess('')}>
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
      {deployError && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{deployError}</span>
          <button onClick={() => setDeployError('')}>
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

        {/* Left column */}
        <div className="lg:col-span-8 space-y-stack-lg">

          <CampaignPortfolioTable
            campaigns={campaigns}
            activeCount={
              campaigns.filter((c) => c.status === 'Active').length
            }
            isLoading={loading}
          />

          <CreativeForm
            campaignTitle={campaignTitle}
            onCampaignTitleChange={setCampaignTitle}
            dailyBudget={dailyBudget}
            onDailyBudgetChange={setDailyBudget}
            adFormat={adFormat}
            onAdFormatChange={setAdFormat}
            bidStrategy={bidStrategy}
            onBidStrategyChange={setBidStrategy}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            dateError={dateError}
            tags={tags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            showAddTag={showAddTag}
            onShowAddTagChange={setShowAddTag}
            newTagInput={newTagInput}
            onNewTagInputChange={setNewTagInput}
            tagAutocompleteSuggestions={tagAutocompleteSuggestions}
            tagValidationError={tagValidationError}
            adCategory={adCategory}
            onAdCategoryChange={setAdCategory}
            keywords={keywords}
            onAddKeyword={handleAddKeyword}
            onRemoveKeyword={handleRemoveKeyword}
            showKeywordInput={showKeywordInput}
            onShowKeywordInputChange={setShowKeywordInput}
            newKeywordInput={newKeywordInput}
            onNewKeywordInputChange={setNewKeywordInput}
            keywordSuggestions={keywordSuggestions}
            durationDays={getDurationInDays()}
            isDeployDisabled={isDeployDisabled}
            onDiscardDraft={handleDiscardDraft}
            onDeploy={handleDeploy}
            deployLoading={deployLoading}
          />
        </div>

        {/* Right column */}
        <aside className="lg:col-span-4 space-y-stack-lg">

          <NetworkHealthScore
            score={networkHealth.score}
            label={networkHealth.label}
            gaugeOffset={gaugeOffset}
            quote={networkHealth.quote}
          />

          <OptimizationFeed
            items={optimizationItems}
            onApply={handleApplyRecommendation}
          />

          <GlobalStatusChart data={globalStatus} />

        </aside>
      </div>

      {/* Analysis Terminal */}
      <AnalysisTerminal ref={terminalEndRef} logs={logs} />

    </div>
  )
}