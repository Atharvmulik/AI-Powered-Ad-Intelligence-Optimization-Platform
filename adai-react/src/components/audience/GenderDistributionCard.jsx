export default function GenderDistributionCard() {
  return (
    <div className="glass-card rounded-xl p-6 flex-1">
      <h3 className="font-title-lg text-title-lg mb-6">Gender Distribution</h3>
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#1e1e2e" strokeWidth="3" />
          <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#c0c1ff" strokeDasharray="55 45" strokeDashoffset="0" strokeWidth="3" />
          <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#ffb783" strokeDasharray="35 65" strokeDashoffset="-55" strokeWidth="3" />
          <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#d0bcff" strokeDasharray="10 90" strokeDashoffset="-90" strokeWidth="3" />
        </svg>
        <div className="absolute text-center">
          <span className="font-headline-md text-headline-md block font-black">Live</span>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter font-mono">Real-time</span>
        </div>
      </div>
      <div className="mt-8 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-sm">Male</span></div>
          <span className="font-label-md font-mono text-xs">55%</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-tertiary" /><span className="text-sm">Female</span></div>
          <span className="font-label-md font-mono text-xs">35%</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary" /><span className="text-sm">Other</span></div>
          <span className="font-label-md font-mono text-xs">10%</span>
        </div>
      </div>
    </div>
  )
}