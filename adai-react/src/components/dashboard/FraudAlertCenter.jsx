// ============================================================
// src/components/dashboard/FraudAlertCenter.jsx
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'

export default function FraudAlertCenter({ fraudAlerts = [] }) {
  return (
    <div className="lg:col-span-6 bg-surface-container border border-outline-variant rounded-xl overflow-hidden flex flex-col h-[320px] relative group">
      {/* Cyberstrike branding border */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-error/40"></div>

      <div className="px-6 py-3 bg-surface-container flex items-center justify-between border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-xl animate-bounce">
            security
          </span>
          <h3 className="font-title-lg text-title-lg text-on-surface">Fraud Alert Center</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-error font-mono font-bold bg-error/10 px-2 py-0.5 rounded border border-error/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span> MITIGATION
            SHIELD ON
          </span>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-2 terminal-scroll bg-[#0b0b10]">
        <AnimatePresence initial={false}>
          {fraudAlerts.map((alert, idx) => (
            <motion.div
              key={alert.ip_address + alert.timestamp + idx}
              initial={{ opacity: 0, x: -30, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 30, height: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-surface-container-low/60 border border-outline-variant/30 hover:border-error/30 p-2.5 rounded-lg flex items-center justify-between gap-4 transition-all hover:bg-surface-container-high/40 group/row"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-error-container/20 text-error'
                      : 'bg-tertiary-container/20 text-[#ffb783]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {alert.severity === 'CRITICAL' ? 'gpp_bad' : 'warning'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold text-on-surface">
                      {alert.ip_address}
                    </span>
                    <span className="text-[9px] font-bold font-mono px-1 bg-error/15 text-error rounded border border-error/10 uppercase tracking-tighter">
                      Score {alert.fraud_score}
                    </span>
                  </div>
                  <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                    {alert.fraud_category} ·{' '}
                    <span className="font-bold text-on-surface">{alert.status}</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1.5">
                <span
                  className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                    alert.status === 'Blocked'
                      ? 'bg-error-container/40 text-error border border-error/20'
                      : alert.status === 'Isolated'
                      ? 'bg-tertiary-container/30 text-tertiary border border-tertiary/20'
                      : 'bg-outline/10 text-on-surface-variant border border-outline/20'
                  }`}
                >
                  {alert.status}
                </span>
                <span className="text-[9px] text-on-surface-variant font-mono block">
                  {alert.timestamp}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}