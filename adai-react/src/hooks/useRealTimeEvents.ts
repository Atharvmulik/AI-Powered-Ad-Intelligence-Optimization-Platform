// hooks/useRealTimeEvents.ts

import { useState, useCallback } from 'react';
import type { ExportFormat, RealTimeEventsWebSocketReturn } from '../types/realTimeEvents';
import { useRealTimeEventsWebSocket } from './useRealTimeEventsWebSocket';
import { exportLogs as exportLogsHelper } from '../utils/realTimeEventsHelpers';

/**
 * Full return shape consumed by pages/RealTimeEvents.jsx: the live
 * simulated state (spread from useRealTimeEventsWebSocket) plus the
 * page-level controls (pause toggle, fraud reset, export).
 */
export interface UseRealTimeEventsReturn extends Omit<RealTimeEventsWebSocketReturn, 'resetFraudCount'> {
  isPaused: boolean;
  togglePause: () => void;
  resetFraudCounter: () => void;
  exportLogsAs: (format: ExportFormat) => void;
}

/**
 * useRealTimeEvents
 * ---------------------------------------------------------------------------
 * Page-level controller hook for the Real-Time Events screen.
 *
 * Owns `isPaused` (the one piece of state that gates both simulation
 * intervals inside useRealTimeEventsWebSocket) and exposes the three
 * user actions available on this page: pause/resume the stream, reset
 * the fraud counter, and export the current log buffer.
 *
 * This is the hook pages/RealTimeEvents.jsx calls directly — it never
 * touches useRealTimeEventsWebSocket or the helpers itself.
 */
export function useRealTimeEvents(): UseRealTimeEventsReturn {
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const { resetFraudCount, ...liveState } = useRealTimeEventsWebSocket(isPaused);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const resetFraudCounter = useCallback(() => {
    resetFraudCount();
  }, [resetFraudCount]);

  const exportLogsAs = useCallback(
    (format: ExportFormat) => {
      exportLogsHelper(format, liveState.logs);
    },
    [liveState.logs]
  );

  return {
    ...liveState,
    isPaused,
    togglePause,
    resetFraudCounter,
    exportLogsAs,
  };
}