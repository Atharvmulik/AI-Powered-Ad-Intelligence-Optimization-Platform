export const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', exact: true },
  { to: '/dashboard/ad-management', icon: 'ads_click', label: 'Ad Management' },
  { to: '/dashboard/campaigns', icon: 'campaign', label: 'Campaigns' },
  { to: '/dashboard/analytics', icon: 'analytics', label: 'Analytics' },
  { to: '/dashboard/ai-insights', icon: 'psychology', label: 'AI Insights' },
  { to: '/dashboard/audience', icon: 'groups', label: 'Audience' },
  { to: '/dashboard/system-health', icon: 'health_and_safety', label: 'System Health' },
  { to: '/dashboard/real-time-events', icon: 'sensors', label: 'Real-Time Events' },
]

export const bottomItems = [
  { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
]

export const pageTitles = {
  '/dashboard': 'AdAI Intelligence',
  '/dashboard/ad-management': 'Ad Management',
  '/dashboard/campaigns': 'Campaigns & Reports',
  '/dashboard/analytics': 'Analytics Overview',
  '/dashboard/ai-insights': 'AI Insights',
  '/dashboard/audience': 'Audience',
  '/dashboard/system-health': 'System Health',
  '/dashboard/real-time-events': 'Real-Time Events',
}

export const searchPlaceholders = {
  '/dashboard': 'Search insights...',
  '/dashboard/ad-management': 'Search intelligent ads...',
  '/dashboard/campaigns': 'Search analytics, campaigns, reports...',
  '/dashboard/analytics': 'Search analytics...',
  '/dashboard/ai-insights': 'Search predictions or models...',
  '/dashboard/audience': 'Search audience clusters...',
  '/dashboard/system-health': 'Search system metrics...',
  '/dashboard/real-time-events': 'Search event logs, IPs, or campaign IDs...',
}
