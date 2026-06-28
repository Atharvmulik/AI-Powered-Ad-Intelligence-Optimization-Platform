export default function DeviceBreakdownCard() {
  return (
    <div className="glass-card rounded-xl p-6 flex-1">
      <h3 className="font-title-lg text-title-lg mb-6">Device Breakdown</h3>
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          {/* track */}
          <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#1e1e2e" strokeWidth="3" />
          {/* Mobile 48% */}
          <circle cx="18" cy="18" fill="transparent" r="15.915"
            stroke="#ffb783"
            strokeDasharray="48 52"
            strokeDashoffset="0"
            strokeWidth="3"
          />
          {/* Desktop 38% — offset by -48 */}
          <circle cx="18" cy="18" fill="transparent" r="15.915"
            stroke="#c0c1ff"
            strokeDasharray="38 62"
            strokeDashoffset="-48"
            strokeWidth="3"
          />
          {/* Tablet 14% — offset by -(48+38) = -86 */}
          <circle cx="18" cy="18" fill="transparent" r="15.915"
            stroke="#d0bcff"
            strokeDasharray="14 86"
            strokeDashoffset="-86"
            strokeWidth="3"
          />
        </svg>
        <div className="absolute text-center">
          <span className="font-headline-md text-headline-md block font-black">48%</span>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter font-mono">Mobile</span>
        </div>
      </div>
      <div className="mt-8 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary" /><span className="text-sm">Mobile</span></div>
          <span className="font-label-md font-mono text-xs">48%</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-sm">Desktop</span></div>
          <span className="font-label-md font-mono text-xs">38%</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-tertiary" /><span className="text-sm">Tablet</span></div>
          <span className="font-label-md font-mono text-xs">14%</span>
        </div>
      </div>
    </div>
  )
}