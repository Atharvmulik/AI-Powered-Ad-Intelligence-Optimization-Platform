// src/components/campaigns/LivePerformanceMonitor.jsx

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import CampaignChartTooltip from './CampaignChartTooltip'
import { useCampaignsWebSocket } from '@/hooks/useCampaignsWebSocket'

function getSparkline() {
  return Array(5).fill(0).map(() => Math.floor(Math.random() * 30) + 10)
}

function SparkBar({ sparkline, colorClass }) {
  return (
    <div className="flex gap-[2px] items-end h-6">
      {sparkline.map((height, i) => (
        <div
          key={i}
          className={`w-1 ${colorClass} rounded-sm`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )
}

function LiveCounterCard({ label, value, subtext, borderColor, textColor, sparkline, sparkColorClass }) {
  return (
    <div className={`p-3 bg-surface-container rounded-lg border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-label-md text-on-surface-variant uppercase tracking-wider">{label}</p>
        <SparkBar sparkline={sparkline} colorClass={sparkColorClass} />
      </div>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className="text-[10px] text-on-surface-variant mt-1">{subtext}</p>
    </div>
  )
}

export default function LivePerformanceMonitor({ livePerformance }) {
  const [ctrData, setCtrData] = useState([])
  const [liveCounters, setLiveCounters] = useState({
    eventsPerSec: 0,
    activeUsers: 0,
    fraudBlockedToday: 0,
    avgLatency: 0,
  })
  const [sparklines, setSparklines] = useState({
    events: getSparkline(),
    users: getSparkline(),
    fraud: getSparkline(),
    latency: getSparkline(),
  })
  const initializedRef = useRef(false)

  // Seed chart from REST response
  useEffect(() => {
    if (!livePerformance || initializedRef.current) return
    initializedRef.current = true

    const timestamps = Array.isArray(livePerformance.timestamps) ? livePerformance.timestamps : []
    const ctrHistory = Array.isArray(livePerformance.ctr_history) ? livePerformance.ctr_history : []
    const fraudHistory = Array.isArray(livePerformance.fraud_rate_history) ? livePerformance.fraud_rate_history : []

    const points = timestamps.map((ts, i) => ({
      time: new Date(ts).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }),
      ctr: ctrHistory[i] ?? 0,
      fraudRate: fraudHistory[i] ?? 0,
      events: livePerformance.events_per_second ?? 0,
    }))

    setCtrData(points)
    setLiveCounters({
      eventsPerSec: livePerformance.events_per_second,
      activeUsers: livePerformance.active_users,
      fraudBlockedToday: livePerformance.fraud_blocked_today,
      avgLatency: livePerformance.avg_latency_ms,
    })
  }, [livePerformance])

  // WebSocket updates for live counters
  const handleWsMessage = useCallback((payload) => {
    setLiveCounters({
      eventsPerSec: payload.events_per_second,
      activeUsers: payload.active_users,
      fraudBlockedToday: payload.fraud_blocked_today,
      avgLatency: payload.avg_latency_ms,
    })

    const newPoint = {
      time: new Date(payload.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }),
      // WebSocket payload does not include ctr or fraudRate — avoid injecting
      // zero/fake values into the chart. Use null so Recharts will skip drawing.
      ctr: null,
      fraudRate: null,
      events: payload.events_per_second,
    }

    setCtrData(prev => {
      const next = [...prev.slice(-19), newPoint]
      return next
    })

    setSparklines({
      events: getSparkline(),
      users: getSparkline(),
      fraud: getSparkline(),
      latency: getSparkline(),
    })
  }, [])

  useCampaignsWebSocket({ onMessage: handleWsMessage })

  return (
    <section>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Live Performance Monitor</h2>
          <p className="font-body-md text-on-surface-variant">Real-time metrics streamed via Apache Kafka</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Chart Panel */}
        <div className="lg:col-span-2 bg-surface-container-low border border-outline-variant rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-title-lg text-title-lg">Click-Through Rate vs Fraud Rate — Live</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                CTR Model: XGBoost v2.1 | Fraud Detection: Isolation Forest
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-500">LIVE</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ctrData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={10} tickLine={false} unit="%" />
              <Tooltip content={<CampaignChartTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="ctr" stroke="#6366f1" strokeWidth={2} dot={false} name="CTR" unit="%" />
              <Line type="monotone" dataKey="fraudRate" stroke="#ef4444" strokeWidth={2} dot={false} name="Fraud Rate" unit="%" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Live Counter Cards */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-3">
          <LiveCounterCard
            label="Events / Second"
            value={Math.round(liveCounters.eventsPerSec).toLocaleString()}
            subtext="Kafka stream: ad_impressions topic"
            borderColor="border-primary"
            textColor="text-primary"
            sparkline={sparklines.events}
            sparkColorClass="bg-primary/60"
          />
          <LiveCounterCard
            label="Active Users"
            value={Math.round(liveCounters.activeUsers).toLocaleString()}
            subtext="Real-time user sessions"
            borderColor="border-info"
            textColor="text-info"
            sparkline={sparklines.users}
            sparkColorClass="bg-info/60"
          />
          <LiveCounterCard
            label="Fraud Blocked Today"
            value={Math.round(liveCounters.fraudBlockedToday).toLocaleString()}
            subtext="Invalid clicks prevented"
            borderColor="border-error"
            textColor="text-error"
            sparkline={sparklines.fraud}
            sparkColorClass="bg-error/60"
          />
          <LiveCounterCard
            label="Inference Latency"
            value={`${Math.round(liveCounters.avgLatency)}ms`}
            subtext="XGBoost + Isolation Forest inference"
            borderColor="border-tertiary"
            textColor="text-tertiary"
            sparkline={sparklines.latency}
            sparkColorClass="bg-tertiary/60"
          />
        </div>
      </div>
    </section>
  )
}