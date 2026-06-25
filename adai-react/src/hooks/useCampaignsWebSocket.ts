// src/hooks/useCampaignsWebSocket.ts

import { useEffect, useRef, useCallback } from 'react'
import type { WebSocketLivePayload } from '@/types/campaigns'

interface UseCampaignsWebSocketOptions {
  onMessage: (payload: WebSocketLivePayload) => void
}

export function useCampaignsWebSocket({ onMessage }: UseCampaignsWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmountedRef = useRef(false)

  const connect = useCallback(() => {
    if (unmountedRef.current) return

    // Prevent opening multiple concurrent sockets
    const existing = wsRef.current
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return
    }

    const wsUrl = `${import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'}/ws/campaigns/live`
    // clear any pending reconnect timer when attempting fresh connect
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const payload: WebSocketLivePayload = JSON.parse(event.data)
        onMessage(payload)
      } catch {
        // ignore malformed frames
      }
    }

    ws.onclose = () => {
      if (!unmountedRef.current) {
        reconnectTimerRef.current = setTimeout(connect, 3000)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [onMessage])

  useEffect(() => {
    unmountedRef.current = false
    connect()

    return () => {
      unmountedRef.current = true
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [connect])
}