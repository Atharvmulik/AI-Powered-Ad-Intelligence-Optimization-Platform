// src/components/campaigns/ComplianceReports.jsx

const REPORT_TYPE_CONFIG = {
  performance: {
    icon: 'picture_as_pdf',
    iconHoverColor: 'group-hover:border-primary',
    iconTextHover: 'group-hover:text-primary',
    badge: { label: 'New', classes: 'bg-green-500/10 text-green-500' },
  },
  fraud: {
    icon: 'gpp_bad',
    iconHoverColor: 'group-hover:border-error',
    iconTextHover: 'group-hover:text-error',
    badge: { label: 'Critical', classes: 'bg-tertiary/10 text-tertiary' },
  },
  ml_model: {
    icon: 'model_training',
    iconHoverColor: 'group-hover:border-info',
    iconTextHover: 'group-hover:text-info',
    badge: { label: 'Auto-Generated', classes: 'bg-info/10 text-info' },
  },
}

const DEFAULT_REPORT_CONFIG = {
  icon: 'description',
  iconHoverColor: 'group-hover:border-primary',
  iconTextHover: 'group-hover:text-primary',
  badge: { label: 'Report', classes: 'bg-surface-dim text-on-surface-variant' },
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function ReportCard({ report }) {
  const config = REPORT_TYPE_CONFIG[report.report_type?.toLowerCase()] ?? DEFAULT_REPORT_CONFIG

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-all">
      <div className="p-6 flex flex-row gap-6">
        <div className={`w-24 h-32 bg-surface-dim rounded border border-outline-variant flex items-center justify-center ${config.iconHoverColor} transition-colors shrink-0`}>
          <span className={`material-symbols-outlined text-4xl text-on-surface-variant ${config.iconTextHover}`}>
            {config.icon}
          </span>
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="font-title-lg text-title-lg mb-1">{report.title}</h3>
            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-widest ${config.badge.classes}`}>
              {config.badge.label}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mb-4 capitalize">{report.report_type?.replace(/_/g, ' ')}</p>
          <div className="flex items-center gap-4 text-[10px] font-label-md text-on-surface-variant flex-wrap">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">calendar_today</span>
              {formatDate(report.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">description</span>
              {report.pages} Pages
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">database</span>
              {report.size_mb} MB
            </span>
          </div>
        </div>
      </div>
      <div className="p-4 bg-surface-container border-t border-outline-variant flex justify-between items-center mt-auto">
        <button className="flex items-center gap-2 text-primary text-xs font-bold hover:underline">
          <span className="material-symbols-outlined text-sm">visibility</span>
          Quick Preview
        </button>
        <a
          href={report.file_path || '#'}
          className="flex items-center gap-2 bg-primary text-on-primary text-xs px-6 py-2 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all"
          download
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Download PDF
        </a>
      </div>
    </div>
  )
}

function ScheduledReportRow({ report }) {
  const countdown = (() => {
    try {
      const diff = new Date(report.next_run).getTime() - Date.now()
      if (diff <= 0) return 'due now'
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      if (h >= 24) return `in ${Math.floor(h / 24)}d ${h % 24}h`
      return `in ${h}h ${m}m`
    } catch {
      return report.next_run
    }
  })()

  return (
    <div className="p-4 flex justify-between items-center">
      <div>
        <p className="font-body-md font-semibold text-on-surface">{report.name}</p>
        <p className="text-xs text-on-surface-variant capitalize">{report.frequency}</p>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-xs font-mono text-tertiary">{countdown}</p>
        <div className={`w-10 h-5 rounded-full relative cursor-pointer ${report.enabled ? 'bg-primary' : 'bg-surface-dim'}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${report.enabled ? 'right-0.5 bg-on-primary' : 'left-0.5 bg-primary'}`} />
        </div>
      </div>
    </div>
  )
}

export default function ComplianceReports({ reports, scheduledReports }) {
  const list = reports ?? []
  const schedules = scheduledReports ?? []

  return (
    <section>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Compliance &amp; Performance Reports
          </h2>
          <p className="font-body-md text-on-surface-variant">
            Downloadable PDF summaries generated by AI
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-body-md hover:bg-surface-bright transition-colors">
            Scheduled Reports
          </button>
        </div>
      </div>

      {list.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-6">
          {list.map((report) => (
            <ReportCard key={report.report_id} report={report} />
          ))}
        </div>
      ) : (
        <p className="text-on-surface-variant font-body-md mb-6">No reports available.</p>
      )}

      {/* Scheduled Reports */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant">
          <h4 className="font-title-md text-title-md flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
            Scheduled Reports
          </h4>
        </div>
        <div className="divide-y divide-outline-variant">
          {schedules.length === 0 ? (
            <p className="p-4 text-on-surface-variant font-body-md">No scheduled reports.</p>
          ) : (
            schedules.map((report) => (
              <ScheduledReportRow key={report.schedule_id} report={report} />
            ))
          )}
        </div>
      </div>
    </section>
  )
}