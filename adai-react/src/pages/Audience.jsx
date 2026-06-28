import useAudience from '../hooks/useAudience'
import AudienceSummaryStats from '../components/audience/AudienceSummaryStats'
import AudienceToolbar from '../components/audience/AudienceToolbar'
import AudienceSegmentsTable from '../components/audience/AudienceSegmentsTable'
import AudienceDemographicsPanel from '../components/audience/AudienceDemographicsPanel'
import AudienceSegmentInsights from '../components/audience/AudienceSegmentInsights'

export default function Audience() {
  const { reaches, activeNow } = useAudience()

  return (
    <div className="space-y-stack-lg">

      {/* ══════════════════════════════════════════════════════════════════
          SUMMARY STATS BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <AudienceSummaryStats activeNow={activeNow} />

      {/* ══════════════════════════════════════════════════════════════════
          TOOLBAR
      ═══════════════════════════════════════════════════════════════════ */}
      <AudienceToolbar />

      {/* ══════════════════════════════════════════════════════════════════
          MAIN GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-gutter">
        <AudienceSegmentsTable reaches={reaches} />
        <AudienceDemographicsPanel />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          AI-DRIVEN SEGMENT INSIGHTS (SHAP)
      ═══════════════════════════════════════════════════════════════════ */}
      <AudienceSegmentInsights />

    </div>
  )
}