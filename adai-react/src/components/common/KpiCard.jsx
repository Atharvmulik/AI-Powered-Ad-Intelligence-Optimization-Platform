export default function KpiCard({
  label,
  value,
  trendText,
  trendDirection = 'up',
  color = 'primary',
  sparklineElement,
  subText,
  showLivePulse = false,
}) {
  const getTrendColor = () => {
    if (trendDirection === 'up') return 'text-primary'
    if (trendDirection === 'down') return 'text-error'
    if (trendDirection === 'success') return 'text-green-400'
    return 'text-on-surface-variant'
  }

  const getCardBorder = () => {
    if (color === 'primary') return 'hover:border-primary/50'
    if (color === 'error') return 'hover:border-error/50'
    if (color === 'warning') return 'hover:border-[#ffb783]/50'
    if (color === 'success') return 'hover:border-green-400/50'
    return 'hover:border-outline'
  }

  return (
    <div className={`bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-2 transition-all group relative overflow-hidden ${getCardBorder()}`}>
      <span className="text-on-surface-variant font-label-md text-label-md uppercase flex items-center gap-1.5">
        {label}
        {showLivePulse && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        )}
      </span>
      <div className="flex items-baseline justify-between">
        <span className={`font-label-md text-headline-md font-black ${color === 'warning' ? 'text-[#ffb783]' : 'text-on-surface'}`}>
          {value}
        </span>
        {trendText && (
          <span className={`${getTrendColor()} font-label-md text-xs font-bold flex items-center`}>
            {trendDirection === 'up' || trendDirection === 'success' ? (
              <span className="material-symbols-outlined text-[12px] mr-0.5">trending_up</span>
            ) : trendDirection === 'down' ? (
              <span className="material-symbols-outlined text-[12px] mr-0.5">trending_down</span>
            ) : null}
            {trendText}
          </span>
        )}
      </div>
      {subText && (
        <span className="text-[10px] text-on-surface-variant -mt-1 font-mono uppercase tracking-tighter">{subText}</span>
      )}
      {sparklineElement && (
        <div className="h-12 w-full mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
          {sparklineElement}
        </div>
      )}
    </div>
  )
}
