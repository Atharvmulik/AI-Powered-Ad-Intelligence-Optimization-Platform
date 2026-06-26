// ============================================================
// src/components/adManagement/CreativeForm/CampaignDetailsSection.jsx
// ============================================================

export default function CampaignDetailsSection({
  campaignTitle,
  onCampaignTitleChange,
  dailyBudget,
  onDailyBudgetChange,
}) {
  return (
    <>
      <div className="col-span-2 md:col-span-1 space-y-2">
        <label className="text-label-md text-on-surface-variant">Campaign Title</label>
        <input
          className="w-full bg-surface-container-lowest border-outline-variant border rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface"
          placeholder="e.g. Winter Performance Boost"
          type="text"
          value={campaignTitle}
          onChange={(e) => onCampaignTitleChange(e.target.value)}
        />
      </div>
      <div className="col-span-2 md:col-span-1 space-y-2">
        <label className="text-label-md text-on-surface-variant">Daily Budget (USD)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
          <input
            className="w-full bg-surface-container-lowest border-outline-variant border rounded-lg py-3 pl-8 pr-4 focus:ring-2 focus:ring-primary focus:outline-none text-on-surface"
            placeholder="0.00"
            type="number"
            value={dailyBudget}
            onChange={(e) => onDailyBudgetChange(e.target.value)}
          />
        </div>
      </div>
    </>
  )
}
