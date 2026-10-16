import { useCallback, useEffect, useState } from 'react'
import { aiInsightService } from '@/services/aiInsightService'
import type { PredictionShapResponse } from '@/types/aiinsight'

type PredictionShapState =
  | { predictionId: number; status: 'loading' }
  | { predictionId: number; status: 'success'; data: PredictionShapResponse }
  | { predictionId: number; status: 'error'; message: string }
  | { predictionId: null; status: 'unavailable' }

const explanationCache = new Map<number, PredictionShapResponse>()
const explanationRequests = new Map<number, Promise<PredictionShapResponse>>()

function isPredictionId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value)
}

function requestPredictionShap(predictionId: number): Promise<PredictionShapResponse> {
  const cached = explanationCache.get(predictionId)
  if (cached) return Promise.resolve(cached)

  const existingRequest = explanationRequests.get(predictionId)
  if (existingRequest) return existingRequest

  const request = aiInsightService.getPredictionShap(predictionId).then((response) => {
    if (response.prediction_id !== predictionId) {
      throw new Error('The explanation response did not match the selected prediction.')
    }
    if (!Array.isArray(response.features)) {
      throw new Error('The explanation response did not contain a feature list.')
    }
    explanationCache.set(predictionId, response)
    return response
  }).finally(() => {
    explanationRequests.delete(predictionId)
  })

  explanationRequests.set(predictionId, request)
  return request
}

function getRequestErrorMessage(error: unknown): string {
  const details = error as { status?: number; response?: { status?: number } } | null
  const status = details?.status ?? details?.response?.status
  if (status === 404) return 'This prediction was not found, so its explanation is unavailable.'
  if (error instanceof Error && error.message) return error.message
  return 'Unable to load this prediction’s SHAP explanation. Check your connection and retry.'
}

export function usePredictionShap(predictionId: number | null | undefined) {
  const [retryCount, setRetryCount] = useState(0)
  const [result, setResult] = useState<PredictionShapState>({
    predictionId: null,
    status: 'unavailable',
  })
  const hasPredictionId = isPredictionId(predictionId)

  useEffect(() => {
    if (!hasPredictionId) {
      setResult({ predictionId: null, status: 'unavailable' })
      return undefined
    }

    let active = true
    const cached = explanationCache.get(predictionId)
    if (cached) {
      setResult({ predictionId, status: 'success', data: cached })
      return () => {
        active = false
      }
    }

    setResult({ predictionId, status: 'loading' })
    requestPredictionShap(predictionId).then(
      (data) => {
        if (active) setResult({ predictionId, status: 'success', data })
      },
      (error: unknown) => {
        if (active) setResult({ predictionId, status: 'error', message: getRequestErrorMessage(error) })
      },
    )

    return () => {
      active = false
    }
  }, [hasPredictionId, predictionId, retryCount])

  const retry = useCallback(() => setRetryCount((count) => count + 1), [])
  const currentResult = result.predictionId === predictionId
    ? result
    : hasPredictionId
      ? { predictionId, status: 'loading' as const }
      : { predictionId: null, status: 'unavailable' as const }

  return { ...currentResult, retry }
}
