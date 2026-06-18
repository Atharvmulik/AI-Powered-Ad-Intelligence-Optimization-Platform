export const INITIAL_EVENTS_HISTORY = [
  14150, 14200, 14180, 14240, 14210, 14290, 14250, 14280, 14270, 14290, 14310, 14280
]

export const INITIAL_FRAUD_ALERTS = [
  { id: 1, ip: '192.168.1.45', score: 0.97, category: 'Automated Clicker', status: 'Blocked', severity: 'CRITICAL', time: 'Just now' },
  { id: 2, ip: '10.24.8.12', score: 0.92, category: 'Bot Farm', status: 'Isolated', severity: 'HIGH', time: '1m ago' },
  { id: 3, ip: '172.16.5.8', score: 0.88, category: 'Click Injection', status: 'Investigating', severity: 'MEDIUM', time: '3m ago' },
  { id: 4, ip: '185.220.101.5', score: 0.95, category: 'Proxy Ingestion', status: 'Blocked', severity: 'CRITICAL', time: '5m ago' },
  { id: 5, ip: '45.22.10.87', score: 0.84, category: 'User-Agent Spoofing', status: 'Investigating', severity: 'MEDIUM', time: '8m ago' }
]

export const INITIAL_CTR_HISTORY = [
  6.4, 6.8, 7.1, 6.9, 7.3, 7.0, 7.5, 7.8, 8.2, 8.0, 7.6, 7.9, 8.4, 8.6, 8.2, 8.8, 9.2, 9.6, 9.1, 8.7, 8.4
]

export const INITIAL_CTR_TIMESTAMPS = [
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00'
]

export const SHAP_DATA = {
  'Nike Air Max Pro': [
    { feature: 'Sports Interest', impact: 31, details: 'High-affinity overlap with historical premium athletics purchasers (+3.1x CTR likelihood).' },
    { feature: 'Mobile Device', impact: 18, details: 'In-app ad layout optimization for iOS/Android high-density screens (+1.8x engagement).' },
    { feature: 'Age 18-25', impact: 15, details: 'Targeting Gen-Z lifestyle segments with tailored high-energy visual creatives (+1.5x interaction).' },
    { feature: 'Mumbai Region', impact: 12, details: 'Strong geographic cluster response in metro hubs during active local events (+1.2x conversions).' },
    { feature: 'Previous Engagement', impact: 9, details: 'Re-targeting cookies from the last 7 days who visited product details page (+0.9x action).' }
  ],
  'Gaming Laptop': [
    { feature: 'Esports Affinity', impact: 28, details: 'User follows major gaming streamers or competitive titles.' },
    { feature: 'Desktop Device', impact: 22, details: 'High-performance screens suitable for high-bitrate video ads.' },
    { feature: 'Age 18-35', impact: 16, details: 'Active purchasing cohort for high-ticket hardware.' },
    { feature: 'Bangalore Region', impact: 14, details: 'Major IT tech hub geographic spike.' },
    { feature: 'High Cart Value History', impact: 10, details: 'User has bought items valued > ₹40,000 in past 90 days.' }
  ],
  'Bass Buds Pro': [
    { feature: 'Music Streaming', impact: 35, details: 'Heavy listener of Spotify, YouTube Music, or Apple Music.' },
    { feature: 'Mobile Device', impact: 20, details: 'On-the-go targeting aligned with earphone usage contexts.' },
    { feature: 'Age 15-28', impact: 18, details: 'High volume trend segment for accessories.' },
    { feature: 'Pune Region', impact: 10, details: 'Vibrant college student population hub.' },
    { feature: 'Social Commerce clicks', impact: 7, details: 'User frequently purchases via Instagram/Meta Audience network.' }
  ]
}

export const INITIAL_TABLE_DATA = [
  { campaign: 'Nike Air Max', icon: 'shopping_bag', ctr: 12.4, clicks: 45200, revenue: 1240000, spend: 310000, roas: 4.0, fraudFiltered: 1245 },
  { campaign: 'Gaming Laptop', icon: 'computer', ctr: 10.1, clicks: 32800, revenue: 980000, spend: 280000, roas: 3.5, fraudFiltered: 840 },
  { campaign: 'Bass Buds Pro', icon: 'headphones', ctr: 9.2, clicks: 28400, revenue: 710000, spend: 220000, roas: 3.2, fraudFiltered: 920 },
]

export const INITIAL_INFRA_STATUS = [
  { name: 'Kafka Ingestion', status: 'Healthy', uptime: 99.98, type: 'core', lastBeat: 0 },
  { name: 'Redis Cache', status: 'Healthy', uptime: 99.99, type: 'core', lastBeat: 0 },
  { name: 'FastAPI Router', status: 'Healthy', uptime: 99.95, type: 'core', lastBeat: 0 },
  { name: 'PostgreSQL DB', status: 'Healthy', uptime: 99.99, type: 'database', lastBeat: 0 },
  { name: 'Recommendation Engine', status: 'Healthy', uptime: 99.97, type: 'ai', lastBeat: 0 },
  { name: 'Fraud Filter Engine', status: 'Healthy', uptime: 99.98, type: 'security', lastBeat: 0 }
]

