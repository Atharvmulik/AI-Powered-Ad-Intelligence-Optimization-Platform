// ============================================================
// src/hooks/useDashboardWebSocket.ts
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import type { WebSocketLivePayload } from '@/types/dashboard'

const WS_URL = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8000/ws/dashboard/live'
const RECONNECT_DELAY_MS = 3000
const MAX_RECONNECT_ATTEMPTS = 10

export function useDashboardWebSocket() {
  const [liveData, setLiveData] = useState<WebSocketLivePayload | null>(null)
  const [connected, setConnected] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(true)

  const clearReconnectTimer = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
  }

  const connect = useCallback(() => {
    if (!isMounted.current) return
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (!isMounted.current) return
        setConnected(true)
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event: MessageEvent) => {
        if (!isMounted.current) return
        try {
          const payload: WebSocketLivePayload = JSON.parse(event.data as string)
          setLiveData(payload)
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
  }, [])

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

  return { liveData, connected }
}