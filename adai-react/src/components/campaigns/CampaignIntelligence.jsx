// src/components/campaigns/CampaignIntelligence.jsx

const FRAUD_RISK_CONFIG = {
  low: {
    dot: 'bg-green-500',
    text: 'text-green-500',
    label: 'Low Fraud Risk',
    icon: 'verified',
    iconColor: 'text-primary',
    opacity: '',
  },
  medium: {
    dot: 'bg-amber-500',
    text: 'text-amber-500',
    label: 'Medium Fraud Risk',
    icon: 'warning',
    iconColor: 'text-amber-500',
    opacity: '',
  },
  high: {
    dot: 'bg-red-500',
    text: 'text-red-500',
    label: 'High Fraud Risk',
    icon: 'bug_report',
    iconColor: 'text-error',
    opacity: '',
  },
}

const STATUS_OPACITY = {
  scheduled: 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100',
  paused: 'opacity-70',
  active: '',
}

function CampaignCard({ campaign }) {
  const risk = FRAUD_RISK_CONFIG[(campaign.fraud_risk ?? 'low').toLowerCase()] ?? FRAUD_RISK_CONFIG.low
  const statusClass = STATUS_OPACITY[(campaign.status ?? 'active').toLowerCase()] ?? ''
  const spendPct = campaign.budget > 0 ? (campaign.spend / campaign.budget) * 100 : 0
  const isScheduled = (campaign.status ?? '').toLowerCase() === 'scheduled'

  return (
    <div className={`bg-surface-container-low border border-outline-variant rounded-xl p-5 hover:border-primary/50 transition-all group ${statusClass}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse ${isScheduled ? 'bg-on-surface-variant' : 'bg-green-500'}`} />
          <h3 className="font-title-lg text-title-lg">{campaign.campaign_name}</h3>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">
          more_vert
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
        <span className={`text-xs font-label-md ${risk.text}`}>{risk.label}</span>
      </div>

      <p className="text-xs font-label-md text-on-surface-variant mb-2 tracking-wider uppercase">
        {campaign.campaign_type} • {campaign.channel}
      </p>

      {!isScheduled && (
        <>
          {/* Fraud-Filtered Clicks */}
          <div className="mb-4 p-3 bg-surface-container rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-label-md text-on-surface-variant">Clicks Validation</span>
              <span className={`material-symbols-outlined text-sm ${risk.iconColor}`}>{risk.icon}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <div>
                <p className="text-[10px] text-on-surface-variant">Raw Clicks</p>
                <p className="text-sm font-mono text-on-surface-variant">{campaign.raw_clicks.toLocaleString()}</p>
              </div>
              <span className="text-on-surface-variant">→</span>
              <div>
                <p className="text-[10px] text-green-500">Clean Clicks</p>
                <p className="text-sm font-mono text-green-500">{campaign.clean_clicks.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">bug_report</span>Filtered
                </p>
                <p className="text-sm font-mono text-error">-{campaign.fraud_filtered.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1 font-label-md">
                <span className="text-on-surface-variant">Spend Progress</span>
                <span className="text-on-surface">
                  ${campaign.spend.toLocaleString()} / ${campaign.budget.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${spendPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-surface-container rounded-lg">
                <p className="text-[10px] font-label-md text-on-surface-variant uppercase">ROAS</p>
                <p className="text-lg font-bold text-tertiary">{campaign.roas}x</p>
              </div>
              <div className="p-3 bg-surface-container rounded-lg">
                <p className="text-[10px] font-label-md text-on-surface-variant uppercase">CPA</p>
                <p className="text-lg font-bold text-primary">${campaign.cpa}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {isScheduled && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1 font-label-md">
              <span className="text-on-surface-variant">Status</span>
              <span className="text-on-surface capitalize">{campaign.status}</span>
            </div>
            <div className="w-full bg-surface-dim h-1.5 rounded-full overflow-hidden">
              <div className="bg-outline-variant h-full rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 pt-2">
            <div className="p-3 bg-surface-container rounded-lg flex justify-between items-center">
              <p className="text-xs font-label-md text-on-surface-variant uppercase">Budget Allocation</p>
              <p className="text-body-md font-bold text-on-surface">${campaign.budget.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CampaignIntelligence({ campaigns }) {
  const list = campaigns ?? []

  if (!list.length) {
    return (
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Campaign Intelligence</h2>
            <p className="font-body-md text-on-surface-variant">
              ML-powered attribution and fraud-filtered metrics
            </p>
          </div>
        </div>
        <p className="text-on-surface-variant font-body-md">No campaigns found.</p>
      </section>
    )
  }

  return (
    <section>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Campaign Intelligence</h2>
          <p className="font-body-md text-on-surface-variant">
            ML-powered attribution and fraud-filtered metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {list.map((campaign) => (
          <CampaignCard key={campaign.campaign_id} campaign={campaign} />
        ))}
      </div>
    </section>
  )
}