export const INITIAL_TERMINAL_LOGS = [
  { time: '14:22:15', module: 'SYSTEM', msg: 'AdAI Pipeline Processor initialized v2.4.0', color: 'text-outline' },
  { time: '14:22:20', module: 'REDIS', msg: 'Cache store hot-reloaded: 18,402 active keys mapped', color: 'text-red-400' },
  { time: '14:22:25', module: 'KAFKA', msg: 'Stream consumer group: "adai-events-v2" partitions balanced', color: 'text-primary' },
  { time: '14:22:31', module: 'KAFKA', msg: 'KAFKA Producer sent 2,450 events', color: 'text-primary' },
  { time: '14:22:33', module: 'REDIS', msg: 'Redis cache hit ratio: 94.2%', color: 'text-red-400' },
  { time: '14:22:36', module: 'FRAUD', msg: 'Fraud Engine flagged 24 events from AS-South endpoints', color: 'text-[#ffb783]' },
  { time: '14:22:39', module: 'CTR_AI', msg: 'CTR Prediction generated dynamically for Shard APAC-1', color: 'text-secondary' },
  { time: '14:22:42', module: 'RECO', msg: 'Recommendation Engine served 320 ads (latency 14ms)', color: 'text-green-400' },
  { time: '14:22:45', module: 'SHAP', msg: 'SHAP explanation generated for campaign ID: #NikeAirPro', color: 'text-yellow-200' }
]

export const INITIAL_CITIES_DATA = {
  'Mumbai': { traffic: '94%', fraud: '2.4% (Low)', conversions: '12.8% (High)', color: 'text-green-400', topCampaign: 'Nike Air Max' },
  'Delhi': { traffic: '88%', fraud: '14.2% (High)', conversions: '8.1% (Medium)', color: 'text-[#ffb783]', topCampaign: 'Bass Buds Pro' },
  'Bangalore': { traffic: '91%', fraud: '1.8% (Low)', conversions: '16.4% (Critical)', color: 'text-green-400', topCampaign: 'Gaming Laptop' },
  'Pune': { traffic: '76%', fraud: '3.1% (Low)', conversions: '10.2% (High)', color: 'text-green-400', topCampaign: 'Nike Air Max' },
  'Hyderabad': { traffic: '82%', fraud: '6.5% (Medium)', conversions: '11.5% (High)', color: 'text-green-400', topCampaign: 'Gaming Laptop' },
  'Chennai': { traffic: '78%', fraud: '2.2% (Low)', conversions: '9.0% (Medium)', color: 'text-[#ffb783]', topCampaign: 'Bass Buds Pro' }
}

export const EXECUTIVE_SUMMARY = {
  insightText: "Platform recommendation: Ad budget allocation shift from Delhi towards Bangalore & Mumbai is currently yielding an exceptional +3.2x local ROAS boost.",
  insightsList: [
    { text: "CTR increased 12.4% over previous period.", trend: "+12.4%", status: "up" },
    { text: "Fraud traffic reduced by 18% globally.", trend: "-18.0%", status: "down" },
    { text: "Recommendation Engine generated ₹4.2L additional revenue.", trend: "+₹4.2L", status: "up" },
    { text: "Top audience segment: Urban Mobile Users (18-25)", trend: "64.5%", status: "neutral" },
    { text: "System operating at 99.98% pipeline health.", trend: "99.98%", status: "up" }
  ]
}

// Data pools for real-time simulations
export const IP_POOL = [
  '185.120.44.12', '94.23.102.89', '210.45.166.4', '172.56.9.110', 
  '195.154.122.9', '43.250.241.15', '203.190.150.8'
]

export const FRAUD_CATEGORY_POOL = [
  { cat: 'Bot Farm Ingestion', status: 'Isolated', severity: 'HIGH' },
  { cat: 'Click Injection Spill', status: 'Blocked', severity: 'CRITICAL' },
  { cat: 'Automated Clicker', status: 'Blocked', severity: 'CRITICAL' },
  { cat: 'Residential Proxy Abuse', status: 'Investigating', severity: 'MEDIUM' },
  { cat: 'User-Agent Hijack', status: 'Isolated', severity: 'HIGH' }
]

export const TERMINAL_LOG_POOL = [
  { module: 'KAFKA', msg: 'KAFKA Producer sent 2,450 events to partition #4', color: 'text-primary' },
  { module: 'REDIS', msg: 'Redis cache hit ratio: 94.2% (14,482 lookups)', color: 'text-red-400' },
  { module: 'FRAUD', msg: 'Fraud Engine flagged 24 events from proxy IPs', color: 'text-[#ffb783]' },
  { module: 'CTR_AI', msg: 'CTR Prediction generated and pushed to routing broker', color: 'text-secondary' },
  { module: 'RECO', msg: 'Recommendation Engine served 320 ads to Meta Audience partner', color: 'text-green-400' },
  { module: 'SHAP', msg: 'SHAP explanation generated for campaign ID: #NikeAirPro', color: 'text-yellow-200' },
  { module: 'KAFKA', msg: 'Topic "adai-impressions" throughput: 4.8MB/sec', color: 'text-primary' },
  { module: 'SYSTEM', msg: 'Neural inference model compiled successfully in 12ms', color: 'text-outline' },
  { module: 'FRAUD', msg: 'Ip block list synchronized with CloudStrike security agent', color: 'text-[#ffb783]' }
]
