// ============================================================
// src/lib/aiinsight.ts
//
// Endpoint constants for the AI Insight module. No business logic —
// aiInsightService.ts is the only consumer of these.
// ============================================================

export const AI_INSIGHT_BASE = '/aiinsight'

export const AI_INSIGHT_ENDPOINTS = {
  overview: `${AI_INSIGHT_BASE}/overview`,
  modelStatus: `${AI_INSIGHT_BASE}/model-status`,
  predictions: `${AI_INSIGHT_BASE}/predictions`,
  shap: `${AI_INSIGHT_BASE}/shap`,
  recommendations: `${AI_INSIGHT_BASE}/recommendations`,
  audienceSegments: `${AI_INSIGHT_BASE}/audience-segments`,
  infrastructure: `${AI_INSIGHT_BASE}/infrastructure`,
  campaignInsight: (campaignId: number | string): string => `${AI_INSIGHT_BASE}/campaign/${campaignId}`,
} as const

export const AI_INSIGHT_WS_URL =
  (import.meta as any).env?.VITE_AI_INSIGHT_WS_URL || 'ws://localhost:8000/ws/aiinsight/live'