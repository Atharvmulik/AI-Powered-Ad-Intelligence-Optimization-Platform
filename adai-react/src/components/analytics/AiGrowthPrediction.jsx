// src/components/analytics/AiGrowthPrediction.jsx
// Row 3 (4/12 cols) — AI Growth Prediction: accuracy donut + recommendation.

import { useAnalytics } from '@/hooks/useAnalytics';

const CIRCUMFERENCE = 2 * Math.PI * 40; // 251.33

export default function AiGrowthPrediction() {
  const { aiGrowthPrediction, loading, error } = useAnalytics();

  const {
    prediction_accuracy,
    recommendation_score,
    fraud_probability,
    click_probability,
    growth_forecast,
    confidence,
    model_version,
  } = aiGrowthPrediction;

  const strokeDashoffset = loading
    ? CIRCUMFERENCE
    : CIRCUMFERENCE - (prediction_accuracy / 100) * CIRCUMFERENCE;

  const recommendationText = loading
    ? 'Loading recommendation...'
    : error
    ? 'Unable to load recommendation.'
    : `Increase budget by ${growth_forecast.toFixed(1)}% for high-performing audience segments. ` +
      `Click probability: ${(click_probability * 100).toFixed(0)}%, ` +
      `Fraud risk: ${(fraud_probability * 100).toFixed(0)}%, ` +
      `Recommendation score: ${(recommendation_score * 100).toFixed(0)}%. ` +
      `Model confidence: ${confidence.toFixed(1)}%.`;

  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-primary">psychology</span>
        <h3 className="text-on-surface font-bold text-title-lg">AI Growth Prediction</h3>
      </div>

      {/* Accuracy donut */}
      <div className="flex items-center justify-center gap-12 py-4">
        <div className="text-center relative">
          <svg className="w-24 h-24 -rotate-90">
            <circle cx="48" cy="48" fill="none" r="40" stroke="#34343c" strokeWidth="8" />
            <circle
              cx="48"
              cy="48"
              fill="none"
              r="40"
              stroke="#c0c1ff"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeWidth="8"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black">
              {loading ? '--' : `${prediction_accuracy.toFixed(0)}%`}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-on-surface-variant font-mono">Accuracy</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="space-y-4">
        <div className="p-3 bg-surface-container-lowest rounded-lg border border-primary/20">
          <p className="text-xs text-primary font-bold">
            Recommendation{model_version ? ` · ${model_version}` : ''}
          </p>
          <p className="text-sm mt-1">{recommendationText}</p>
        </div>
      </div>
    </div>
  );
}