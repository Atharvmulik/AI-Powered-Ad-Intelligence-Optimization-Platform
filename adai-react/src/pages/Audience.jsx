import { useState, useEffect } from 'react'

// ─── static segment metadata ──────────────────────────────────────────────────
const SEGMENT_META = [
  {
    name: 'Pro Gamers',
    desc: 'Twitch & Discord heavy users',
    icon: 'sports_esports',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    growth: '+12.4%',
    isUp: true,
    ctr: '3.82%',
    tags: ['High Scroll Depth', 'Evening Peak', 'Desktop Heavy'],
    mobile: 30,
    desktop: 70,
    fraudRisk: 'Medium',
    reachMin: 1.18,
    reachMax: 1.24,
    reachUnit: 'M',
  },
  {
    name: 'Sports Enthusiasts',
    desc: 'Live streaming & betting',
    icon: 'fitness_center',
    iconBg: 'bg-tertiary/10',
    iconColor: 'text-tertiary',
    growth: '+5.1%',
    isUp: true,
    ctr: '2.91%',
    tags: ['Live Stream Viewers', 'Weekend Spike', 'Mobile First'],
    mobile: 65,
    desktop: 35,
    fraudRisk: 'Low',
    reachMin: 820,
    reachMax: 860,
    reachUnit: 'K',
  },
  {
    name: 'Tech Early Adopters',
    desc: 'B2B SaaS & AI Tools',
    icon: 'memory',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    growth: '-1.2%',
    isUp: false,
    ctr: '4.15%',
    tags: ['Long Sessions', 'B2B Hours', 'High Intent'],
    mobile: 45,
    desktop: 55,
    fraudRisk: 'Low',
    reachMin: 2.05,
    reachMax: 2.15,
    reachUnit: 'M',
  },
]

const SHAP_DATA = [
  {
    segment: 'Pro Gamers',
    features: [
      { label: 'user_interest=gaming', value: '+0.31', barW: '85%' },
      { label: 'device=desktop', value: '+0.18', barW: '50%' },
      { label: 'time=evening', value: '+0.12', barW: '33%' },
    ],
    topFeature: 'user_interest=gaming',
  },
  {
    segment: 'Sports Enthusiasts',
    features: [
      { label: 'user_interest=sports', value: '+0.28', barW: '77%' },
      { label: 'device=mobile', value: '+0.21', barW: '58%' },
      { label: 'time=weekend', value: '+0.14', barW: '39%' },
    ],
    topFeature: 'user_interest=sports',
  },
  {
    segment: 'Tech Early Adopters',
    features: [
      { label: 'user_interest=tech', value: '+0.35', barW: '97%' },
      { label: 'session_length=long', value: '+0.22', barW: '61%' },
      { label: 'time=business_hours', value: '+0.16', barW: '44%' },
    ],
    topFeature: 'user_interest=tech',
  },
]

// ─── helpers ──────────────────────────────────────────────────────────────────
const randBetween = (min, max) => Math.random() * (max - min) + min

const formatReach = (meta, val) => {
  if (meta.reachUnit === 'M') return `${val.toFixed(2)}M`
  return `${Math.round(val)}K`
}

const fraudBadgeClass = (risk) =>
  risk === 'Low'
    ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
    : risk === 'Medium'
    ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
    : 'bg-red-400/10 text-red-400 border border-red-400/20'

const fraudDotClass = (risk) =>
  risk === 'Low' ? 'bg-emerald-400' : risk === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'

