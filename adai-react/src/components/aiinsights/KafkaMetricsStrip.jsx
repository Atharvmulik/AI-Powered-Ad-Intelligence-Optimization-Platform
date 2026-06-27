// src/components/aiinsights/KafkaMetricsStrip.jsx
// Section 1 — three live Kafka metric cards.
// Owns kafkaEventsSec and pipelineLatency state + intervals.

import { useState, useEffect } from 'react'

function PulseDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
    </span>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-all">
      <div>
        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider block">{label}</span>
        <span className="text-xl font-bold font-mono text-primary mt-1 block">{value}</span>
      </div>
      <PulseDot />
    </div>
  )
}

export default function KafkaMetricsStrip() {
  const [kafkaEventsSec,  setKafkaEventsSec]  = useState(8420)
  const [pipelineLatency, setPipelineLatency] = useState(18)

  useEffect(() => {
    const kafkaInterval = setInterval(() => {
      setKafkaEventsSec(prev => {
        const next = prev + Math.floor(Math.random() * 600) - 300
        return next < 7000 ? 7000 : next > 10000 ? 10000 : next
      })
    }, 1500)

    const latencyInterval = setInterval(() => {
      setPipelineLatency(prev => {
        const next = prev + Math.floor(Math.random() * 8) - 4
        return next < 8 ? 8 : next > 28 ? 28 : next
      })
    }, 2000)

    return () => { clearInterval(kafkaInterval); clearInterval(latencyInterval) }
  }, [])

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
      <MetricCard label="Kafka events/sec"    value={kafkaEventsSec.toLocaleString()} />
      <MetricCard label="Active Kafka topics" value="5" />
      <MetricCard label="Pipeline latency"    value={`${pipelineLatency}ms`} />
    </section>
  )
}