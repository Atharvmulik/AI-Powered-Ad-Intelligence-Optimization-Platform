import { useState, useEffect, useRef } from 'react'

import {
  KAFKA_DEV_TARGET_EPS,
  KAFKA_SPARKLINE_HEIGHT_DIVISOR,
  KAFKA_INITIAL_THROUGHPUT,
  KAFKA_INITIAL_SPARKLINE,
  KAFKA_UPDATE_INTERVAL_MS,
  KAFKA_EPS_VARIATION,
  KAFKA_EPS_MIN,
  KAFKA_EPS_MAX,
} from '../../constants/systemHealth'

import {
  epsToBarHeight,
  nextKafkaEps,
  appendSparklinePoint,
} from '../../utils/systemHealthHelpers'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * KafkaThroughput
 *
 * Props
 * -----
 * kafkaThroughput : KafkaThroughputResponse | null  — from useSystemHealth()
 * liveData        : SystemLiveUpdate | null          — from useSystemHealthWebSocket()
 *
 * Data flow
 * ---------
 * 1. Seed  : kafkaThroughput.events_per_second seeds the local counter
 *            and the first sparkline bar on mount.
 * 2. Live  : liveData.events_per_second (pushed by WS every 5 s) updates
 *            the counter and appends a sparkline bar whenever it changes.
 * 3. Local : a setInterval applies a small random variation between WS
 *            pushes so the counter keeps animating visually.
 */
const KafkaThroughput = ({ kafkaThroughput = null, liveData = null }) => {
  const seedEps = kafkaThroughput?.events_per_second ?? KAFKA_INITIAL_THROUGHPUT

  const [eps,          setEps]          = useState(seedEps)
  const [sparkline,    setSparkline]    = useState(KAFKA_INITIAL_SPARKLINE)
  const [aboveTarget,  setAboveTarget]  = useState(
    kafkaThroughput?.above_target ?? true
  )

  // Seed from REST response on first load
  useEffect(() => {
    if (!kafkaThroughput) return
    const { events_per_second, above_target } = kafkaThroughput
    setEps(events_per_second)
    setAboveTarget(above_target)
    setSparkline(prev => appendSparklinePoint(prev, events_per_second))
  }, [kafkaThroughput])

  // Live update from WebSocket push
  useEffect(() => {
    if (!liveData) return
    const { events_per_second } = liveData
    setEps(events_per_second)
    setAboveTarget(events_per_second >= KAFKA_DEV_TARGET_EPS)
    setSparkline(prev => appendSparklinePoint(prev, events_per_second))
  }, [liveData])

  // Local variation between WS pushes so the counter keeps animating
  useEffect(() => {
    const interval = setInterval(() => {
      setEps(prev => {
        const next = nextKafkaEps(prev, KAFKA_EPS_VARIATION, KAFKA_EPS_MIN, KAFKA_EPS_MAX)
        setSparkline(s => appendSparklinePoint(s, next))
        setAboveTarget(next >= KAFKA_DEV_TARGET_EPS)
        return next
      })
    }, KAFKA_UPDATE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-title-lg text-title-lg mb-1">Kafka Event Throughput</h3>
          <p className="text-xs text-on-surface-variant">
            Dev target &gt; {KAFKA_DEV_TARGET_EPS.toLocaleString()} events/sec
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-3xl font-mono font-bold text-primary">
            {Math.round(eps).toLocaleString()}{' '}
            <span className="text-sm text-on-surface-variant">events/sec</span>
          </div>
          {aboveTarget && (
            <span className="text-[10px] bg-green-400/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
              ✓ Above 10K dev target
            </span>
          )}
          {!aboveTarget && (
            <span className="text-[10px] bg-error/20 text-error px-2 py-1 rounded-full flex items-center gap-1">
              ✗ Below 10K dev target
            </span>
          )}
        </div>
      </div>
      <div className="mt-6 flex items-end gap-1 h-12">
        {sparkline.map((val, idx) => (
          <div
            key={idx}
            className="flex-1 bg-primary/40 rounded-t-sm hover:bg-primary transition-all"
            style={{ height: `${epsToBarHeight(val, KAFKA_SPARKLINE_HEIGHT_DIVISOR)}%` }}
          ></div>
        ))}
      </div>
    </div>
  )
}

export default KafkaThroughput