// ─── Component ────────────────────────────────────────────────────────────────
export default function Audience() {

  // ── Live reach values ──
  const [reaches, setReaches] = useState(() =>
    SEGMENT_META.map((m) =>
      m.reachUnit === 'M'
        ? randBetween(m.reachMin, m.reachMax)
        : randBetween(m.reachMin, m.reachMax)
    )
  )

  // ── Live Active Now counter ──
  const [activeNow, setActiveNow] = useState(23847)

  // ── Reach fluctuation every 3s ──
  useEffect(() => {
    const id = setInterval(() => {
      setReaches(
        SEGMENT_META.map((m) => randBetween(m.reachMin, m.reachMax))
      )
    }, 3000)
    return () => clearInterval(id)
  }, [])

  // ── Active Now fluctuation every 2s ──
  useEffect(() => {
    const id = setInterval(() => {
      setActiveNow((prev) => {
        const delta = Math.floor(randBetween(50, 200)) * (Math.random() > 0.5 ? 1 : -1)
        return Math.max(20000, prev + delta)
      })
    }, 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-stack-lg">

      {/* ══════════════════════════════════════════════════════════════════
          SUMMARY STATS BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Addressable Reach */}
        <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px]">group</span>
          </div>
          <div className="min-w-0">
            <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-label-md">Total Addressable Reach</p>
            <p className="font-bold text-sm text-on-surface">4.14M</p>
          </div>
        </div>

        {/* Avg Fraud Risk */}
        <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-yellow-400 text-[18px]">security</span>
          </div>
          <div className="min-w-0">
            <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-label-md">Avg Fraud Risk</p>
            <p className="font-bold text-sm text-yellow-400">Low-Medium</p>
          </div>
        </div>

        {/* Live Active Now */}
        <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-tertiary text-[18px] animate-pulse">sensors</span>
          </div>
          <div className="min-w-0">
            <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-label-md">Live Active Now</p>
            <p className="font-bold text-sm text-tertiary">{activeNow.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Top Performing Segment */}
        <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px]">emoji_events</span>
          </div>
          <div className="min-w-0">
            <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-label-md">Top Performing Segment</p>
            <p className="font-bold text-sm text-primary truncate">Tech Early Adopters (4.15% CTR)</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TOOLBAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-on-surface-variant font-body-md">Live demographic and behavioral intelligence.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-all font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">filter_list</span> Filter
          </button>
          <button className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-[20px]">add</span> Create Segment
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-gutter">

        {/* ── Segments Table ─────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container/30">
            <h3 className="font-title-lg text-title-lg">High-Performing Segments</h3>
            <span className="text-label-md bg-secondary-container/20 text-secondary px-2 py-1 rounded">
              34 Segments Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-lowest/50">
                  <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Segment Name</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Reach</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Growth</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Device Split</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Fraud Risk</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-xs text-right">Avg CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {SEGMENT_META.map((seg, i) => (
                  <tr key={i} className="hover:bg-surface-container transition-colors group">
                    {/* Segment Name + tags */}
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded ${seg.iconBg} flex items-center justify-center ${seg.iconColor} shrink-0 mt-0.5`}>
                          <span className="material-symbols-outlined">{seg.icon}</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{seg.name}</p>
                          <p className="text-xs text-on-surface-variant mb-1.5">{seg.desc}</p>
                          <div className="flex flex-wrap gap-1">
                            {seg.tags.map((tag) => (
                              <span
                                key={tag}
                                className="bg-surface-container-high text-on-surface-variant text-xs rounded-full px-2 py-0.5 border border-outline-variant/40"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Reach — live */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shrink-0" />
                        <span className="font-label-md font-mono text-sm">
                          {formatReach(seg, reaches[i])}
                        </span>
                      </div>
                    </td>

                    {/* Growth */}
                    <td className="px-6 py-5">
                      <div className={`flex items-center gap-1 ${seg.isUp ? 'text-tertiary' : 'text-error'}`}>
                        <span className="material-symbols-outlined text-sm font-bold">
                          {seg.isUp ? 'trending_up' : 'trending_down'}
                        </span>
                        <span className="font-label-md font-mono">{seg.growth}</span>
                      </div>
                    </td>

                    {/* Device Split */}
                    <td className="px-6 py-5">
                      <div className="min-w-[100px]">
                        <p className="text-xs text-on-surface-variant mb-1.5">
                          <span className="text-secondary font-semibold">{seg.mobile}%</span>
                          <span className="mx-1 opacity-40">/</span>
                          <span className="text-primary font-semibold">{seg.desktop}%</span>
                          <span className="ml-1 opacity-50 text-[10px]">M/D</span>
                        </p>
                        <div className="w-full h-1 rounded-full overflow-hidden flex bg-surface-container-highest">
                          <div
                            className="bg-secondary h-full rounded-l-full"
                            style={{ width: `${seg.mobile}%` }}
                          />
                          <div
                            className="bg-primary h-full rounded-r-full"
                            style={{ width: `${seg.desktop}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Fraud Risk */}
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${fraudBadgeClass(seg.fraudRisk)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${fraudDotClass(seg.fraudRisk)}`} />
                        {seg.fraudRisk}
                      </span>
                    </td>

                    {/* Avg CTR */}
                    <td className="px-6 py-5 text-right font-label-md text-primary font-mono">{seg.ctr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Demographics Column ────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">

          {/* Gender Donut */}
          <div className="glass-card rounded-xl p-6 flex-1">
            <h3 className="font-title-lg text-title-lg mb-6">Gender Distribution</h3>
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#1e1e2e" strokeWidth="3" />
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#c0c1ff" strokeDasharray="55 45" strokeDashoffset="0" strokeWidth="3" />
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#ffb783" strokeDasharray="35 65" strokeDashoffset="-55" strokeWidth="3" />
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#d0bcff" strokeDasharray="10 90" strokeDashoffset="-90" strokeWidth="3" />
              </svg>
              <div className="absolute text-center">
                <span className="font-headline-md text-headline-md block font-black">Live</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter font-mono">Real-time</span>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-sm">Male</span></div>
                <span className="font-label-md font-mono text-xs">55%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-tertiary" /><span className="text-sm">Female</span></div>
                <span className="font-label-md font-mono text-xs">35%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary" /><span className="text-sm">Other</span></div>
                <span className="font-label-md font-mono text-xs">10%</span>
              </div>
            </div>
          </div>

          {/* Age Groups */}
          <div className="glass-card rounded-xl p-6 flex-1">
            <h3 className="font-title-lg text-title-lg mb-6">Age Groups</h3>
            <div className="space-y-4">
              {[
                { range: '18-24', pct: 28 },
                { range: '25-34', pct: 42 },
                { range: '35-44', pct: 18 },
                { range: '45+', pct: 12 },
              ].map((age) => (
                <div key={age.range}>
                  <div className="flex justify-between text-xs mb-1 font-label-md">
                    <span>{age.range}</span>
                    <span className="font-mono">{age.pct}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${age.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Breakdown Donut */}
          <div className="glass-card rounded-xl p-6 flex-1">
            <h3 className="font-title-lg text-title-lg mb-6">Device Breakdown</h3>
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* track */}
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#1e1e2e" strokeWidth="3" />
                {/* Mobile 48% */}
                <circle cx="18" cy="18" fill="transparent" r="15.915"
                  stroke="#ffb783"
                  strokeDasharray="48 52"
                  strokeDashoffset="0"
                  strokeWidth="3"
                />
                {/* Desktop 38% — offset by -48 */}
                <circle cx="18" cy="18" fill="transparent" r="15.915"
                  stroke="#c0c1ff"
                  strokeDasharray="38 62"
                  strokeDashoffset="-48"
                  strokeWidth="3"
                />
                {/* Tablet 14% — offset by -(48+38) = -86 */}
                <circle cx="18" cy="18" fill="transparent" r="15.915"
                  stroke="#d0bcff"
                  strokeDasharray="14 86"
                  strokeDashoffset="-86"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute text-center">
                <span className="font-headline-md text-headline-md block font-black">48%</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter font-mono">Mobile</span>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary" /><span className="text-sm">Mobile</span></div>
                <span className="font-label-md font-mono text-xs">48%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-sm">Desktop</span></div>
                <span className="font-label-md font-mono text-xs">38%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-tertiary" /><span className="text-sm">Tablet</span></div>
                <span className="font-label-md font-mono text-xs">14%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          AI-DRIVEN SEGMENT INSIGHTS (SHAP)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="col-span-12 glass-card rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center gap-3 bg-surface-container/30">
          <span className="material-symbols-outlined text-primary">auto_awesome</span>
          <h3 className="font-title-lg text-title-lg">AI-Driven Segment Insights</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
            Powered by SHAP
          </span>
        </div>

        {/* SHAP Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {SHAP_DATA.map((card) => (
            <div
              key={card.segment}
              className="bg-surface-container-high/40 border border-outline-variant/30 rounded-xl p-5 flex flex-col gap-4"
            >
              {/* Card title */}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">insights</span>
                <p className="font-bold text-on-surface text-sm">{card.segment}</p>
              </div>

              {/* SHAP feature bars */}
              <div className="space-y-3">
                {card.features.map((f) => (
                  <div key={f.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-on-surface-variant font-mono truncate pr-2">{f.label}</span>
                      <span className="text-[11px] font-bold text-primary font-mono shrink-0">{f.value}</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: f.barW }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation note */}
              <p className="text-xs text-on-surface-variant italic border-t border-outline-variant/20 pt-3">
                Recommended because of{' '}
                <span className="text-primary not-italic font-semibold">{card.topFeature}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
