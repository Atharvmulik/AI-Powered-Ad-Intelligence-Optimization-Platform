import {
  MEMORY_APP_GB,
  MEMORY_CACHE_GB,
  MEMORY_FREE_GB,
  MEMORY_TOTAL_GB,
  MEMORY_HIGH_THRESHOLD_PCT,
} from '../../constants/systemHealth'

const memoryPct = Math.round(((MEMORY_APP_GB + MEMORY_CACHE_GB) / MEMORY_TOTAL_GB) * 1000) / 10

const MemoryPressure = () => {
  return (
    <div className="glass-card rounded-xl p-6 flex-1 flex flex-col justify-between">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-title-lg text-title-lg">Memory Pressure</h3>
        <span className={`font-label-md font-mono text-xs font-bold ${memoryPct > MEMORY_HIGH_THRESHOLD_PCT ? 'text-error' : 'text-primary'}`}>
          {memoryPct}%
        </span>
      </div>
      <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden flex">
        <div
          className="bg-primary h-full border-r border-background"
          style={{ width: `${(MEMORY_APP_GB / MEMORY_TOTAL_GB) * 100}%` }}
        ></div>
        <div
          className="bg-tertiary h-full border-r border-background"
          style={{ width: `${(MEMORY_CACHE_GB / MEMORY_TOTAL_GB) * 100}%` }}
        ></div>
        <div
          className="bg-surface-variant h-full"
          style={{ width: `${(MEMORY_FREE_GB / MEMORY_TOTAL_GB) * 100}%` }}
        ></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-[10px]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-primary"></div>
          <span className="font-label-md uppercase font-mono">Application: {MEMORY_APP_GB} GB</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-tertiary"></div>
          <span className="font-label-md uppercase font-mono">Cache: {MEMORY_CACHE_GB} GB</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-surface-variant"></div>
          <span className="font-label-md uppercase font-mono">Free: {MEMORY_FREE_GB} GB</span>
        </div>
        <div className="text-on-surface-variant ml-auto font-mono">Total: {MEMORY_TOTAL_GB} GB</div>
      </div>
    </div>
  )
}

export default MemoryPressure
