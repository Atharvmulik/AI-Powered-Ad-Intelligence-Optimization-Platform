import { CPU_BAR_VALUES, CPU_HIGH_THRESHOLD_PCT } from '../../constants/systemHealth'

const CpuUtilization = () => {
  return (
    <div className="glass-card rounded-xl p-6 flex-1">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-title-lg text-title-lg">CPU Utilization</h3>
        <span className="font-label-md text-primary font-mono text-xs font-bold">64.8%</span>
      </div>
      <div className="grid grid-cols-8 gap-2 h-16 items-end">
        {CPU_BAR_VALUES.map((h, idx) => {
          const color = h > CPU_HIGH_THRESHOLD_PCT ? 'bg-tertiary' : 'bg-primary/80'
          return (
            <div key={idx} className={`${color} rounded`} style={{ height: `${h}%` }}></div>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-on-surface-variant">Averaged across 24 nodes. Peak observed on node-ai-04.</p>
    </div>
  )
}

export default CpuUtilization
