// ============================================================
// src/components/adManagement/OptimizationFeed.jsx
// ============================================================

export default function OptimizationFeed({ items, onApply }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="bg-primary/10 p-4 border-b border-primary/20 flex items-center space-x-2">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          psychology
        </span>
        <h3 className="font-bold text-primary text-body-md">AI Optimization Feed</h3>
      </div>
      <div className="p-6 space-y-6">
        {items.map((item, index) => (
          <div key={item.id} className={index > 0 ? 'border-t border-outline-variant pt-6 space-y-3' : 'space-y-3'}>
            <div className="flex items-start space-x-3">
              <span className={`material-symbols-outlined ${item.iconColor} mt-1`}>{item.icon}</span>
              <div>
                <p className="text-on-surface font-bold text-body-md">{item.title}</p>
                <p className="text-on-surface-variant text-xs">{item.description}</p>
              </div>
            </div>
            {item.note ? (
              <div className="flex items-center space-x-2 text-[10px] text-on-surface-variant bg-surface-container-lowest p-2 rounded italic">
                <span className="material-symbols-outlined text-[12px]">info</span>
                <span>{item.note}</span>
              </div>
            ) : (
              <button
                className="w-full text-center text-xs py-2 bg-surface-container-high rounded border border-outline-variant text-on-surface hover:bg-surface-bright transition-all"
                onClick={() => onApply && onApply(item.id)}
              >
                {item.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}