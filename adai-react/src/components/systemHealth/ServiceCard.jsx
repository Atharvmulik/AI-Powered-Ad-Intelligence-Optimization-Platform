/**
 * ServiceCard
 *
 * Renders a single infrastructure service status card.
 * Supports both healthy and SLA-breach visual states.
 *
 * Props
 * -----
 * icon          : string  — material-symbols-outlined icon name
 * iconColor     : string  — Tailwind text color class for the icon
 * borderColor   : string  — Tailwind border-l-* color class
 * statusLabel   : string  — badge text, e.g. "Healthy" | "SLA Breach"
 * statusColor   : string  — Tailwind text color class for the badge
 * title         : string  — service display name
 * metricLabel   : string  — left column label, e.g. "Uptime"
 * metricValue   : string  — right column value, e.g. "99.998%"
 * metricColor   : string  — optional Tailwind text color for metricValue
 * subLabel      : string  — optional small sub-line below the metric row
 * subColor      : string  — optional Tailwind text color for subLabel
 * alertText     : string  — optional SLA breach alert body text
 */
const ServiceCard = ({
  icon,
  iconColor = 'text-primary',
  borderColor = 'border-l-primary',
  statusLabel,
  statusColor,
  title,
  metricLabel,
  metricValue,
  metricColor = '',
  subLabel,
  subColor = 'text-green-400',
  alertText,
}) => {
  return (
    <div className={`glass-card rounded-xl p-5 border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-surface-container-highest rounded">
          <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
        </div>
        <span className={`text-[10px] font-label-md uppercase tracking-tighter font-mono font-bold ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <p className="font-bold text-on-surface">{title}</p>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-on-surface-variant">{metricLabel}</span>
        <span className={`text-xs font-label-md font-mono ${metricColor}`}>{metricValue}</span>
      </div>

      {subLabel && (
        <span className={`text-[10px] mt-1 flex items-center gap-1 ${subColor}`}>
          {subLabel}
        </span>
      )}

      {alertText && (
        <div className="mt-2 text-[10px] bg-error/10 text-error p-1 rounded flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">warning</span>{' '}
          {alertText}
        </div>
      )}
    </div>
  )
}

export default ServiceCard
