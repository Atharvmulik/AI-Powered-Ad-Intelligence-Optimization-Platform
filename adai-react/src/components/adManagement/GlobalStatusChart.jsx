// ============================================================
// src/components/adManagement/GlobalStatusChart.jsx
// ============================================================

export default function GlobalStatusChart({ data }) {
  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="font-title-lg text-title-lg text-on-surface mb-6">Global Status</h3>
      <div className="flex items-center justify-between">
        <div className="w-32 h-32 relative">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {data.map((segment) => (
              <circle
                key={segment.label}
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke={segment.strokeColor}
                strokeDasharray="251.32"
                strokeDashoffset={segment.dashoffset}
                strokeWidth="14"
              ></circle>
            ))}
          </svg>
        </div>
        <div className="space-y-2 flex-1 pl-8">
          {data.map((segment) => (
            <div key={segment.label} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${segment.dotClass}`}></span>
                <span className="text-xs text-on-surface-variant">{segment.label}</span>
              </div>
              <span className="text-xs font-bold text-on-surface">{segment.percent}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
