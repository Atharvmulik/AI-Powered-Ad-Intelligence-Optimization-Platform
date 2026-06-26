// src/components/analytics/ComparePeriodModal.jsx
// Modal for comparing two date range periods.
// Props: isOpen, onClose, onCompare, currentRangeDisplay,
//        comparePeriodBPreset, onComparePeriodBChange

import { useRef, useEffect } from 'react'

const DATE_PRESETS = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Quarter']

export default function ComparePeriodModal({
  isOpen,
  onClose,
  onCompare,
  currentRangeDisplay,
  comparePeriodBPreset,
  onComparePeriodBChange,
}) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div ref={modalRef} className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-md w-full mx-4 p-6 animate-scale-in">
        <h2 className="text-xl font-bold text-on-surface mb-4">Compare Periods</h2>

        <div className="space-y-4">
          {/* Period A - read only */}
          <div>
            <label className="text-sm text-on-surface-variant mb-1 block">Period A (Current)</label>
            <div className="bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface">
              {currentRangeDisplay}
            </div>
          </div>

          {/* Period B - selectable */}
          <div>
            <label className="text-sm text-on-surface-variant mb-1 block">Period B</label>
            <div className="relative">
              <div className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface flex justify-between items-center">
                <span>{comparePeriodBPreset}</span>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </div>
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-low border border-outline-variant rounded-xl shadow-xl z-10">
                {DATE_PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => onComparePeriodBChange(preset)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-high transition-colors flex justify-between items-center"
                  >
                    {preset}
                    {comparePeriodBPreset === preset && (
                      <span className="material-symbols-outlined text-primary text-sm">check</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCompare}
            className="flex-1 bg-primary text-on-primary rounded-lg px-4 py-2 font-bold hover:brightness-110 transition-all"
          >
            Compare
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 font-medium hover:bg-surface-bright transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}