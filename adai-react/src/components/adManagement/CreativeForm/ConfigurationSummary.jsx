// ============================================================
// src/components/adManagement/CreativeForm/ConfigurationSummary.jsx
// ============================================================

export default function ConfigurationSummary({
  campaignTitle,
  dailyBudget,
  adFormat,
  bidStrategy,
  adCategory,
  durationDays,
  dateError,
  tagsCount,
}) {
  return (
    <div className="col-span-2 flex flex-wrap gap-2 items-center py-2 px-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
      <span className="text-xs text-on-surface-variant mr-1">Current config:</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${campaignTitle ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
        Title: {campaignTitle || 'missing'}
      </span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${dailyBudget && parseFloat(dailyBudget) > 0 ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
        Budget: ${dailyBudget || '0'}
      </span>
      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
        Format: {adFormat}
      </span>
      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
        Strategy: {bidStrategy}
      </span>
      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
        Category: {adCategory}
      </span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${durationDays !== null && !dateError ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
        Duration: {durationDays !== null && !dateError ? `${durationDays} days` : 'invalid'}
      </span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${tagsCount > 0 ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
        Tags: {tagsCount}
      </span>
    </div>
  )
}
