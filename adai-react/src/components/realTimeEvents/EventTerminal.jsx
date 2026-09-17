// components/realTimeEvents/EventTerminal.jsx

import { useEffect, useRef } from 'react';

/**
 * EventTerminal
 * ---------------------------------------------------------------------------
 * The live-scrolling terminal console: header bar (traffic-light dots,
 * shard/uptime labels), the scrolling log buffer, the "waiting for
 * packets" indicator, and the scanline visual effect.
 *
 * Owns its own auto-scroll-to-bottom effect since that's a DOM concern
 * tied directly to this element, not page-level business logic.
 *
 * @param {Array<{time: string, label: string, msg: string, color: string, msgColor: string}>} logs
 * @param {boolean} isPaused
 * @param {boolean} flashFraud
 */
export default function EventTerminal({ logs, isPaused, flashFraud }) {
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className={`bg-surface-container-lowest border ${
        flashFraud ? 'border-red-500' : 'border-outline-variant'
      } rounded-xl overflow-hidden flex flex-col h-[500px] relative shadow-2xl transition-all duration-500`}
    >
      {/* Scanline effect */}
      <div className="scanline"></div>
      {/* Terminal Header */}
      <div className="bg-surface-container-highest px-4 py-2 flex items-center justify-between border-b border-outline-variant">
        <div className="flex space-x-2 items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-error"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-tertiary"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-secondary text-secondary-container"></div>
          <span className="ml-4 font-label-md text-label-md text-on-surface-variant font-mono">
            stream_processor::kafka_main_ingress
          </span>
        </div>
        <div className="flex space-x-4 font-label-md text-label-md text-on-surface-variant font-mono">
          <span>SHARD_04</span>
          <span className="text-tertiary">UP_TIME: 14:23:44</span>
        </div>
      </div>
      {/* Terminal Body */}
      <div
        ref={terminalEndRef}
        className="flex-grow p-4 font-mono text-label-md overflow-y-auto terminal-scroll bg-[#050507] text-[12px] space-y-1 relative"
      >
        <div className="text-on-surface-variant opacity-50 mb-2 border-b border-outline-variant pb-2 font-mono">
          --- INITIALIZING AI STREAM ANALYSIS PARSER v2.4 ---
        </div>
        {logs.map((log, idx) => (
          <div key={idx} className="flex space-x-4 font-mono">
            <span className="text-on-surface-variant opacity-40">[{log.time}]</span>
            <span className={`${log.color} font-bold`}>{log.label}</span>
            <span className={log.msgColor}>{log.msg}</span>
          </div>
        ))}
        {!isPaused && (
          <div className="flex space-x-4 font-mono items-center">
            <span className="text-on-surface-variant opacity-40">
              [{new Date().toLocaleTimeString('en-GB', { hour12: false })}]
            </span>
            <span className="text-primary font-bold">STREAM</span>
            <span className="text-on-surface italic">Waiting for incoming packets...</span>
            <span className="inline-block w-2 h-4 bg-primary ml-1 animate-blink"></span>
          </div>
        )}
      </div>
    </div>
  );
}