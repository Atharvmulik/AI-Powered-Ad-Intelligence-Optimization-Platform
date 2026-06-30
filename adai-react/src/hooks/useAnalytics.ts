// src/hooks/useAnalytics.ts

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import {
    getPlacementPerformance,
    getOverview,
    getAiGrowthPrediction,
    getTerminalLogs,
    getCampaignPerformance,
    getClickDistribution,
    getConversionFunnel,
    getDeviceSplit,
    getEngagement,
    getFraudMonitor,
} from '@/services/analyticsService';
import {
    PlacementPerformanceItem,
    OverviewResponse,
    AiGrowthPredictionResponse,
    TerminalLog,
    CampaignPerformanceItem,
    ClickDistributionChannel,
    ConversionFunnelResponse,
    DeviceItem,
    EngagementResponse,
    FraudMonitorResponse,
    CTRTrendResponse,
} from '@/types/analytics';
import { getCtrTrend } from '@/services/analyticsService';
import { getTopAds, getUserInterests } from '@/services/analyticsService';
import { TopAd, UserInterest } from '@/types/analytics';
interface PlacementPerformanceState {
    placements: PlacementPerformanceItem[];
}

const DEFAULT_OVERVIEW: OverviewResponse = {
    active_users: 0,
    events_per_second: 0,
    avg_bid_latency: 0,
    fraud_rate: 0,
    previous_active_users: 0,
    previous_events_per_second: 0,
    previous_avg_bid_latency: 0,
    previous_fraud_rate: 0,
};

const DEFAULT_CONVERSION_FUNNEL: ConversionFunnelResponse = {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue_events: 0,
    click_rate: 0,
    conversion_rate: 0,
    revenue_rate: 0,
    impression_drop: 0,
    click_drop: 0,
    conversion_drop: 0,
};

const DEFAULT_ENGAGEMENT: EngagementResponse = {
    average_session_duration: 0,
    bounce_rate: 0,
    returning_users: 0,
    engagement_score: 0,
};

const DEFAULT_FRAUD_MONITOR: FraudMonitorResponse = {
    blocked_today: 0,
    flagged: 0,
    clean: 0,
    events: [],
};

const DEFAULT_AI_GROWTH: AiGrowthPredictionResponse = {
    prediction_accuracy: 0,
    recommendation_score: 0,
    fraud_probability: 0,
    click_probability: 0,
    growth_forecast: 0,
    confidence: 0,
    model_version: '',
};

