import GenderDistributionCard from './GenderDistributionCard'
import AgeGroupsCard from './AgeGroupsCard'
import DeviceBreakdownCard from './DeviceBreakdownCard'

export default function AudienceDemographicsPanel({ demographics, loading, error }) {
  if (error) {
    return (
      <div className="col-span-12 lg:col-span-4">
        <p className="text-error text-sm">Failed to load demographics.</p>
      </div>
    )
  }

  return (
    <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
      <GenderDistributionCard gender={loading ? null : demographics?.gender} />
      <AgeGroupsCard ageGroups={loading ? null : demographics?.age_groups} />
      <DeviceBreakdownCard device={loading ? null : demographics?.device} />
    </div>
  )
}