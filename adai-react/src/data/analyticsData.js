// src/data/analyticsData.js
// Static mock data and fraud entry generator for Analytics page.

import { rand, randInt } from '@/utils/analyticsHelpers'

// ── Timestamp formatter ───────────────────────────────────────────────────────
const fmt = (d) => d.toLocaleTimeString('en-GB', { hour12: false })

// ── Fraud event generator ─────────────────────────────────────────────────────
const FRAUD_TYPES   = ['Bot Clicks', 'Click Farm', 'Suspicious Human', 'Domain Spoofing', 'IP Rotation', 'Proxy Traffic', 'Invalid Referral']
const FRAUD_IPS     = ['103.21.44.', '192.168.', '45.33.32.', '172.16.4.', '10.0.0.', '185.220.', '91.108.']
const DEVICE_IDS    = ['AND-7x92B', 'IOS-4kR21', 'WEB-9mP44', 'BOT-0xDE4F', 'AND-2sQ88', 'IOS-6jK15', 'EMU-1xA00']

export const genFraudEntry = () => {
  const type = FRAUD_TYPES[randInt(0, FRAUD_TYPES.length - 1)]
  const score =
    type === 'Bot Clicks'       ? parseFloat(rand(0.88, 0.99).toFixed(2))
    : type === 'Click Farm'     ? parseFloat(rand(0.75, 0.90).toFixed(2))
    : type === 'Domain Spoofing'? parseFloat(rand(0.82, 0.95).toFixed(2))
    : type === 'Clean Traffic'  ? parseFloat(rand(0.01, 0.10).toFixed(2))
    : parseFloat(rand(0.45, 0.75).toFixed(2))
  const ip     = FRAUD_IPS[randInt(0, FRAUD_IPS.length - 1)] + randInt(1, 254)
  const device = DEVICE_IDS[randInt(0, DEVICE_IDS.length - 1)]
  const action = score > 0.8 ? 'Blocked' : score > 0.5 ? 'Flagged' : 'Allowed'
  return { ts: fmt(new Date()), ip, device, score, category: type, action, id: Math.random() }
}

// ── Initial fraud seed data ───────────────────────────────────────────────────
export const INITIAL_FRAUD = [
  { ts: '11:28:44', ip: '103.21.44.17',   device: 'BOT-0xDE4F', score: 0.97, category: 'Bot Clicks',        action: 'Blocked', id: 1 },
  { ts: '11:27:11', ip: '45.33.32.89',    device: 'EMU-1xA00',  score: 0.83, category: 'Click Farm',        action: 'Blocked', id: 2 },
  { ts: '11:25:03', ip: '172.16.4.201',   device: 'AND-7x92B',  score: 0.61, category: 'Suspicious Human',  action: 'Flagged', id: 3 },
  { ts: '11:22:57', ip: '192.168.1.45',   device: 'IOS-4kR21',  score: 0.04, category: 'Clean Traffic',     action: 'Allowed', id: 4 },
  { ts: '11:19:30', ip: '185.220.101.4',  device: 'WEB-9mP44',  score: 0.91, category: 'Domain Spoofing',   action: 'Blocked', id: 5 },
]

// ── Campaigns ─────────────────────────────────────────────────────────────────
export const CAMPAIGNS = [
  { name: 'Nike Air Max Summer',  advertiser: 'Nike',        raw: 45821, filtered: 44203, ctr: 4.8, spend: '₹4,20,000', roas: 4.8, status: 'Active'  },
  { name: 'ASUS ROG Laptop Deal', advertiser: 'Asus',        raw: 31440, filtered: 28991, ctr: 3.9, spend: '₹2,80,000', roas: 3.1, status: 'Active'  },
  { name: 'Groww Invest Now',     advertiser: 'Groww',       raw: 18220, filtered: 17104, ctr: 3.2, spend: '₹1,50,000', roas: 2.4, status: 'Paused'  },
  { name: 'MuscleBlaze Whey',     advertiser: 'MuscleBlaze', raw: 12005, filtered: 11888, ctr: 2.8, spend: '₹95,000',   roas: 6.2, status: 'Active'  },
  { name: 'Noise ColorFit Pro',   advertiser: 'Noise',       raw: 8440,  filtered: 6201,  ctr: 2.1, spend: '₹75,000',   roas: 1.8, status: 'At Risk' },
]

