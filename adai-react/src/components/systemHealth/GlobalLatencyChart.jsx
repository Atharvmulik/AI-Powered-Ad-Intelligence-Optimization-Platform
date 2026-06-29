import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

import {
  CHART_Y_MAX,
  LATENCY_SLA_LIMIT_MS,
  CHART_WINDOW_SIZE,
  CHART_BASE_HOUR,
  EU_LATENCY_MIN,
  EU_LATENCY_MAX,
  US_LATENCY_MIN,
  US_LATENCY_MAX,
} from '../../constants/systemHealth'

import { buildInitialLatencyData } from '../../utils/systemHealthHelpers'

// ---------------------------------------------------------------------------
// Adapter — LatencyTrendResponse[] → { time, eu, us }[]
// ---------------------------------------------------------------------------

const adaptTrendData = (latencyTrend) => {
  const eu = latencyTrend.find(r => r.region === 'EU-CENTRAL-1')
  const us = latencyTrend.find(r => r.region === 'US-EAST-1')
  if (!eu || !us) return []
  return eu.timestamps.map((time, idx) => ({
    time,
    eu: eu.latency_p99_ms[idx] ?? 0,
    us: us.latency_p99_ms[idx] ?? 0,
  }))
}

// Fallback seed — renders immediately before first fetch resolves
const FALLBACK_DATA = buildInitialLatencyData(
  CHART_WINDOW_SIZE,
  CHART_BASE_HOUR,
  EU_LATENCY_MIN,
  EU_LATENCY_MAX,
  US_LATENCY_MIN,
  US_LATENCY_MAX,
)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * GlobalLatencyChart
 *
 * Props
 * -----
 * latencyTrend : LatencyTrendResponse[]  — from useSystemHealth()
 *                Falls back to generated seed data when empty.
 */
const GlobalLatencyChart = ({ latencyTrend = [] }) => {
  const chartData = useMemo(() => {
    if (latencyTrend.length > 0) {
      const adapted = adaptTrendData(latencyTrend)
      if (adapted.length > 0) return adapted.slice(-CHART_WINDOW_SIZE)
    }
    return FALLBACK_DATA
  }, [latencyTrend])

  return (
    <div className="col-span-12 lg:col-span-7 glass-card rounded-xl p-6 min-h-[300px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-title-lg text-title-lg">Global Latency (P99)</h3>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-surface-container-highest rounded text-[10px] font-label-md font-mono">EU-CENTRAL-1</span>
          <span className="px-2 py-1 bg-surface-container-highest rounded text-[10px] font-label-md font-mono">US-EAST-1</span>
        </div>
      </div>
      <div className="flex-1 w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" />
            <XAxis dataKey="time" stroke="#9e9e9e" fontSize={10} tickMargin={8} />
            <YAxis
              stroke="#9e9e9e"
              fontSize={10}
              domain={[0, CHART_Y_MAX]}
              label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fill: '#9e9e9e', fontSize: 10 } }}
            />
            <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <ReferenceLine
              y={LATENCY_SLA_LIMIT_MS}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'SLA Limit (100ms)', fill: '#ef4444', fontSize: 9, position: 'right' }}
            />
            <Line type="monotone" dataKey="eu" stroke="#3b82f6" strokeWidth={2} dot={false} name="EU-CENTRAL-1" />
            <Line type="monotone" dataKey="us" stroke="#a855f7" strokeWidth={2} dot={false} name="US-EAST-1" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default GlobalLatencyChart
