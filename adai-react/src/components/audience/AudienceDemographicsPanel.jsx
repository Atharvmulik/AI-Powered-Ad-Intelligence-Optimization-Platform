import GenderDistributionCard from './GenderDistributionCard'
import AgeGroupsCard from './AgeGroupsCard'
import DeviceBreakdownCard from './DeviceBreakdownCard'

export default function AudienceDemographicsPanel() {
  return (
    <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
      <GenderDistributionCard />
      <AgeGroupsCard />
      <DeviceBreakdownCard />
    </div>
  )
}