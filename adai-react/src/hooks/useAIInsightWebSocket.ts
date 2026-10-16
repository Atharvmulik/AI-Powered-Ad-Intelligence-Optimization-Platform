// ============================================================
// src/hooks/useAIInsightWebSocket.ts
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { AI_INSIGHT_WS_URL } from '@/lib/aiinsight'
import { isAIInsightLiveUpdate, isPredictionCreatedEvent, type AIInsightLiveUpdate, type PredictionItem } from '@/types/aiinsight'

const RECONNECT_DELAY_MS = 3000
const MAX_RECONNECT_ATTEMPTS = 10

export function useAIInsightWebSocket() {
  const [liveData, setLiveData] = useState<AIInsightLiveUpdate | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(true)
  const predictionListenerRef = useRef<((prediction: PredictionItem) => void) | null>(null)

  const clearReconnectTimer = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
  }

  const notifyPrediction = useCallback((prediction: PredictionItem) => {
    if (!isMounted.current || !predictionListenerRef.current) return
    predictionListenerRef.current(prediction)
  }, [])

  const connect = useCallback(() => {
    if (!isMounted.current) return
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(AI_INSIGHT_WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (!isMounted.current) return
        setConnected(true)
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event: MessageEvent) => {
        if (!isMounted.current) return

        try {
          const parsed = typeof event.data === 'string' ? JSON.parse(event.data) : null
          if (!parsed || typeof parsed !== 'object') return

          if (isAIInsightLiveUpdate(parsed)) {
            setLiveData(parsed)
            setLastUpdated(parsed.timestamp ?? new Date().toISOString())
            return
          }

          if (isPredictionCreatedEvent(parsed)) {
            notifyPrediction(parsed.data)
            return
          }
        } catch {
          // silently discard malformed frames
        }
      }

      ws.onclose = () => {
        if (!isMounted.current) return
        setConnected(false)
        wsRef.current = null

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1
          reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      if (!isMounted.current) return
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current += 1
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
      }
    }
  }, [notifyPrediction])

  useEffect(() => {
    isMounted.current = true
    connect()

    return () => {
      isMounted.current = false
      clearReconnectTimer()
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  return {
    liveData,
    connected,
    lastUpdated,
    subscribeToPredictions: (onPrediction: (prediction: PredictionItem) => void) => {
      predictionListenerRef.current = onPrediction
      return () => {
        if (predictionListenerRef.current === onPrediction) {
          predictionListenerRef.current = null
        }
      }
    },
  }
}