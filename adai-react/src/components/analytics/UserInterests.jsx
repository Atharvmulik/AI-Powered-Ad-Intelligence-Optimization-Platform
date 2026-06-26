// src/components/analytics/UserInterests.jsx
// Row 3 (3/12 cols) — User interest category breakdown bars.
// Fully static/presentational.

const INTERESTS = [
  { label: 'FinTech & Crypto',  val: '88%', color: 'bg-primary',  w: '88%', shadow: 'shadow-[0_0_8px_rgba(192,193,255,0.4)]' },
  { label: 'SaaS & Cloud',      val: '72%', color: 'bg-secondary', w: '72%' },
  { label: 'AI Research',       val: '64%', color: 'bg-tertiary',  w: '64%' },
  { label: 'Digital Nomadism',  val: '45%', color: 'bg-outline',   w: '45%' },
]

export default function UserInterests() {
  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-surface-container-low border border-outline-variant rounded-xl p-6">
      <h3 className="text-on-surface font-bold mb-6 text-title-lg">User Interests</h3>

      <div className="space-y-5">
        {INTERESTS.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-xs mb-1">
              <span>{item.label}</span>
              <span className="font-mono">{item.val}</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full">
              <div className={`${item.color} h-full rounded-full ${item.shadow || ''}`} style={{ width: item.w }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}