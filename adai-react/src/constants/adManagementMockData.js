// ============================================================
// src/constants/adManagementMockData.js
// ============================================================

// Allowed audience tags list (used for tag-input validation)
export const allowedAudienceTags = [
  'Gen-Z', 'Millennials', 'Urban Commuters', 'Tech Early Adopters', 'Sports Enthusiasts',
  'Gamers', 'Parents', 'Students', 'Professionals', 'High-Income', 'Budget-Conscious',
  'Mobile Users', 'Desktop Users', 'Night Owls', 'Weekend Shoppers'
]

// Predefined suggestions shown under the Keywords field
export const keywordSuggestions = [
  'performance', 'lifestyle', 'premium', 'sale', 'new arrival', 'trending', 'limited edition'
]

// Active Ad Portfolio table rows
export const campaignPortfolioData = [
  {
    id: 'nike-air-max-pro',
    name: 'Nike Air Max Pro',
    subtitle: 'Q4 Campaign - Lifestyle',
    ctr: '3.42%',
    status: 'Active',
    fraudRisk: 'Low',
    engagement: 82,
    logo: {
      type: 'image',
      alt: 'Nike Logo',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfTxLT3NQZb75pxZPqCgnuhERob8xS36QtPSsTMNMHQbd4Ltv0MDTpdqrJu7YOznHBujGZtnNaBcCllQVHQldIzOp7H-8EQNPfIzgkpmi6aNQvZ-c8tvF2yKmOlIN6XWBQXBh7zARyuuGATU8uSu-0itU2T7mRvMJ7i5AyWB5Qi1pz3NcMafXsJn_r0GiTarm3eo_wiC3NG_HPl7P-NQYgMZZARCPRD-h91_dVZtfhjR0MQuPSRVDGv0Wb_6OkexyYR676sElJpoof',
      wrapperClass: 'bg-white',
    },
  },
  {
    id: 'boat-airdopes-x',
    name: 'Boat Airdopes X',
    subtitle: 'Music Streamers - Top Funnel',
    ctr: '2.18%',
    status: 'Paused',
    fraudRisk: 'Medium',
    engagement: 45,
    logo: {
      type: 'image',
      alt: 'Boat Logo',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD53NyOrVPvPYUXeI03S9w1gNTEkKZFaA7lesMntc7ibjb9sZ6f-Fr4ZUbmo5yE7QMd0n9cmp1AKYbZuZxxZnmAp7rk3zsaeAcv65hbyW0-1Fuw-dRFMTmYYbLGUvg_HYyRzN2tx654XnA2kEUUjrVmJ9MQMYTjpPrdV9_dlzEEEZhxFDua0elPXf6t0ZPQlJAo_B235cMse7-sUU6yG2pM8Gupf7hdvFFNbYubIPp42BIaUfqLABnI2KHB-xRm9Cz1b4SlZa0dfxwl',
      wrapperClass: 'bg-surface-container-high border border-outline-variant',
    },
  },
  {
    id: 'titan-smart-v2',
    name: 'Titan Smart v2',
    subtitle: 'Tech Enthusiasts',
    ctr: '4.12%',
    status: 'Active',
    fraudRisk: 'Low',
    engagement: 91,
    logo: {
      type: 'image',
      alt: 'Watch Logo',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAK-jxmOqz4ttH93wbatxbRv5lM82youScL4TOufBwFJgKBk9856VJGmt3XUBiYvbzZfcOUNU3Xi7MpXsCfmEij26ttp6-k166w8n8TWsFWkWQdOwhGucjkJLXyJDDXO23ZSjOUracAlr10nCLBc8dRzLqoR1Sm9EHJ-Zb-FWGP_z3we-cKHhT_MIPVCQUOXQBvZrLtB0-WupjDrEE2ue-JF8OgxTSQqPfqWi8wUKrD02nj2FStDI1iibs4cgncdclhu9Nw7oGfKS16',
      wrapperClass: 'bg-surface-container-high border border-outline-variant',
    },
  },
  {
    id: 'apple-ipad-promo',
    name: 'Apple iPad Promo',
    subtitle: 'Back to School 2024',
    ctr: '0.89%',
    status: 'Halted',
    fraudRisk: 'Critical',
    engagement: 12,
    logo: {
      type: 'icon',
      icon: 'devices',
      wrapperClass: 'bg-surface-container-high border border-outline-variant text-primary',
    },
  },
  {
    id: 'starbucks-rewards',
    name: 'Starbucks Rewards',
    subtitle: 'Loyalty Program Blast',
    ctr: '2.91%',
    status: 'Active',
    fraudRisk: 'Low',
    engagement: 68,
    logo: {
      type: 'icon',
      icon: 'local_cafe',
      wrapperClass: 'bg-surface-container-high border border-outline-variant text-primary',
    },
  },
]

