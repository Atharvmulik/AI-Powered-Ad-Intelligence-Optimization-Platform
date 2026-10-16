// ============================================================
// src/hooks/useDashboardWebSocket.ts
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import type { WebSocketLivePayload } from '@/types/dashboard'

const DASHBOARD_WS_PATH = '/ws/dashboard/live'
const configuredWsUrl = import.meta.env.VITE_WS_URL?.trim() || 'ws://localhost:8000'
const WS_URL = `${configuredWsUrl.replace(/\/+$/, '').replace(/\/ws\/dashboard\/live$/, '')}${DASHBOARD_WS_PATH}`
const RECONNECT_DELAY_MS = 3000

export function useDashboardWebSocket() {
  const [liveData, setLiveData] = useState<WebSocketLivePayload | null>(null)
  const [connected, setConnected] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(true)

  const clearReconnectTimer = () => {
    if (reconnectTimer.current !== null) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
  }

  const connect = useCallback(() => {
    if (!isMounted.current) return

    const existingSocket = wsRef.current
    if (existingSocket && existingSocket.readyState !== WebSocket.CLOSED) return

    const scheduleReconnect = () => {
      if (!isMounted.current || reconnectTimer.current !== null) return

      reconnectAttempts.current += 1
      reconnectTimer.current = setTimeout(() => {
        reconnectTimer.current = null
        connect()
      }, RECONNECT_DELAY_MS)
    }

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (!isMounted.current || wsRef.current !== ws) return
        setConnected(true)
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event: MessageEvent) => {
        if (!isMounted.current || wsRef.current !== ws) return
        try {
          const payload: WebSocketLivePayload = JSON.parse(event.data as string)
          setLiveData(payload)
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Failed to parse dashboard WebSocket message:', error)
          }
        }
      }

      ws.onclose = () => {
        if (wsRef.current !== ws) return
        wsRef.current = null
        setConnected(false)
        scheduleReconnect()
      }

      ws.onerror = (event) => {
        if (wsRef.current !== ws) return
        setConnected(false)
        if (import.meta.env.DEV) {
          console.error('Dashboard WebSocket connection error:', event)
        }
        if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
          ws.close()
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Unable to create dashboard WebSocket connection:', error)
      }
      scheduleReconnect()
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
