// src/components/analytics/AnalyticsAnimations.jsx
// Injects the keyframe animations needed by the Analytics page.
// Render once at the top of Analytics.jsx.

export default function AnalyticsAnimations() {
  return (
    <style>{`
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      .terminal-cursor {
        display: inline-block;
        width: 8px;
        height: 12px;
        background: #571bc1;
        animation: blink 1.1s step-end infinite;
        vertical-align: middle;
      }
      @keyframes pulse-dot {
        0%,100% { opacity:1; transform: scale(1); }
        50% { opacity:0.5; transform: scale(1.4); }
      }
      .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
      @keyframes ws-pulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.5); }
        50% { box-shadow: 0 0 0 6px rgba(52,211,153,0); }
      }
      .ws-dot { animation: ws-pulse 2s ease infinite; }
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in { animation: fade-in 0.2s ease-out; }
      @keyframes slide-in {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      .animate-slide-in { animation: slide-in 0.3s ease-out; }
      @keyframes scale-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .animate-scale-in { animation: scale-in 0.2s ease-out; }
    `}</style>
  )
}