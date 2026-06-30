// src/services/analyticsService.ts

import  api  from '@/lib/api';
import {
  PlacementPerformanceResponse,
  OverviewResponse,
  AiGrowthPredictionResponse,
  AnalyticsTerminalResponse,
} from '@/types/analytics';
import { CampaignPerformanceResponse, ClickDistributionResponse } from '@/types/analytics';
import { ConversionFunnelResponse } from '@/types/analytics';
import { DeviceSplitResponse, EngagementResponse, FraudMonitorResponse } from '@/types/analytics';
import { CTRTrendResponse, ScheduleExportRequest } from '@/types/analytics';
import { TopAd, UserInterestResponse } from '@/types/analytics';

export async function getPlacementPerformance(): Promise<PlacementPerformanceResponse> {
  const response = await api.get<PlacementPerformanceResponse>('/analytics/placement-performance');
  return response.data;
}

export async function getOverview(): Promise<OverviewResponse> {
  const response = await api.get<OverviewResponse>('/analytics/overview');
  return response.data;
}

export async function getAiGrowthPrediction(): Promise<AiGrowthPredictionResponse> {
  const response = await api.get<AiGrowthPredictionResponse>('/analytics/ai-growth');
  return response.data;
}

export async function getTerminalLogs(): Promise<AnalyticsTerminalResponse> {
  const response = await api.get<AnalyticsTerminalResponse>('/analytics/system-terminal');
  return response.data;
}
export async function getCampaignPerformance(): Promise<CampaignPerformanceResponse> {
  const response = await api.get<CampaignPerformanceResponse>('/analytics/campaign-performance');
  return response.data;
}

export async function getClickDistribution(): Promise<ClickDistributionResponse> {
  const response = await api.get<ClickDistributionResponse>('/analytics/click-distribution');
  return response.data;
}

export async function getConversionFunnel(): Promise<ConversionFunnelResponse> {
  const response = await api.get<ConversionFunnelResponse>('/analytics/conversion-funnel');
  return response.data;
}

export async function exportCSV(): Promise<void> {
  await api.get('/analytics/export/csv', { responseType: 'blob' }).then((res) => {
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  });
}

export async function exportPDF(): Promise<void> {
  await api.get('/analytics/export/pdf', { responseType: 'blob' }).then((res) => {
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics_export.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  });
}

export async function exportExcel(): Promise<void> {
  await api.get('/analytics/export/excel', { responseType: 'blob' }).then((res) => {
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics_export.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  });
}

export async function scheduleExport(): Promise<void> {
  await api.post('/analytics/export/schedule');
}

export async function getDeviceSplit(): Promise<DeviceSplitResponse> {
  const response = await api.get<DeviceSplitResponse>('/analytics/device-split');
  return response.data;
}

export async function getEngagement(): Promise<EngagementResponse> {
  const response = await api.get<EngagementResponse>('/analytics/engagement');
  return response.data;
}

export async function getFraudMonitor(): Promise<FraudMonitorResponse> {
  const response = await api.get<FraudMonitorResponse>('/analytics/fraud-monitor');
  return response.data;
}

export async function getCtrTrend(): Promise<CTRTrendResponse> {
  const response = await api.get<CTRTrendResponse>('/analytics/ctr-trend');
  return response.data;
}

export async function scheduleAnalyticsExport(payload: ScheduleExportRequest): Promise<void> {
  await api.post('/analytics/export/schedule', payload);
}

export async function getTopAds(): Promise<TopAd[]> {
  const response = await api.get<TopAd[]>('/analytics/top-ads');
  return response.data;
}

export async function getUserInterests(): Promise<UserInterestResponse> {
  const response = await api.get<UserInterestResponse>('/analytics/interest-distribution');
  return response.data;
}