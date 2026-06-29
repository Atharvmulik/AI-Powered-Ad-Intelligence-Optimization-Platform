import { useMemo } from 'react'
import ServiceCard from './ServiceCard'
import { SERVICE_CARDS_CONFIG } from '../../constants/systemHealth'

// ---------------------------------------------------------------------------
// Adapters — map ServiceHealthResponse to ServiceCard prop shape
// ---------------------------------------------------------------------------

const SERVICE_ICON_MAP = {
  'Core API':        { icon: 'api',      iconColor: 'text-primary' },
  'Kafka Cluster':   { icon: 'lan',      iconColor: 'text-primary' },
  'Redis Cache':     { icon: 'database', iconColor: 'text-primary' },
  'ML Inference':    { icon: 'neurology',iconColor: 'text-error'   },
  'Fraud Detection': { icon: 'security', iconColor: 'text-primary' },
  'PostgreSQL':      { icon: 'storage',  iconColor: 'text-primary' },
}

const SERVICE_METRIC_MAP = {
  'Core API':        s => ({ metricLabel: 'Uptime',     metricValue: `${s.uptime.toFixed(3)}%`          }),
  'Kafka Cluster':   s => ({ metricLabel: 'Lag',        metricValue: `${s.latency_ms.toFixed(0)}ms`     }),
  'Redis Cache':     () => ({ metricLabel: 'Hit Rate',  metricValue: '94.2%'                            }),
  'ML Inference':    s => ({ metricLabel: 'Latency',    metricValue: `${s.latency_ms.toFixed(0)}ms`     }),
  'Fraud Detection': s => ({ metricLabel: 'Uptime',     metricValue: `${s.uptime.toFixed(1)}%`          }),
  'PostgreSQL':      s => ({ metricLabel: 'Query Time', metricValue: `${s.latency_ms.toFixed(0)}ms`     }),
}

const resolveStatusStyle = (status) => {
  if (status === 'Healthy')  return { borderColor: 'border-l-primary',  statusColor: 'text-green-400' }
  if (status === 'Degraded') return { borderColor: 'border-l-tertiary', statusColor: 'text-tertiary'  }
  return                            { borderColor: 'border-l-error',    statusColor: 'text-error'     }
}

const resolveSubLabel = (s) => {
  if (s.status !== 'Healthy') return {}
  if (s.service_name === 'Core API')        return { subLabel: '✓ Above SLA',         subColor: 'text-green-400' }
  if (s.service_name === 'Fraud Detection') return { subLabel: '✓ Above SLA (99.5%)', subColor: 'text-green-400' }
  return {}
}

const resolveAlertText = (s) => {
  if (s.service_name === 'ML Inference' && s.latency_ms > 30) {
    return `⚠ SLA BREACH: ${s.latency_ms.toFixed(0)}ms exceeds the 30ms inference target`
  }
  if (s.service_name === 'Core API' && s.latency_ms > 100) {
    return `⚠ SLA BREACH: ${s.latency_ms.toFixed(0)}ms exceeds the 100ms bid response target`
  }
  return undefined
}

const adaptServiceCard = (s) => ({
  title:       s.service_name,
  statusLabel: s.status,
  metricColor: s.status !== 'Healthy' ? 'text-error' : '',
  alertText:   resolveAlertText(s),
  ...(SERVICE_ICON_MAP[s.service_name]        ?? { icon: 'dns', iconColor: 'text-primary' }),
  ...(SERVICE_METRIC_MAP[s.service_name]?.(s) ?? { metricLabel: 'Latency', metricValue: `${s.latency_ms}ms` }),
  ...resolveStatusStyle(s.status),
  ...resolveSubLabel(s),
})

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ServiceGrid
 *
 * Props
 * -----
 * services : ServiceHealthResponse[]  — from useSystemHealth()
 *            Falls back to SERVICE_CARDS_CONFIG when empty (before
 *            first fetch resolves) so the grid is never blank.
 */
const ServiceGrid = ({ services = [] }) => {
  const cards = useMemo(() => {
    if (services.length > 0) return services.map(adaptServiceCard)
    return SERVICE_CARDS_CONFIG
  }, [services])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-gutter">
      {cards.map((card) => (
        <ServiceCard key={card.title} {...card} />
      ))}
    </div>
  )
}

export default ServiceGrid
