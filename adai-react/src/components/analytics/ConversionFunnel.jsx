// src/components/analytics/ConversionFunnel.jsx
// Row 3 (5/12 cols) — Conversion funnel: Impressions → Clicks → Conversions → Revenue Events.

import { useAnalytics } from '@/hooks/useAnalytics';

export default function ConversionFunnel() {
  const { conversionFunnel, loading, error } = useAnalytics();

  const {
    impressions,
    clicks,
    conversions,
    revenue_events,
    click_rate,
    conversion_rate,
    revenue_rate,
    impression_drop,
    click_drop,
    conversion_drop,
  } = conversionFunnel;

  const clicksWidth      = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const conversionsWidth = impressions > 0 ? (conversions / impressions) * 100 : 0;
  const revenueWidth     = impressions > 0 ? (revenue_events / impressions) * 100 : 0;

  const rows = [
    {
      label:     'Impressions',
      value:     impressions,
      rate:      null,
      dropLabel: impression_drop,
      barWidth:  '100%',
      opacity:   'bg-primary/30',
    },
    {
      label:     'Clicks',
      value:     clicks,
      rate:      `${click_rate}% of impressions`,
      dropLabel: click_drop,
      barWidth:  `${clicksWidth}%`,
      opacity:   'bg-primary/40',
    },
    {
      label:     'Conversions',
      value:     conversions,
      rate:      `${conversion_rate}% of clicks`,
      dropLabel: conversion_drop,
      barWidth:  `${conversionsWidth}%`,
      opacity:   'bg-primary/50',
    },
    {
      label:     'Revenue Events',
      value:     revenue_events,
      rate:      `${revenue_rate}% of conversions`,
      dropLabel: null,
      barWidth:  `${revenueWidth}%`,
      opacity:   'bg-primary/60',
    },
  ];

  return (
    <div className="col-span-12 lg:col-span-5 bg-surface-container-low border border-outline-variant rounded-xl p-6">
      <h3 className="text-on-surface font-bold text-title-lg mb-2">Conversion Funnel</h3>
      <p className="text-xs text-on-surface-variant mb-6">User journey from impressions to revenue events</p>

      {loading && (
        <p className="text-xs text-on-surface-variant text-center py-8">Loading funnel data...</p>
      )}
      {!loading && error && (
        <p className="text-xs text-error text-center py-8">{error}</p>
      )}
      {!loading && !error && (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-center gap-4">
                <div className="w-32 text-right">
                  <span className="text-sm font-bold text-on-surface">{row.label}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-black text-primary">
                      {row.value.toLocaleString('en-IN')}
                    </span>
                    {row.rate && (
                      <span className="text-[10px] text-emerald-400">{row.rate}</span>
                    )}
                  </div>
                  <div className="w-full bg-surface-container-high h-8 rounded-lg overflow-hidden">
                    <div className={`${row.opacity} h-full rounded-lg`} style={{ width: row.barWidth }} />
                  </div>
                </div>
              </div>
              {row.dropLabel !== null && (
                <p className="text-[10px] text-red-400 text-right -mt-2">↓ {row.dropLabel}% drop</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}