// AI Optimization Feed cards
export const optimizationFeedItems = [
  {
    id: 'audience-expansion',
    icon: 'groups',
    iconColor: 'text-tertiary',
    title: 'Audience Expansion',
    description: "High affinity detected in 'Solo Travelers' (Europe). Re-targeting recommended.",
    actionLabel: 'Apply Recommendation',
  },
  {
    id: 'device-optimization',
    icon: 'smartphone',
    iconColor: 'text-green-400',
    title: 'Device Optimization',
    description: 'Mobile conversion rate up 12%. Shift 15% budget from Desktop to iOS-specific pools.',
    actionLabel: 'Adjust Allocation',
  },
  {
    id: 'prime-time-burst',
    icon: 'schedule',
    iconColor: 'text-blue-400',
    title: 'Prime Time Burst',
    description: 'Peak engagement expected between 18:00 - 21:00 UTC. Trigger auto-bid increase.',
    note: 'Automation scheduled for next cycle.',
  },
]

// Global Status donut chart segments
export const globalStatusData = [
  { label: 'Running', percent: '64%', dotClass: 'bg-primary', strokeColor: '#571bc1', dashoffset: 62.83 },
  { label: 'Paused', percent: '24%', dotClass: 'bg-secondary-container', strokeColor: '#c0c1ff', dashoffset: 150.79 },
  { label: 'Expired', percent: '12%', dotClass: 'bg-surface-container-highest', strokeColor: '#34343c', dashoffset: 226.18 },
]

// Initial entries shown in the real-time AI analysis log on mount
export const initialTerminalLogs = [
  { time: '14:02:11', type: 'INITIALIZING', msg: 'AdAI-Cluster-7v... Secure handshake successful.', color: 'text-on-surface' },
  { time: '14:02:15', type: 'SCANNING', msg: "creative asset 'Nike_AirMax_Q4.png' for brand compliance...", status: 'PASSED', statusColor: 'text-green-400', color: 'text-on-surface' },
  { time: '14:02:22', type: 'FRAUD_DETECTION:', msg: 'Blocked 142 suspicious IP range requests in Tokyo sector.', color: 'text-on-surface' },
  { time: '14:02:30', type: 'OPTIMIZATION:', msg: "Adjusted bid ceiling for 'Boat Airdopes' in local GMT+1 market.", color: 'text-on-surface' },
]

// Rotating phrases used to simulate new live log entries every 4.5s
export const terminalLogPhrases = [
  { type: 'OPTIMIZATION:', msg: 'Shifted 10% budget towards mobile iOS devices.' },
  { type: 'FRAUD_DETECTION:', msg: 'Blocked suspicious traffic burst from node IP.202.12.x.' },
  { type: 'INGESTION:', msg: 'Synced active bid adjustments to all edge routers.' },
  { type: 'COMPLIANCE:', msg: 'Auto-flagged campaign Titan Smart for CTR anomaly.' },
  { type: 'INTELLIGENCE:', msg: 'Determined high CTR correlation with target "Solo Travelers".' },
]