// ============================================================
// src/services/adManagementService.ts
// ============================================================

import api from '@/lib/api'
import type {
  Campaign,
  CampaignCreatePayload,
  NetworkHealth,
  OptimizationFeedItem,
  ApplyActionResponse,
  GlobalStatus,
} from '@/types/adManagement'

const BASE = '/ad-management'

// ---------------------------------------------------------------------------
// Query params type for getCampaigns
// ---------------------------------------------------------------------------

export interface FetchCampaignsParams {
  limit?: number
  search?: string
  status?: string
  fraud_risk?: string
}

// ---------------------------------------------------------------------------
// Service object — matches dashboardService pattern exactly
// ---------------------------------------------------------------------------

export const adManagementService = {

  getCampaigns: (params: FetchCampaignsParams = {}): Promise<Campaign[]> => {
    const query = new URLSearchParams()
    if (params.limit)      query.set('limit', String(params.limit))
    if (params.search)     query.set('search', params.search)
    if (params.status)     query.set('status', params.status)
    if (params.fraud_risk) query.set('fraud_risk', params.fraud_risk)
    const qs = query.toString()
    return api
      .get(`${BASE}/campaigns${qs ? `?${qs}` : ''}`)
      .then((r) => r.data as Campaign[])
  },

  createCampaign: (payload: CampaignCreatePayload): Promise<Campaign> =>
    api
      .post(`${BASE}/campaigns`, payload)
      .then((r) => r.data as Campaign),

  updateCampaign: (
    campaignId: number,
    payload: Partial<CampaignCreatePayload>
  ): Promise<Campaign> =>
    api
      .patch(`${BASE}/campaigns/${campaignId}`, payload)
      .then((r) => r.data as Campaign),

  getNetworkHealth: async (): Promise<NetworkHealth> => {
  console.log("Calling network-health");

  const response = await api.get(`${BASE}/network-health`);

  console.log("Received network-health", response.data);

  return response.data;
},

  getOptimizationFeed: (): Promise<OptimizationFeedItem[]> =>
    api
      .get(`${BASE}/optimization-feed`)
      .then((r) => r.data as OptimizationFeedItem[]),

  applyRecommendation: (itemId: string): Promise<ApplyActionResponse> =>
    api
      .post(`${BASE}/optimization-feed/${itemId}/apply`)
      .then((r) => r.data as ApplyActionResponse),

  getGlobalStatus: (): Promise<GlobalStatus> =>
    api
      .get(`${BASE}/global-status`)
      .then((r) => r.data as GlobalStatus),
}

// ---------------------------------------------------------------------------
// WebSocket factory
// ---------------------------------------------------------------------------

const WS_BASE: string =
  (import.meta as any).env?.VITE_WS_URL ?? 'ws://localhost:8000'

export function createAnalysisLogSocket(
  onMessage: (data: import('@/types/adManagement').AnalysisLogMessage) => void,
  onError?: (e: Event) => void
): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/ad-management/analysis-log`)

  ws.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data as string)
      onMessage(data)
    } catch (e) {
      console.error('WS parse error:', e)
    }
  }

  ws.onerror = (e: Event) => {
    console.error('Analysis log WS error:', e)
    if (onError) onError(e)
  }

  ws.onclose = () => {
    console.log('Analysis log WS closed')
  }

  return ws
}