// src/data/aiInsightsData.js
// Static seed data for the AIInsights page.

export const INITIAL_FRAUD_ALERTS = [
  { id: 1, time: '14:30:12', ip: '185.220.101.5', score: 0.97, category: 'Bot',               feature: 'click_velocity: 340/min'  },
  { id: 2, time: '14:30:45', ip: '94.23.102.89',  score: 0.92, category: 'Click Farm',        feature: 'ip_reputation: poor'      },
  { id: 3, time: '14:31:18', ip: '203.190.150.8', score: 0.82, category: 'Suspicious Human',  feature: 'hover_duration: 0.05s'   },
  { id: 4, time: '14:31:55', ip: '45.22.10.87',   score: 0.88, category: 'Bot',               feature: 'user_agent: headless'     },
]

export const FRAUD_ALERT_IP_POOL = [
  '185.120.44.12', '94.23.102.89', '210.45.166.4', '172.56.9.110',
  '195.154.122.9', '43.250.241.15', '203.190.150.8',
]
export const FRAUD_ALERT_CATEGORIES = ['Bot', 'Click Farm', 'Suspicious Human']
export const FRAUD_ALERT_FEATURES   = [
  'click_velocity: 420/min', 'ip_reputation: flagged',
  'headless_browser: true',  'hover_density: extreme',
  'user_agent: outdated',
]

export const ADS_DATA_INITIAL = [
  {
    id: '1', name: 'Nike Running Shoes', category: 'Sports',
    clickProbability: 0.82, fraudRisk: 'LOW',
    shapReason: 'User interest match: +0.48', expanded: false,
    shapFeatures: [
      { name: 'User_History_CTR',     value: 0.42 },
      { name: 'Ad_Category_Match',    value: 0.48 },
      { name: 'Time_of_Day',          value: 0.12 },
      { name: 'Device_Type',          value: 0.08 },
    ],
    confidence: 0.89, segments: ['Active Runners', 'Age 22-35', 'Mobile'],
    filteredClicks: 182, rawClicks: 210,
  },
  {
    id: '2', name: 'Gaming Laptop Pro', category: 'Tech',
    clickProbability: 0.45, fraudRisk: 'MEDIUM',
    shapReason: 'Device type mismatch: -0.22', expanded: false,
    shapFeatures: [
      { name: 'User_History_CTR',     value: 0.15  },
      { name: 'Ad_Category_Match',    value: 0.08  },
      { name: 'Time_of_Day',          value: -0.18 },
      { name: 'Device_Type',          value: -0.22 },
    ],
    confidence: 0.67, segments: ['Gamers', 'Age 18-30', 'Desktop'],
    filteredClicks: 95, rawClicks: 128,
  },
  {
    id: '3', name: 'Protein Supplement', category: 'Health',
    clickProbability: 0.91, fraudRisk: 'LOW',
    shapReason: 'User purchase history: +0.61', expanded: false,
    shapFeatures: [
      { name: 'User_History_CTR',     value: 0.61 },
      { name: 'Ad_Category_Match',    value: 0.32 },
      { name: 'Time_of_Day',          value: 0.14 },
      { name: 'Device_Type',          value: 0.05 },
    ],
    confidence: 0.94, segments: ['Fitness Enthusiasts', 'Age 20-40', 'All Devices'],
    filteredClicks: 341, rawClicks: 365,
  },
  {
    id: '4', name: 'Travel Insurance', category: 'Finance',
    clickProbability: 0.28, fraudRisk: 'HIGH',
    shapReason: 'Previous claim history: -0.35', expanded: false,
    shapFeatures: [
      { name: 'User_History_CTR',     value: -0.12 },
      { name: 'Ad_Category_Match',    value: -0.08 },
      { name: 'Time_of_Day',          value: -0.35 },
      { name: 'Device_Type',          value: -0.05 },
    ],
    confidence: 0.52, segments: ['Travelers', 'Age 35-55', 'Desktop'],
    filteredClicks: 42, rawClicks: 88,
  },
  {
    id: '5', name: 'Mobile Banking App', category: 'Finance',
    clickProbability: 0.73, fraudRisk: 'LOW',
    shapReason: 'Location match: +0.39', expanded: false,
    shapFeatures: [
      { name: 'User_History_CTR',     value: 0.28 },
      { name: 'Ad_Category_Match',    value: 0.39 },
      { name: 'Time_of_Day',          value: 0.21 },
      { name: 'Device_Type',          value: 0.11 },
    ],
    confidence: 0.81, segments: ['Tech-Savvy', 'Age 25-45', 'Mobile'],
    filteredClicks: 267, rawClicks: 298,
  },
]