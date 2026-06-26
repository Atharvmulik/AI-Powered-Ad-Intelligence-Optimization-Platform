// src/components/analytics/Toast.jsx
// Self-dismissing toast notification. Auto-removes after 3 seconds.
// Render all active toasts via <ToastContainer>.

import { useEffect } from 'react'

function Toast({ id, type, message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 3000)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  const icons = {
    success: (
      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-emerald-400 text-sm">check</span>
      </div>
    ),
    error: (
      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-red-400 text-sm">close</span>
      </div>
    ),
    info: (
      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-yellow-400 text-sm">warning</span>
      </div>
    ),
  }

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 flex items-center gap-3 min-w-[280px] shadow-2xl animate-slide-in">
      {icons[type]}
      <p className="text-sm text-on-surface flex-1">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  )
}

// Container — fixed bottom-right, renders all active toasts
export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}