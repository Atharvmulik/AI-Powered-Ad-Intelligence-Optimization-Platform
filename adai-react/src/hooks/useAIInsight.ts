// ============================================================
// src/hooks/useAIInsight.ts
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { aiInsightService } from '@/services/aiInsightService'
import type { AIInsightState } from '@/types/aiinsight'

const INITIAL_STATE: AIInsightState = {
  overview: null,
  modelStatus: null,
  predictions: null,
  shap: null,
  recommendations: null,
  audienceSegments: null,
  infrastructure: null,
  campaignInsight: null,
  loading: true,
  error: null,
}

export interface UseAIInsightOptions {
  /** Campaign to load a deep-dive insight for. Omit to skip the campaign-insight fetch. */
  campaignId?: number | string | null
  predictionsLimit?: number
  shapLimit?: number
  recommendationsLimit?: number
  topFeaturesLimit?: number
}

export function useAIInsight(options: UseAIInsightOptions = {}) {
  const { campaignId = null, predictionsLimit = 50, shapLimit = 50, recommendationsLimit = 50, topFeaturesLimit = 3 } =
    options

  const [state, setState] = useState<AIInsightState>(INITIAL_STATE)

  const abortControllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const isMountedRef = useRef(true)

  const fetchAll = useCallback(async () => {
    // Cancel any in-flight request cycle before starting a new one.
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    const requestId = ++requestIdRef.current

    setState((prev: AIInsightState) => ({ ...prev, loading: true, error: null }))

    try {
      const fetches: [
        Promise<AIInsightState['overview']>,
        Promise<AIInsightState['modelStatus']>,
        Promise<AIInsightState['predictions']>,
        Promise<AIInsightState['shap']>,
        Promise<AIInsightState['recommendations']>,
        Promise<AIInsightState['audienceSegments']>,
        Promise<AIInsightState['infrastructure']>,
        Promise<AIInsightState['campaignInsight']>
      ] = [
        aiInsightService.getOverview(controller.signal),
        aiInsightService.getModelStatus(controller.signal),
        aiInsightService.getPredictions({ limit: predictionsLimit }, controller.signal),
        aiInsightService.getShap(
          { campaign_id: campaignId != null ? Number(campaignId) : undefined, limit: shapLimit },
          controller.signal
        ),
        aiInsightService.getRecommendations({ limit: recommendationsLimit }, controller.signal),
        aiInsightService.getAudienceSegments({ top_features_limit: topFeaturesLimit }, controller.signal),
        aiInsightService.getInfrastructure(controller.signal),
        campaignId != null
          ? aiInsightService.getCampaignInsight(campaignId, controller.signal)
          : Promise.resolve(null),
      ]

      const [
        overview,
        modelStatus,
        predictions,
        shap,
        recommendations,
        audienceSegments,
        infrastructure,
        campaignInsight,
      ] = await Promise.all(fetches)

      // Discard the result if a newer fetchAll() call has superseded this one,
      // or if the component has unmounted in the meantime.
      if (!isMountedRef.current || requestId !== requestIdRef.current) return

      setState({
        overview: overview ?? null,
        modelStatus: modelStatus ?? null,
        predictions: predictions ?? null,
        shap: shap ?? null,
        recommendations: recommendations ?? null,
        audienceSegments: audienceSegments ?? null,
        infrastructure: infrastructure ?? null,
        campaignInsight: campaignInsight ?? null,
        loading: false,
        error: null,
      })
    } catch (err) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return
      // Aborted requests (superseded fetchAll or unmount) are not real errors.
      if ((err as { name?: string })?.name === 'CanceledError' || (err as { name?: string })?.name === 'AbortError')
        return

      setState((prev: AIInsightState) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load AI insight data',
      }))
    }
  }, [campaignId, predictionsLimit, shapLimit, recommendationsLimit, topFeaturesLimit])

  useEffect(() => {
    isMountedRef.current = true
    fetchAll()

    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [fetchAll])

  return { ...state, refresh: fetchAll }
}