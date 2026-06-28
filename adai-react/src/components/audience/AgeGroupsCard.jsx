export default function AgeGroupsCard() {
  return (
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
  )
}