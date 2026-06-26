// src/components/analytics/ClickDistribution.jsx
// Bento row 1 (right 4/12 cols) — Click Distribution donut + channel bars.
// No props — fully static/presentational.

export default function ClickDistribution() {
  return (
    <div className="col-span-12 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6 h-full">
      <h3 className="text-on-surface font-bold mb-4 text-title-lg">Click Distribution</h3>

      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Donut chart */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="#571bc1" strokeDasharray="60, 100" strokeWidth="4"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="#c0c1ff" strokeDasharray="40, 100" strokeDashoffset="-60" strokeWidth="4"
            />
          </svg>
          <div className="absolute text-center">
            <span className="block font-bold text-lg">12.4K</span>
            <span className="text-[10px] text-on-surface-variant uppercase">Total</span>
          </div>
        </div>

        {/* Channel breakdown */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant">Search Ads</span>
            <span className="font-bold text-primary">60%</span>
          </div>
          <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[60%]" />
          </div>

          <div className="flex justify-between text-xs pt-2">
            <span className="text-on-surface-variant">Social Media</span>
            <span className="font-bold text-secondary">40%</span>
          </div>
          <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
            <div className="bg-secondary h-full w-[40%]" />
          </div>
        </div>
      </div>
    </div>
  )
}