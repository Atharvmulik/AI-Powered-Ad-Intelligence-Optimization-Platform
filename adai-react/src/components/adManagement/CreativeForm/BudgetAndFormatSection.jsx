// ============================================================
// src/components/adManagement/CreativeForm/BudgetAndFormatSection.jsx
// ============================================================

const adFormats = ['Banner', 'Video', 'Native']

const bidStrategies = [
  { value: 'CPC', subtitle: 'Per Click' },
  { value: 'CPM', subtitle: 'Per 1,000 Impressions' },
  { value: 'CPA', subtitle: 'Per Action' },
]

export default function BudgetAndFormatSection({
  adFormat,
  onAdFormatChange,
  bidStrategy,
  onBidStrategyChange,
}) {
  return (
    <>
      <div className="col-span-2 space-y-2">
        <label className="text-label-md text-on-surface-variant">Ad Format</label>
        <div className="flex gap-3">
          {adFormats.map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => onAdFormatChange(format)}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                adFormat === format
                  ? 'bg-primary text-on-primary-container shadow-lg shadow-primary/20'
                  : 'bg-surface-container-high text-on-surface-variant border border-outline-variant hover:bg-surface-bright'
              }`}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-2 space-y-2">
        <label className="text-label-md text-on-surface-variant">Bid Strategy</label>
        <div className="flex gap-3">
          {bidStrategies.map((strategy) => (
            <button
              key={strategy.value}
              type="button"
              onClick={() => onBidStrategyChange(strategy.value)}
              className={`flex-1 py-2 rounded-lg font-medium transition-all flex flex-col items-center ${
                bidStrategy === strategy.value
                  ? 'bg-primary text-on-primary-container shadow-lg shadow-primary/20'
                  : 'bg-surface-container-high text-on-surface-variant border border-outline-variant hover:bg-surface-bright'
              }`}
            >
              <span>{strategy.value}</span>
              <span className="text-[10px] opacity-70">{strategy.subtitle}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
