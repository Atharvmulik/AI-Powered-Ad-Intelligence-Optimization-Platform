// ============================================================
// src/components/adManagement/NetworkHealthScore.jsx
// ============================================================

export default function NetworkHealthScore({ score, label, gaugeOffset, quote }) {
  return (
    <div className="glass-card rounded-xl p-6 text-center flex flex-col items-center justify-center">
      <h3 className="text-label-md uppercase tracking-widest text-on-surface-variant mb-6">Network Health Score</h3>
      <div className="relative w-48 h-48 flex items-center justify-center mb-4">
        <svg className="w-full h-full -rotate-90">
          <circle cx="96" cy="96" fill="transparent" r="80" stroke="#1e1e2e" strokeWidth="12"></circle>
          <circle
            className="gauge-ring"
            cx="96"
            cy="96"
            fill="transparent"
            r="80"
            stroke="#c0c1ff"
            strokeDasharray="502.65"
            strokeDashoffset={gaugeOffset}
            strokeLinecap="round"
            strokeWidth="12"
          ></circle>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-display-lg text-display-lg text-primary">{score}</span>
          <span className="text-label-md text-on-surface-variant">{label}</span>
        </div>
      </div>
      <p className="text-body-md text-on-surface italic">&quot;{quote}&quot;</p>
    </div>
  )
}
