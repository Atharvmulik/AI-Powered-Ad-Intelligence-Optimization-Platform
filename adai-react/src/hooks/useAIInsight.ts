// ============================================================
// src/hooks/useAIInsight.ts
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { aiInsightService } from '@/services/aiInsightService'
import type { AIInsightState, PredictionItem } from '@/types/aiinsight'
import { predictionKey } from '@/utils/aiInsightsHelpers'

const MAX_PREDICTIONS_IN_FEED = 50

function sortPredictionsNewestFirst(predictions: PredictionItem[]): PredictionItem[] {
  return [...predictions].sort((a, b) => {
    const aTimestamp = Date.parse(a.timestamp)
    const bTimestamp = Date.parse(b.timestamp)
    const aIsValid = Number.isFinite(aTimestamp)
    const bIsValid = Number.isFinite(bTimestamp)

    if (aIsValid && bIsValid) return bTimestamp - aTimestamp
    if (aIsValid) return -1
    if (bIsValid) return 1
    return 0
  })
}

function mergePredictionHistory(
  existing: PredictionItem[] | null | undefined,
  incoming: PredictionItem | PredictionItem[],
  limit: number
): PredictionItem[] {
  const safeExisting = Array.isArray(existing) ? existing : []
  const merged = new Map<string, PredictionItem>()

  const nextItems = Array.isArray(incoming) ? incoming : [incoming]
  for (const item of nextItems) {
    merged.set(predictionKey(item), item)
  }

  // Existing records take precedence so a stale REST copy cannot replace a live event.
  for (const item of safeExisting) {
    merged.set(predictionKey(item), item)
  }

  const next = sortPredictionsNewestFirst(Array.from(merged.values())).slice(0, limit)
  if (next.length === safeExisting.length && next.every((item, index) => item === safeExisting[index])) {
    return safeExisting
  }
  return next
}

const MODEL_ACTIVITY_POLL_INTERVAL_MS = 5000

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
  maxRetainedPredictions?: number
  shapLimit?: number
  recommendationsLimit?: number
  topFeaturesLimit?: number
  onPrediction?: (callback: (prediction: PredictionItem) => void) => (() => void) | void
}

