import { useSystemHealth }          from '@/hooks/useSystemHealth'
import { useSystemHealthWebSocket } from '@/hooks/useSystemHealthWebSocket'

import SystemHealthHeader from '../components/systemHealth/SystemHealthHeader'
import ServiceGrid        from '../components/systemHealth/ServiceGrid'
import GlobalLatencyChart from '../components/systemHealth/GlobalLatencyChart'
import CpuUtilization     from '../components/systemHealth/CpuUtilization'
import MemoryPressure     from '../components/systemHealth/MemoryPressure'
import KafkaThroughput    from '../components/systemHealth/KafkaThroughput'
import AuditLog           from '../components/systemHealth/AuditLog'

export default function SystemHealth() {
  const {
    services,
    nfrBadges,
    latencyTrend,
    kafkaThroughput,
    auditLog,
    overallStatus,
    loading,
    error,
    refreshSystemHealth,
  } = useSystemHealth()

  const { liveData, connected } = useSystemHealthWebSocket()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-on-surface-variant font-mono text-sm animate-pulse">
          Loading system health data...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <span className="text-error font-mono text-sm">{error}</span>
        <button
          onClick={refreshSystemHealth}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-label-md"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-stack-lg">
      {/* Header — operational status badge + NFR SLA pills */}
      <SystemHealthHeader
        overallStatus={overallStatus}
        nfrBadges={nfrBadges}
        connected={connected}
      />

      {/* Service status cards — 6 infrastructure services */}
      <ServiceGrid services={services} />

      {/* Performance Bento — latency chart + CPU + memory */}
      <div className="grid grid-cols-12 gap-gutter">
        <GlobalLatencyChart latencyTrend={latencyTrend} />

        <div className="col-span-12 lg:col-span-5 flex flex-col gap-gutter">
          <CpuUtilization />
          <MemoryPressure />
        </div>
      </div>

      {/* Kafka throughput counter + sparkline */}
      <KafkaThroughput
        kafkaThroughput={kafkaThroughput}
        liveData={liveData}
      />

      {/* Live audit terminal */}
      <AuditLog
        auditLog={auditLog}
        liveData={liveData}
      />

      {/* Visual Background Glow */}
      <div className="fixed top-0 left-60 w-full h-full pointer-events-none -z-10 opacity-20">
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-primary/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] bg-tertiary/20 rounded-full blur-[100px]"></div>
      </div>
    </div>
  )
}
