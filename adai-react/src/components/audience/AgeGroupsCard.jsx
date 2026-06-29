export default function AgeGroupsCard({ ageGroups }) {
  const groups = ageGroups ?? []

  return (
    <div className="glass-card rounded-xl p-6 flex-1">
      <h3 className="font-title-lg text-title-lg mb-6">Age Groups</h3>
      <div className="space-y-4">
        {groups.map((age) => (
          <div key={age.label}>
            <div className="flex justify-between text-xs mb-1 font-label-md">
              <span>{age.label}</span>
              <span className="font-mono">{age.percentage}%</span>
            </div>
            <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: `${age.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}