export function useAIInsight(options: UseAIInsightOptions = {}) {
  const {
    campaignId = null,
    predictionsLimit = 50,
    maxRetainedPredictions = MAX_PREDICTIONS_IN_FEED,
    shapLimit = 50,
    recommendationsLimit = 50,
    topFeaturesLimit = 3,
    onPrediction,
  } = options

  const retainedPredictionLimit =
    Number.isInteger(maxRetainedPredictions) && maxRetainedPredictions > 0
      ? maxRetainedPredictions
      : MAX_PREDICTIONS_IN_FEED
  const [state, setState] = useState<AIInsightState>(INITIAL_STATE)

  const abortControllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const isMountedRef = useRef(true)
  const fullFetchInFlightRef = useRef(false)
  const activityPollControllerRef = useRef<AbortController | null>(null)
  const activityPollRequestIdRef = useRef(0)
  const activityPollInFlightRef = useRef(false)

  const fetchAll = useCallback(async () => {
    // Cancel any in-flight request cycle before starting a new one.
    abortControllerRef.current?.abort()
    activityPollRequestIdRef.current += 1
    activityPollControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    const requestId = ++requestIdRef.current

    fullFetchInFlightRef.current = true
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

      setState((prev: AIInsightState) => ({
        ...prev,
        overview: overview ?? null,
        modelStatus: modelStatus ?? null,
        predictions: {
          predictions: mergePredictionHistory(
            prev.predictions?.predictions,
            predictions?.predictions ?? [],
            retainedPredictionLimit
          ),
        },
        shap: shap ?? null,
        recommendations: recommendations ?? null,
        audienceSegments: audienceSegments ?? null,
        infrastructure: infrastructure ?? null,
        campaignInsight: campaignInsight ?? null,
        loading: false,
        error: null,
      }))
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
    } finally {
      if (requestId === requestIdRef.current) {
        fullFetchInFlightRef.current = false
      }
    }
  }, [campaignId, predictionsLimit, maxRetainedPredictions, shapLimit, recommendationsLimit, topFeaturesLimit])

  useEffect(() => {
    isMountedRef.current = true
    fetchAll()

    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [fetchAll])

  useEffect(() => {
    const refreshModelActivity = async () => {
      if (
        !isMountedRef.current ||
        fullFetchInFlightRef.current ||
        activityPollInFlightRef.current
      ) {
        return
      }

      activityPollInFlightRef.current = true
      const controller = new AbortController()
      activityPollControllerRef.current = controller
      const requestId = ++activityPollRequestIdRef.current

      try {
        const [modelStatusResult, predictionsResult, recommendationsResult, audienceSegmentsResult] = await Promise.allSettled([
          aiInsightService.getModelStatus(controller.signal),
          aiInsightService.getPredictions({ limit: predictionsLimit }, controller.signal),
          aiInsightService.getRecommendations({ limit: recommendationsLimit }, controller.signal),
          aiInsightService.getAudienceSegments({ top_features_limit: topFeaturesLimit }, controller.signal),
        ])

        if (
          !isMountedRef.current ||
          requestId !== activityPollRequestIdRef.current ||
          fullFetchInFlightRef.current
        ) {
          return
        }

        const modelStatus =
          modelStatusResult.status === 'fulfilled' && Array.isArray(modelStatusResult.value?.models)
            ? modelStatusResult.value
            : undefined
        const predictions =
          predictionsResult.status === 'fulfilled' && Array.isArray(predictionsResult.value?.predictions)
            ? predictionsResult.value
            : undefined
        const recommendations =
          recommendationsResult.status === 'fulfilled' &&
          Array.isArray(recommendationsResult.value?.recommendations)
            ? recommendationsResult.value
            : undefined
        const audienceSegments =
          audienceSegmentsResult.status === 'fulfilled' &&
          Array.isArray(audienceSegmentsResult.value?.segments)
            ? audienceSegmentsResult.value
            : undefined

        if (modelStatus || predictions || recommendations || audienceSegments) {
          setState((prev: AIInsightState) => {
            const nextPredictions = predictions
              ? {
                  predictions: {
                    predictions: mergePredictionHistory(
                      prev.predictions?.predictions,
                      predictions,
                      retainedPredictionLimit
                    ),
                  },
                }
              : {}

            return {
              ...prev,
              ...(modelStatus ? { modelStatus } : {}),
              ...nextPredictions,
              ...(recommendations ? { recommendations } : {}),
              ...(audienceSegments ? { audienceSegments } : {}),
            }
          })
        }

        if (
          modelStatusResult.status === 'rejected' &&
          modelStatusResult.reason?.name !== 'AbortError' &&
          modelStatusResult.reason?.name !== 'CanceledError'
        ) {
          console.error('Failed to refresh AI insight model status', modelStatusResult.reason)
        }
        if (
          predictionsResult.status === 'rejected' &&
          predictionsResult.reason?.name !== 'AbortError' &&
          predictionsResult.reason?.name !== 'CanceledError'
        ) {
          console.error('Failed to refresh AI insight predictions', predictionsResult.reason)
        }
        if (modelStatusResult.status === 'fulfilled' && !modelStatus) {
          console.error('Received an invalid AI insight model status response')
        }
        if (predictionsResult.status === 'fulfilled' && !predictions) {
          console.error('Received an invalid AI insight predictions response')
        }
        if (
          recommendationsResult.status === 'rejected' &&
          recommendationsResult.reason?.name !== 'AbortError' &&
          recommendationsResult.reason?.name !== 'CanceledError'
        ) {
          console.error('Failed to refresh AI insight recommendations', recommendationsResult.reason)
        }
        if (recommendationsResult.status === 'fulfilled' && !recommendations) {
          console.error('Received an invalid AI insight recommendations response')
        }
        if (
          audienceSegmentsResult.status === 'rejected' &&
          audienceSegmentsResult.reason?.name !== 'AbortError' &&
          audienceSegmentsResult.reason?.name !== 'CanceledError'
        ) {
          console.error('Failed to refresh AI insight audience segments', audienceSegmentsResult.reason)
        }
        if (audienceSegmentsResult.status === 'fulfilled' && !audienceSegments) {
          console.error('Received an invalid AI insight audience segments response')
        }
      } catch (err) {
        if (
          isMountedRef.current &&
          requestId === activityPollRequestIdRef.current &&
          (err as { name?: string })?.name !== 'CanceledError' &&
          (err as { name?: string })?.name !== 'AbortError'
        ) {
          console.error('Failed to refresh AI insight model activity', err)
        }
      } finally {
        if (activityPollControllerRef.current === controller) {
          activityPollControllerRef.current = null
          activityPollInFlightRef.current = false
        }
      }
    }

    const intervalId = setInterval(refreshModelActivity, MODEL_ACTIVITY_POLL_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
      activityPollRequestIdRef.current += 1
      activityPollControllerRef.current?.abort()
      activityPollControllerRef.current = null
      activityPollInFlightRef.current = false
    }
  }, [fetchAll, predictionsLimit, recommendationsLimit, topFeaturesLimit, retainedPredictionLimit])

  useEffect(() => {
    if (!onPrediction) return undefined

    const handlePrediction = (incoming: PredictionItem) => {
      setState((prev: AIInsightState) => {
        const existingPredictions = prev.predictions?.predictions ?? []
        const merged = mergePredictionHistory(existingPredictions, incoming, retainedPredictionLimit)

        return {
          ...prev,
          predictions: {
            predictions: merged,
          },
        }
      })
    }

    return onPrediction(handlePrediction)
  }, [onPrediction, retainedPredictionLimit])

  return { ...state, refresh: fetchAll }
}