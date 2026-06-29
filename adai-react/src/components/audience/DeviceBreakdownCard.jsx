export default function DeviceBreakdownCard({ device }) {
  const mobilePct = device?.mobile_pct ?? 0
  const desktopPct = device?.desktop_pct ?? 0
  const tabletPct = device?.tablet_pct ?? 0

  return (
    <div className="glass-card rounded-xl p-6 flex-1">
      <h3 className="font-title-lg text-title-lg mb-6">Device Breakdown</h3>
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          {/* track */}
          <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#1e1e2e" strokeWidth="3" />
          {/* Mobile */}
          <circle cx="18" cy="18" fill="transparent" r="15.915"
            stroke="#ffb783"
            strokeDasharray={`${mobilePct} ${100 - mobilePct}`}
            strokeDashoffset="0"
            strokeWidth="3"
          />
          {/* Desktop — offset by -mobilePct */}
          <circle cx="18" cy="18" fill="transparent" r="15.915"
            stroke="#c0c1ff"
            strokeDasharray={`${desktopPct} ${100 - desktopPct}`}
            strokeDashoffset={`${-mobilePct}`}
            strokeWidth="3"
          />
          {/* Tablet — offset by -(mobilePct+desktopPct) */}
          <circle cx="18" cy="18" fill="transparent" r="15.915"
            stroke="#d0bcff"
            strokeDasharray={`${tabletPct} ${100 - tabletPct}`}
            strokeDashoffset={`${-(mobilePct + desktopPct)}`}
            strokeWidth="3"
          />
        </svg>
        <div className="absolute text-center">
          <span className="font-headline-md text-headline-md block font-black">{mobilePct}%</span>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter font-mono">Mobile</span>
        </div>
      </div>
      <div className="mt-8 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary" /><span className="text-sm">Mobile</span></div>
          <span className="font-label-md font-mono text-xs">{mobilePct}%</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-sm">Desktop</span></div>
          <span className="font-label-md font-mono text-xs">{desktopPct}%</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-tertiary" /><span className="text-sm">Tablet</span></div>
          <span className="font-label-md font-mono text-xs">{tabletPct}%</span>
        </div>
      </div>
    </div>
  )
}