// ============================================================
// src/components/adManagement/CreativeForm/CampaignDurationSection.jsx
// ============================================================

export default function CampaignDurationSection({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  dateError,
}) {
  return (
    <div className="col-span-2 space-y-2">
      <label className="text-label-md text-on-surface-variant">Campaign Duration</label>
      <div className="flex gap-4">
        <div className="flex-1 space-y-1">
          <span className="text-xs text-on-surface-variant">Start Date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full bg-surface-container-lowest border-outline-variant border rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface"
          />
        </div>
        <div className="flex-1 space-y-1">
          <span className="text-xs text-on-surface-variant">End Date</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full bg-surface-container-lowest border-outline-variant border rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface"
          />
        </div>
      </div>
      {dateError && <p className="text-red-400 text-xs mt-1">{dateError}</p>}
    </div>
  )
}
