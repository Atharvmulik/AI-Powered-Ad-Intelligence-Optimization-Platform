// src/components/analytics/AnalyticsTerminal.jsx
// Live terminal log console with auto-scroll and blinking cursor.

import { useRef, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAnalyticsWebSocket } from '@/hooks/useAnalyticsWebSocket';

const LOG_COLORS = {
  ML:      'text-primary opacity-80',
  SYS:     'text-primary opacity-80',
  sys:     'text-primary opacity-80',
  INFO:    'text-on-surface',
  info:    'text-on-surface',
  INSIGHT: 'text-tertiary font-bold',
  insight: 'text-tertiary font-bold',
  ALERT:   'text-yellow-400',
  alert:   'text-yellow-400',
  FRAUD:   'text-red-400',
  fraud:   'text-red-400',
  default: 'text-on-surface-variant',
};

function getLogColor(log) {
  return LOG_COLORS[log.type] ?? LOG_COLORS.default;
}

function formatTimestamp(ts) {
  try {
    return new Date(ts).toLocaleTimeString('en-GB', { hour12: false });
  } catch {
    return ts;
  }
}

export default function AnalyticsTerminal() {
  const { terminalLogs, setTerminalLogs, overview, setOverview } = useAnalytics();
  const logs = terminalLogs ?? [];
  useAnalyticsWebSocket(setOverview, setTerminalLogs);

  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  return (
    <div className="bg-[#050507] border border-outline-variant rounded-xl p-4 font-label-md text-label-md relative group">
      {/* Traffic-light dots + label */}
      <div className="flex items-center gap-2 mb-3 border-b border-outline-variant/30 pb-2">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-error" />
          <div className="w-2 h-2 rounded-full bg-tertiary" />
          <div className="w-2 h-2 rounded-full bg-primary-container" />
        </div>
        <span className="text-on-surface-variant ml-2 opacity-60">Real-time AI Analysis Log</span>
      </div>

      {/* Log lines */}
      <div ref={terminalRef} className="space-y-1 h-40 overflow-y-auto pr-4 font-mono text-[12px]">
        {logs.map((log, idx) => (
          <p key={idx} className={getLogColor(log)}>
            <span className="opacity-40">[{formatTimestamp(log.timestamp)}]</span>{' '}
            {log.message}{' '}
            {log.status && (
              <span className="text-primary font-bold">{log.status}</span>
            )}
          </p>
        ))}
        {/* Blinking cursor row */}
        <div className="flex items-center space-x-1">
          <span className="opacity-40">
            [{new Date().toLocaleTimeString('en-GB', { hour12: false })}]
          </span>
          <span className="text-on-surface">Awaiting user interaction...</span>
          <span className="terminal-cursor" />
        </div>
      </div>
    </div>
  );
}