interface UseAnalyticsReturn {
    placementPerformance: PlacementPerformanceState;
    overview: OverviewResponse;
    aiGrowthPrediction: AiGrowthPredictionResponse;
    campaignPerformance: { campaigns: CampaignPerformanceItem[] };
    clickDistribution: { total_clicks: number; channels: ClickDistributionChannel[] };
    conversionFunnel: ConversionFunnelResponse;
    deviceSplit: { devices: DeviceItem[] };
    engagement: EngagementResponse;
    fraudMonitor: FraudMonitorResponse;
    ctrTrend: CTRTrendResponse;
    topAds: TopAd[];
    userInterests: UserInterest[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
    setOverview: Dispatch<SetStateAction<OverviewResponse>>;
    setCampaignPerformance: Dispatch<SetStateAction<{ campaigns: CampaignPerformanceItem[] }>>;
    setClickDistribution: Dispatch<SetStateAction<{ total_clicks: number; channels: ClickDistributionChannel[] }>>;
    setCtrTrend: Dispatch<SetStateAction<CTRTrendResponse>>;
    setTopAds: Dispatch<SetStateAction<TopAd[]>>;
    setUserInterests: Dispatch<SetStateAction<UserInterest[]>>;
}

export function useAnalytics(): UseAnalyticsReturn {
    const [placementPerformance, setPlacementPerformance] = useState<PlacementPerformanceState>({ placements: [] });
    const [overview, setOverview] = useState<OverviewResponse>(DEFAULT_OVERVIEW);
    const [aiGrowthPrediction, setAiGrowthPrediction] = useState<AiGrowthPredictionResponse>(DEFAULT_AI_GROWTH);
    const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnelResponse>(DEFAULT_CONVERSION_FUNNEL);
    const [deviceSplit, setDeviceSplit] = useState<{ devices: DeviceItem[] }>({ devices: [] });
    const [engagement, setEngagement] = useState<EngagementResponse>(DEFAULT_ENGAGEMENT);
    const [fraudMonitor, setFraudMonitor] = useState<FraudMonitorResponse>(DEFAULT_FRAUD_MONITOR);
    const [ctrTrend, setCtrTrend] = useState<CTRTrendResponse>({
        current_ctr: 0,
        target_ctr: 2.5,
        points: [],
    });
    const [topAds, setTopAds] = useState<TopAd[]>([]);
    const [userInterests, setUserInterests] = useState<UserInterest[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
    const [campaignPerformance, setCampaignPerformance] = useState<{ campaigns: CampaignPerformanceItem[] }>({ campaigns: [] });
    const [clickDistribution, setClickDistribution] = useState<{ total_clicks: number; channels: ClickDistributionChannel[] }>({ total_clicks: 0, channels: [] });


    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const results = await Promise.allSettled([
                getPlacementPerformance(),
                getOverview(),
                getAiGrowthPrediction(),
                getTerminalLogs(),
                getCampaignPerformance(),
                getClickDistribution(),
                getConversionFunnel(),
                getDeviceSplit(),
                getEngagement(),
                getFraudMonitor(),
                getCtrTrend(),
                getTopAds(),
                getUserInterests(),
            ]);

            const [
                placementResult,
                overviewResult,
                aiGrowthResult,
                terminalResult,
                campaignResult,
                clickResult,
                funnelResult,
                deviceResult,
                engagementResult,
                fraudResult,
                ctrResult,
                topAdsResult,
                interestsResult,
            ] = results;

            if (placementResult.status === 'fulfilled') {
                setPlacementPerformance(placementResult.value);
            }
            if (overviewResult.status === 'fulfilled') {
                setOverview(overviewResult.value);
            }
            if (aiGrowthResult.status === 'fulfilled') {
                setAiGrowthPrediction(aiGrowthResult.value);
            }
            if (terminalResult.status === 'fulfilled') {
                setTerminalLogs(terminalResult.value.logs);
            }
            if (campaignResult.status === 'fulfilled') {
                setCampaignPerformance(campaignResult.value);
            }
            if (clickResult.status === 'fulfilled') {
                setClickDistribution(clickResult.value);
            }
            if (funnelResult.status === 'fulfilled') {
                setConversionFunnel(funnelResult.value);
            }
            if (deviceResult.status === 'fulfilled') {
                setDeviceSplit(deviceResult.value);
            }
            if (engagementResult.status === 'fulfilled') {
                setEngagement(engagementResult.value);
            }
            if (fraudResult.status === 'fulfilled') {
                setFraudMonitor(fraudResult.value);
            }
            if (ctrResult.status === 'fulfilled') {
                setCtrTrend(ctrResult.value);
            }
            if (topAdsResult.status === 'fulfilled') {
                setTopAds(topAdsResult.value);
            }
            if (interestsResult.status === 'fulfilled') {
                setUserInterests(interestsResult.value.interests);
            }

            if (results.some((result) => result.status === 'rejected')) {
                setError('Failed to load analytics data.');
            }
        } catch {
            setError('Failed to load analytics data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        placementPerformance,
        overview,
        aiGrowthPrediction,
        campaignPerformance,
        clickDistribution,
        conversionFunnel,
        deviceSplit,
        engagement,
        fraudMonitor,
        ctrTrend,
        topAds,
        userInterests,
        loading,
        error,
        refetch: fetchData,
        setOverview,
        setCampaignPerformance,
        setClickDistribution,
        setCtrTrend,
        setTopAds,
        setUserInterests,
    };
}