// ── Top ads ───────────────────────────────────────────────────────────────────
export const TOP_ADS_INITIAL = [
  { rank: 1, name: 'Nike Air Max Summer',  category: 'Footwear',    ctr: 4.8, revenue: 120000, revenueDisplay: '₹1,20,000', brand: 'Nike',        status: 'Active' },
  { rank: 2, name: 'ASUS ROG Laptop Deal', category: 'Electronics', ctr: 3.9, revenue: 98000,  revenueDisplay: '₹98,000',   brand: 'Asus',        status: 'Active' },
  { rank: 3, name: 'Groww Invest Now',     category: 'FinTech',     ctr: 3.2, revenue: 76000,  revenueDisplay: '₹76,000',   brand: 'Groww',       status: 'Paused' },
  { rank: 4, name: 'MuscleBlaze Whey',     category: 'Nutrition',   ctr: 2.8, revenue: 54000,  revenueDisplay: '₹54,000',   brand: 'MuscleBlaze', status: 'Active' },
  { rank: 5, name: 'Noise ColorFit Pro',   category: 'Wearables',   ctr: 2.1, revenue: 41000,  revenueDisplay: '₹41,000',   brand: 'Noise',       status: 'Active' },
]

export const MAX_CTR_BAR = 4.8

// ── Terminal log seed phrases ─────────────────────────────────────────────────
export const TERMINAL_PHRASES = [
  { type: 'info',    msg: 'Recalculating geo-conversion rates for IN-West sector.' },
  { type: 'sys',     msg: 'Refreshed client-side state cache. Ingestion buffer clean.' },
  { type: 'insight', msg: 'CTR prediction engine reports 94.2% stability on "FinTech & Crypto".' },
  { type: 'alert',   msg: 'High latency detected on node APAC-2. Re-routing traffic.' },
  { type: 'info',    msg: 'Synced reports payload schema to AWS S3 bucket us-east-1.' },
  { type: 'fraud',   msg: 'Bot cluster detected: 47 events from subnet 103.21.x.x flagged and blocked.' },
  { type: 'fraud',   msg: 'Isolation Forest model flagged anomaly — session entropy score: 0.03.' },
  { type: 'fraud',   msg: 'XGBoost fraud classifier: campaign #8921-X shows 2.3% invalid click rate.' },
  { type: 'insight', msg: 'Bid optimization: raising floor price on Tier-1 placements by ₹0.08 CPM.' },
  { type: 'sys',     msg: 'Neural bidder retrained on last 24h auction data. Delta: +1.2% win-rate.' },
]

export const TERMINAL_SEED_LOGS = [
  { time: '14:31:02', msg: 'Initializing AdAI Neural Processor v4.2.1...', type: 'sys' },
  { time: '14:31:05', msg: 'Connecting to global data nodes [IN-WEST, IN-EAST, AS-SOUTH]...', type: 'info' },
  { time: '14:31:09', msg: 'Scanning campaign ID #8921-X for anomalies...', status: 'OK', type: 'info' },
  { time: '14:31:14', msg: 'Processing 14.2k events/second. Memory usage: 4.2GB / 32GB.', type: 'info' },
  { time: '14:31:20', msg: "Detected positive sentiment shift in 'Tech Gadgets' segment (+18.4%).", type: 'insight' },
]

// ── Ad placements ─────────────────────────────────────────────────────────────
export const AD_PLACEMENTS = [
  { name: 'Above the Fold', impressions: 420000, ctr: 4.2, revenue: 184000, isBest: true  },
  { name: 'Mid Article',    impressions: 280000, ctr: 2.8, revenue: 98000,  isBest: false },
  { name: 'Sidebar',        impressions: 190000, ctr: 1.4, revenue: 42000,  isBest: false },
  { name: 'Below Fold',     impressions: 95000,  ctr: 0.7, revenue: 12000,  isBest: false },
  { name: 'Sticky Footer',  impressions: 120000, ctr: 1.1, revenue: 28000,  isBest: false },
]

export const MAX_PLACEMENT_CTR = 4.2