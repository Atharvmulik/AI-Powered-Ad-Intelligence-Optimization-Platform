// src/components/analytics/ScheduleExportModal.jsx
// Modal for scheduling weekly analytics exports via email.
// Props: isOpen, onClose, email, onEmailChange, day, onDayChange, format, onFormatChange

import { useRef, useEffect, useState } from 'react';
import { scheduleAnalyticsExport } from '@/services/analyticsService';

export default function ScheduleExportModal({
  isOpen,
  onClose,
  email,
  onEmailChange,
  day,
  onDayChange,
  format,
  onFormatChange,
}) {
  const modalRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await scheduleAnalyticsExport({ email, day, format });
      onClose();
    } catch {
      setSubmitError('Failed to schedule export. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div ref={modalRef} className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-md w-full mx-4 p-6 animate-scale-in">
        <h2 className="text-xl font-bold text-on-surface mb-4">Schedule Weekly Export</h2>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-sm text-on-surface-variant mb-1 block">Send to email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="analyst@company.com"
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Day of week */}
          <div>
            <label className="text-sm text-on-surface-variant mb-1 block">Day of week</label>
            <select
              value={day}
              onChange={(e) => onDayChange(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="Monday">Monday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Friday">Friday</option>
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="text-sm text-on-surface-variant mb-2 block">Format</label>
            <div className="flex gap-4">
              {['CSV', 'PDF'].map((f) => (
                <label key={f} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={format === f}
                    onChange={() => onFormatChange(f)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm">{f}</span>
                </label>
              ))}
            </div>
          </div>

          {submitError && (
            <p className="text-xs text-error">{submitError}</p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-primary text-on-primary rounded-lg px-4 py-2 font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Scheduling...' : 'Activate Schedule'}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 font-medium hover:bg-surface-bright transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}