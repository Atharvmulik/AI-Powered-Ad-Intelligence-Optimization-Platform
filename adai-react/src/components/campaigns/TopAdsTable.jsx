// src/components/campaigns/TopAdsTable.jsx

export default function TopAdsTable({ topAds }) {
  const list = topAds ?? []
  return (
    <section>
      <div className="mb-6">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Top Performing Ads</h2>
        <p className="font-body-md text-on-surface-variant">
          Ranked by CTR and fraud-filtered revenue across active campaigns
        </p>
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant text-xs font-label-md text-on-surface-variant uppercase tracking-wider">
              <th className="p-4">Ad ID</th>
              <th className="p-4">Campaign</th>
              <th className="p-4">Format</th>
              <th className="p-4 text-right">CTR</th>
              <th className="p-4 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-on-surface-variant font-body-md">
                  No top ads data available.
                </td>
              </tr>
            ) : (
              list.map((ad, idx) => (
                <tr key={ad.ad_id} className="hover:bg-surface-container transition-colors">
                  <td className="p-4 font-mono text-sm text-primary">#{idx + 1} {ad.ad_id}</td>
                  <td className="p-4 text-sm text-on-surface-variant">{ad.campaign_name}</td>
                  <td className="p-4 text-sm text-on-surface-variant">{ad.format}</td>
                  <td className="p-4 text-right text-sm font-bold text-tertiary">{ad.ctr}%</td>
                  <td className="p-4 text-right text-sm font-mono text-on-surface">
                    ${ad.revenue.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}