// ============================================================
// src/components/adManagement/CampaignPortfolioTable.jsx
// ============================================================

const statusStyles = {
  Active: 'bg-green-900/20 text-green-400 border-green-500/30',
  Paused: 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30',
  Halted: 'bg-red-900/20 text-red-400 border-red-500/30',
}

const fraudStyles = {
  Low: { color: 'text-green-400', icon: 'check_circle' },
  Medium: { color: 'text-yellow-400', icon: 'report' },
  Critical: { color: 'text-red-400', icon: 'gpp_bad' },
}

function CampaignLogo({ logo }) {
  const baseClass = 'w-10 h-10 rounded flex items-center justify-center p-1'

  if (logo.type === 'image') {
    return (
      <div className={`${baseClass} ${logo.wrapperClass} overflow-hidden`}>
        <img alt={logo.alt} className="object-contain max-h-full" src={logo.src} />
      </div>
    )
  }

  return (
    <div className={`${baseClass} ${logo.wrapperClass}`}>
      <span className="material-symbols-outlined">{logo.icon}</span>
    </div>
  )
}

export default function CampaignPortfolioTable({ campaigns, activeCount }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container/30">
        <h3 className="font-title-lg text-title-lg text-on-surface">Active Ad Portfolio</h3>
        <span className="bg-primary-container/20 text-primary px-3 py-1 rounded-full text-label-md">
          {activeCount} Active Items
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low text-on-surface-variant text-label-md">
            <tr>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider">Brand &amp; Ad Name</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider">CTR</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider">Fraud Risk</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider">Engagement</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {campaigns.map((campaign) => {
              const fraud = fraudStyles[campaign.fraudRisk]
              return (
                <tr key={campaign.id} className="hover:bg-surface-container transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <CampaignLogo logo={campaign.logo} />
                      <div>
                        <p className="font-bold text-on-surface">{campaign.name}</p>
                        <p className="text-on-surface-variant text-xs">{campaign.subtitle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-label-md text-primary">{campaign.ctr}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full border ${statusStyles[campaign.status]}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center ${fraud.color}`}>
                      <span className="material-symbols-outlined text-[16px] mr-1">{fraud.icon}</span>
                      <span className="text-xs">{campaign.fraudRisk}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${campaign.engagement}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-on-surface-variant hover:text-white transition-all">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
