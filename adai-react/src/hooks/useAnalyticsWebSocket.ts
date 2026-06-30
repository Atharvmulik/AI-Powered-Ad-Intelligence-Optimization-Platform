// src/hooks/useAnalyticsWebSocket.ts

import { useEffect, useRef, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { FraudEventItem, FraudMonitorResponse, OverviewResponse, TerminalLog, CTRTrendResponse } from '@/types/analytics';

const RECONNECT_DELAY_MS = 3000;
const MAX_TERMINAL_LOGS = 12;

interface WsKpiPayload {
  active_users?: number;
  events_per_second?: number;
  avg_bid_latency?: number;
  fraud_rate?: number;
  current_ctr?: number;
  timestamp?: string;
}

const createWebSocketConnection = (
  route: string,
  wsRef: MutableRefObject<WebSocket | null>,
  reconnectTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
  unmountedRef: MutableRefObject<boolean>,
  onMessage: (event: MessageEvent) => void
) => {
  if (unmountedRef.current) return;

  const existing = wsRef.current;
  if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
    return;
  }

  if (reconnectTimerRef.current) {
    clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;
  }

  const wsUrl = `${import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'}${route}`;
  const ws = new WebSocket(wsUrl);
  wsRef.current = ws;

  ws.onmessage = onMessage;

  ws.onerror = () => {
    if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
      ws.close();
    }
  };

  ws.onclose = (event: CloseEvent) => {
    if (wsRef.current === ws) {
      wsRef.current = null;
    }

    const isNormalClose = event.code === 1000 || event.code === 1001;
    if (!unmountedRef.current && !isNormalClose && reconnectTimerRef.current == null) {
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        createWebSocketConnection(route, wsRef, reconnectTimerRef, unmountedRef, onMessage);
      }, RECONNECT_DELAY_MS);
    }
  };
};

export function useAnalyticsWebSocket(
  setOverview: Dispatch<SetStateAction<OverviewResponse>>,
  setTerminalLogs: Dispatch<SetStateAction<TerminalLog[]>>,
  setFraudMonitor?: Dispatch<SetStateAction<FraudMonitorResponse>>,
  setCtrTrend?: Dispatch<SetStateAction<CTRTrendResponse>>
): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  const terminalWsRef = useRef<WebSocket | null>(null);
  const terminalReconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fraudWsRef = useRef<WebSocket | null>(null);
  const fraudReconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    unmountedRef.current = false;

    createWebSocketConnection('/ws/analytics/live', wsRef, reconnectTimer, unmountedRef, (event) => {
      try {
        const payload: WsKpiPayload = JSON.parse(event.data);

        setOverview((prev) => ({
          ...prev,
          ...(payload.active_users !== undefined && { active_users: payload.active_users }),
          ...(payload.events_per_second !== undefined && { events_per_second: payload.events_per_second }),
          ...(payload.avg_bid_latency !== undefined && { avg_bid_latency: payload.avg_bid_latency }),
          ...(payload.fraud_rate !== undefined && { fraud_rate: payload.fraud_rate }),
        }));

        if (setCtrTrend && payload.current_ctr !== undefined && payload.timestamp !== undefined) {
          setCtrTrend((prev) => {
            const newPoint = { timestamp: payload.timestamp, ctr: payload.current_ctr };
            const updatedPoints = [...prev.points, newPoint].slice(-20);
            return {
              ...prev,
              current_ctr: payload.current_ctr,
              points: updatedPoints,
            };
          });
        }
      } catch {
        // malformed frame — ignore
      }
    });

    return () => {
      unmountedRef.current = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      wsRef.current?.close();
    };
  }, [setOverview, setCtrTrend]);

  useEffect(() => {
    if (!setFraudMonitor) return;

    createWebSocketConnection('/ws/analytics/fraud', fraudWsRef, fraudReconnectTimer, unmountedRef, (event) => {
      try {
        const entry: FraudEventItem = JSON.parse(event.data);
        setFraudMonitor((prev) => ({
          ...prev,
          events: [entry, ...prev.events].slice(0, 8),
        }));
      } catch {
        // malformed frame — ignore
      }
    });

    return () => {
      if (fraudReconnectTimer.current) {
        clearTimeout(fraudReconnectTimer.current);
      }
      fraudWsRef.current?.close();
    };
  }, [setFraudMonitor]);

  useEffect(() => {
    createWebSocketConnection('/ws/analytics/terminal', terminalWsRef, terminalReconnectTimer, unmountedRef, (event) => {
      try {
        const log: TerminalLog = JSON.parse(event.data);
        setTerminalLogs((prev) => {
          const next = [...prev, log];
          return next.length > MAX_TERMINAL_LOGS ? next.slice(next.length - MAX_TERMINAL_LOGS) : next;
        });
      } catch {
        // malformed frame — ignore
      }
    });

    return () => {
      if (terminalReconnectTimer.current) {
        clearTimeout(terminalReconnectTimer.current);
      }
      terminalWsRef.current?.close();
    };
  }, [setTerminalLogs]);
}

