// src/components/analytics/AdTooltip.jsx
// Hover tooltip wrapper used in the Top Performing Ads panel.
// Props: children, content (string), show (boolean)

export default function AdTooltip({ children, content, show }) {
  if (!show) return children
  return (
    <div className="relative">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xl text-xs whitespace-nowrap z-50 animate-fade-in">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-surface-container-lowest" />
      </div>
    </div>
  )
}