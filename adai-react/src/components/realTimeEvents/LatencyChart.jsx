// components/realTimeEvents/LatencyChart.jsx

import { generateLatencyPath, getLatencyLineColor } from '../../utils/realTimeEventsHelpers';
import { KAFKA_LATENCY_MIN, KAFKA_LATENCY_MAX } from '../../constants/realTimeEvents';

/**
 * LatencyChart
 * ---------------------------------------------------------------------------
 * SVG sparkline card showing the rolling 60-second Kafka latency history.
 *
 * FIXES vs. previous version:
 * - Animated dot cx/cy calculation previously produced NaN when
 *   latencyHistory.length === 1 (divisor was 0). Now uses a safe
 *   divisor that matches generateLatencyPath's own guard.
 * - latestLatency clamped to [KAFKA_LATENCY_MIN, KAFKA_LATENCY_MAX]
 *   before the cy formula so the dot never flies off the SVG viewport.
 *
 * @param {number[]} latencyHistory
 * @param {number}   kafkaLatency   - used as fallback if latencyHistory is empty
 */
export default function LatencyChart({ latencyHistory, kafkaLatency }) {
  const { linePath, areaPath } = generateLatencyPath(latencyHistory);
  const latestLatency = latencyHistory.length > 0
    ? latencyHistory[latencyHistory.length - 1]
    : kafkaLatency;

  const lineColor = getLatencyLineColor(latestLatency);

  // Safe divisor — mirrors the guard inside generateLatencyPath
  const lastIndex  = latencyHistory.length > 1 ? latencyHistory.length - 1 : 1;
  const dotCx      = ((latencyHistory.length - 1) / lastIndex) * 400;

  // Clamp before the cy formula to keep the dot inside the SVG
  const clampedLatency = Math.min(Math.max(latestLatency, KAFKA_LATENCY_MIN), KAFKA_LATENCY_MAX);
  const dotCy = 80 - ((clampedLatency - KAFKA_LATENCY_MIN) / (KAFKA_LATENCY_MAX - KAFKA_LATENCY_MIN)) * 60;

  return (
    <div className="bg-surface-container-low border border-outline-variant p-5 rounded-xl h-[240px] flex flex-col justify-between overflow-hidden">
      <h3 className="font-title-lg text-title-lg mb-4 flex justify-between items-center">
        Latencies (60s)
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
          show_chart
        </span>
      </h3>

      <div className="flex-grow relative flex items-end">
        <svg className="w-full h-32" preserveAspectRatio="none" viewBox="0 0 400 100">
          <defs>
            <linearGradient id="latencyGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"   stopColor={lineColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0"   />
            </linearGradient>
          </defs>

          {/* Filled area under the line */}
          {areaPath && (
            <path d={areaPath} fill="url(#latencyGradient)" />
          )}

          {/* Line */}
          {linePath && (
            <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" />
          )}

          {/* Pulsing dot at the latest reading — only rendered when we have data */}
          {latencyHistory.length > 0 && !isNaN(dotCx) && !isNaN(dotCy) && (
            <circle
              className="status-pulse"
              cx={dotCx}
              cy={dotCy}
              fill={lineColor}
              r="4"
            />
          )}
        </svg>

        {/* Horizontal grid lines */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant/30" />
        <div className="absolute top-1/4 left-0 w-full h-[1px] bg-outline-variant/30" />
        <div className="absolute top-3/4 left-0 w-full h-[1px] bg-outline-variant/30" />
      </div>

      <div className="flex justify-between mt-2 font-label-md text-[10px] text-on-surface-variant font-mono">
        <span>-60s</span>
        <span>-30s</span>
        <span>0s</span>
      </div>
    </div>
  );
}
