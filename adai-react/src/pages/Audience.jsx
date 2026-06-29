import useAudience from '../hooks/useAudience'

import AudienceSummaryStats from '../components/audience/AudienceSummaryStats'
import AudienceToolbar from '../components/audience/AudienceToolbar'
import AudienceSegmentsTable from '../components/audience/AudienceSegmentsTable'
import AudienceDemographicsPanel from '../components/audience/AudienceDemographicsPanel'
import AudienceSegmentInsights from '../components/audience/AudienceSegmentInsights'

export default function Audience() {
  const {
    overview,

    segments,
    segmentsTotal,
    segmentsLoading,
    segmentsError,

    demographics,
    demographicsLoading,
    demographicsError,

    insights,
    insightsLoading,
    insightsError,
  } = useAudience()

  return (
    <div className="space-y-stack-lg">

      <AudienceSummaryStats
        activeNow={overview?.live_active_now ?? 0}
      />

      <AudienceToolbar />

      <div className="grid grid-cols-12 gap-gutter">

        <AudienceSegmentsTable
          segments={segments}
          total={segmentsTotal}
          loading={segmentsLoading}
          error={segmentsError}
        />

        <AudienceDemographicsPanel
          demographics={demographics}
          loading={demographicsLoading}
          error={demographicsError}
        />

      </div>

      <AudienceSegmentInsights
        insights={insights}
        loading={insightsLoading}
        error={insightsError}
      />

    </div>
  )
}