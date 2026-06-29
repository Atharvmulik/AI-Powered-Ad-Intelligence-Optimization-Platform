/**
 * useAudience.ts
 * ---------------------------------------------------------------------------
 * REST data hook for the Audience page. Owns overview, segments (with
 * filters/pagination), demographics, insights, and the segment CRUD
 * mutations — everything AudienceService.ts exposes except the WebSocket
 * feed, which lives in useAudienceWebSocket.ts (not generated yet), mirroring
 * the dashboard/campaigns split between use<Feature>.ts and
 * use<Feature>WebSocket.ts.
 *
 * `overview.live_active_now` returned here is the REST snapshot at fetch
 * time. Once useAudienceWebSocket.ts exists, the page should overlay its
 * live value on top of this one (e.g. `wsValue ?? overview?.live_active_now`)
 * rather than this hook polling for it.
 *
 * This file replaces hooks/useAudience.js (the mock-data version) — the
 * return shape is different, so consuming components will need updating
 * separately.
 */

import { useState, useEffect, useCallback } from 'react'
import AudienceService, {
  AudienceOverviewResponse,
  AudienceSegmentResponse,
  AudienceSegmentCreate,
  AudienceSegmentUpdate,
  AudienceDemographicsResponse,
  AudienceInsightResponse,
  ListAudienceSegmentsParams,
} from '../services/audienceService'

const DEFAULT_FILTERS: ListAudienceSegmentsParams = {
  sort_by: 'avg_ctr',
  page: 1,
  limit: 20,
}

export default function useAudience() {
  // ── Overview ──────────────────────────────────────────────────────────
  const [overview, setOverview] = useState<AudienceOverviewResponse | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState<string | null>(null)

  const refetchOverview = useCallback(async () => {
    setOverviewLoading(true)
    setOverviewError(null)
    try {
      const data = await AudienceService.getOverview()
      setOverview(data)
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : 'Failed to load audience overview')
    } finally {
      setOverviewLoading(false)
    }
  }, [])

  // ── Segments (filterable, sortable, paginated) ──────────────────────────
  const [segments, setSegments] = useState<AudienceSegmentResponse[]>([])
  const [segmentsTotal, setSegmentsTotal] = useState(0)
  const [segmentsTotalPages, setSegmentsTotalPages] = useState(0)
  const [segmentsLoading, setSegmentsLoading] = useState(true)
  const [segmentsError, setSegmentsError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<ListAudienceSegmentsParams>(DEFAULT_FILTERS)

  const refetchSegments = useCallback(async () => {
    setSegmentsLoading(true)
    setSegmentsError(null)
    try {
      const data = await AudienceService.listSegments(filters)
      setSegments(data.items)
      setSegmentsTotal(data.total)
      setSegmentsTotalPages(data.total_pages)
    } catch (err) {
      setSegmentsError(err instanceof Error ? err.message : 'Failed to load audience segments')
    } finally {
      setSegmentsLoading(false)
    }
  }, [filters])

  const setFilters = useCallback((next: Partial<ListAudienceSegmentsParams>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...next,
      // Any filter/search/sort change resets pagination, unless page itself
      // is the thing being changed.
      page: next.page ?? 1,
    }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }))
  }, [])

  // ── Demographics ─────────────────────────────────────────────────────
  const [demographics, setDemographics] = useState<AudienceDemographicsResponse | null>(null)
  const [demographicsLoading, setDemographicsLoading] = useState(true)
  const [demographicsError, setDemographicsError] = useState<string | null>(null)

  const refetchDemographics = useCallback(async () => {
    setDemographicsLoading(true)
    setDemographicsError(null)
    try {
      const data = await AudienceService.getDemographics()
      setDemographics(data)
    } catch (err) {
      setDemographicsError(
        err instanceof Error ? err.message : 'Failed to load audience demographics'
      )
    } finally {
      setDemographicsLoading(false)
    }
  }, [])

  // ── Insights (SHAP) ──────────────────────────────────────────────────
  const [insights, setInsights] = useState<AudienceInsightResponse[]>([])
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [insightsError, setInsightsError] = useState<string | null>(null)

  const refetchInsights = useCallback(async (limit = 3) => {
    setInsightsLoading(true)
    setInsightsError(null)
    try {
      const data = await AudienceService.getSegmentInsights(limit)
      setInsights(data.insights)
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : 'Failed to load segment insights')
    } finally {
      setInsightsLoading(false)
    }
  }, [])

  // ── Mutations (create / update / delete segment) ───────────────────────
  const [mutationLoading, setMutationLoading] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const createSegment = useCallback(
    async (payload: AudienceSegmentCreate): Promise<AudienceSegmentResponse> => {
      setMutationLoading(true)
      setMutationError(null)
      try {
        const created = await AudienceService.createSegment(payload)
        await Promise.all([refetchSegments(), refetchOverview()])
        return created
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create segment'
        setMutationError(message)
        throw err
      } finally {
        setMutationLoading(false)
      }
    },
    [refetchSegments, refetchOverview]
  )

  const updateSegment = useCallback(
    async (
      segmentId: number,
      payload: AudienceSegmentUpdate
    ): Promise<AudienceSegmentResponse> => {
      setMutationLoading(true)
      setMutationError(null)
      try {
        const updated = await AudienceService.updateSegment(segmentId, payload)
        await Promise.all([refetchSegments(), refetchOverview()])
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update segment'
        setMutationError(message)
        throw err
      } finally {
        setMutationLoading(false)
      }
    },
    [refetchSegments, refetchOverview]
  )

  const deleteSegment = useCallback(
    async (segmentId: number): Promise<void> => {
      setMutationLoading(true)
      setMutationError(null)
      try {
        await AudienceService.deleteSegment(segmentId)
        await Promise.all([refetchSegments(), refetchOverview()])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete segment'
        setMutationError(message)
        throw err
      } finally {
        setMutationLoading(false)
      }
    },
    [refetchSegments, refetchOverview]
  )

  // ── Initial + reactive fetches ───────────────────────────────────────
  useEffect(() => {
    refetchOverview()
  }, [refetchOverview])

  useEffect(() => {
    refetchSegments()
  }, [refetchSegments])

  useEffect(() => {
    refetchDemographics()
  }, [refetchDemographics])

  useEffect(() => {
    refetchInsights()
  }, [refetchInsights])

  return {
    // Overview
    overview,
    overviewLoading,
    overviewError,
    refetchOverview,

    // Segments
    segments,
    segmentsTotal,
    segmentsTotalPages,
    segmentsLoading,
    segmentsError,
    filters,
    setFilters,
    setPage,
    refetchSegments,

    // Demographics
    demographics,
    demographicsLoading,
    demographicsError,
    refetchDemographics,

    // Insights
    insights,
    insightsLoading,
    insightsError,
    refetchInsights,

    // Mutations
    createSegment,
    updateSegment,
    deleteSegment,
    mutationLoading,
    mutationError,
  }
}