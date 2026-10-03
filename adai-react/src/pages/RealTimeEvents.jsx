/**
 * pages/RealTimeEvents.jsx
 * ---------------------------------------------------------------------------
 * The Real-Time Events page — refactored assembler version.
 *
 * WHAT CHANGED vs. the old monolith (RealTimeEvents.jsx):
 * --------------------------------------------------------
 * 1. All state and simulation logic moved to useRealTimeEvents hook —
 *    this page owns zero setInterval / setTimeout calls.
 * 2. All sub-components imported and wired with correct props —
 *    no inline JSX duplication.
 * 3. <style jsx> removed — was silently failing on Vite+React (no styled-jsx).
 *    All CSS moved to a plain <style> tag that works everywhere, or to
 *    Tailwind classes. The animate-blink and scanline styles now actually apply.
 * 4. Export ref scope fixed — previously wrapped both Export + Pause buttons,
 *    so clicking Pause would close the dropdown. ExportMenu now owns its own
 *    ref internally.
 * 5. getEventCounts useCallback-then-immediate-call replaced by the
 *    EventDistribution component consuming logs directly.
 * 6. NodesCard and LatestPatchCard now use their own components + constants
 *    instead of hardcoded strings.
 * 7. All magic numbers removed — constants imported from
 *    constants/realTimeEvents.ts.
 */

import { useEffect } from 'react';
import { useRealTimeEvents } from '../hooks/useRealTimeEvents';

// Sub-components
import RealTimeStats    from '../components/realTimeEvents/RealTimeStats';
import StatusCards      from '../components/realTimeEvents/StatusCards';
import EventTerminal    from '../components/realTimeEvents/EventTerminal';
import EventDistribution from '../components/realTimeEvents/EventDistribution';
import LatencyChart     from '../components/realTimeEvents/LatencyChart';
import ExportMenu       from '../components/realTimeEvents/ExportMenu';
import NodesCard        from '../components/realTimeEvents/NodesCard';
import LatestPatchCard  from '../components/realTimeEvents/LatestPatchCard';

export default function RealTimeEvents() {
  const {
    // Live data
    eventsPerSec,
    totalEvents,
    kafkaLatency,
    latencyHistory,
    logs,
    fraudCount,
    flashFraud,
    // Controls
    isPaused,
    togglePause,
    resetFraudCounter,
    exportLogsAs,
  } = useRealTimeEvents();

  return (
    <>
      {/*
        ----------------------------------------------------------------
        Global CSS that cannot live in Tailwind utility classes.
        Using a plain <style> tag — works in Vite + React without any
        styled-jsx dependency.
        ----------------------------------------------------------------
      */}
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }

        @keyframes status-pulse-anim {
          0%, 100% { r: 4; opacity: 1; }
          50%       { r: 6; opacity: 0.7; }
        }
        .status-pulse {
          animation: status-pulse-anim 2s ease-in-out infinite;
        }

        .scanline {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 255, 0, 0.025) 0px,
            rgba(0, 255, 0, 0.025) 1px,
            transparent 1px,
            transparent 4px
          );
          pointer-events: none;
          z-index: 1;
        }

        .terminal-scroll::-webkit-scrollbar       { width: 6px; }
        .terminal-scroll::-webkit-scrollbar-track  { background: #111114; }
        .terminal-scroll::-webkit-scrollbar-thumb  { background: #2e2e35; border-radius: 3px; }
        .terminal-scroll::-webkit-scrollbar-thumb:hover { background: #44444e; }

        /* Tooltip clip fix — show below when near top of viewport */
        .status-badge:hover .tooltip-up   { opacity: 1; pointer-events: auto; }
      `}</style>

      <div className="space-y-stack-lg">

        {/* ----------------------------------------------------------------
            Header Row — LIVE badge · Fraud counter · Export · Pause
        ---------------------------------------------------------------- */}
        <div className="flex items-center justify-between mb-stack-lg">

          {/* Left: LIVE + Fraud Blocked */}
          <div className="flex items-center space-x-3">
            {/* LIVE pill */}
            <div className="flex items-center px-3 py-1 bg-tertiary-container/20 border border-tertiary rounded-full select-none">
              <span className="w-2 h-2 rounded-full bg-tertiary mr-2 animate-pulse"></span>
              <span className="text-tertiary font-label-md text-label-md font-bold uppercase tracking-widest">
                LIVE
              </span>
            </div>

            {/* Fraud Blocked counter badge */}
            <div className="flex items-center px-3 py-1 bg-error-container/20 border border-error/30 rounded-full select-none">
              <span className="material-symbols-outlined text-error text-[16px] mr-1">shield</span>
              <span className="text-error font-label-md text-label-md font-bold">
                {fraudCount} Fraud Blocked
              </span>
              <button
                onClick={resetFraudCounter}
                className="ml-2 text-on-surface-variant hover:text-error transition-colors text-xs underline-offset-2 hover:underline"
                aria-label="Reset fraud counter"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Right: Export dropdown + Pause/Resume — each has its own scope */}
          <div className="flex items-center space-x-2">
            {/*
              ExportMenu owns its own ref internally, so clicking the Pause
              button no longer accidentally closes the dropdown.
            */}
            <ExportMenu onExport={exportLogsAs} />

            <button
              onClick={togglePause}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center shadow-lg shadow-primary/20 text-xs font-bold transition-opacity hover:opacity-90 active:opacity-75"
              aria-label={isPaused ? 'Resume live stream' : 'Pause live stream'}
            >
              <span
                className="material-symbols-outlined text-[18px] mr-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
              {isPaused ? 'Resume Stream' : 'Pause Stream'}
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------
            KPI Cards Row — Events/sec · Total Events · Kafka Latency
        ---------------------------------------------------------------- */}
        <RealTimeStats
          eventsPerSec={eventsPerSec}
          totalEvents={totalEvents}
          kafkaLatency={kafkaLatency}
        />

        {/* ----------------------------------------------------------------
            Stream Health Status Pills Row
            Kafka (dynamic) · ML Pipeline · Fraud Engine · Redis Cache
        ---------------------------------------------------------------- */}
        <StatusCards eventsPerSec={eventsPerSec} />

        {/* ----------------------------------------------------------------
            Main Content — Terminal (8 cols) + Charts (4 cols)
        ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

          {/* Terminal Console */}
          <div className="col-span-12 lg:col-span-8 flex flex-col">
            <EventTerminal
              logs={logs}
              isPaused={isPaused}
              flashFraud={flashFraud}
            />
          </div>

          {/* Side Charts */}
          <div className="col-span-12 lg:col-span-4 space-y-gutter flex flex-col justify-between">

            {/* Event Distribution bar chart */}
            <EventDistribution logs={logs} />

            {/* Latency sparkline */}
            <LatencyChart
              latencyHistory={latencyHistory}
              kafkaLatency={kafkaLatency}
            />
          </div>
        </div>

        {/* ----------------------------------------------------------------
            Footer Info Cards — Nodes Active · Latest AI Patch
        ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <NodesCard />
          <LatestPatchCard />
        </div>

      </div>
    </>
  );
}
