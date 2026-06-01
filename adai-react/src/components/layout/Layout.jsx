import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const pageTitles = {
  '/': 'AdAI Intelligence',
  '/ad-management': 'Ad Management',
  '/campaigns': 'Campaigns & Reports',
  '/analytics': 'Analytics Overview',
  '/ai-insights': 'AI Insights',
  '/audience': 'Audience',
  '/system-health': 'System Health',
  '/real-time-events': 'Real-Time Events',
}

const searchPlaceholders = {
  '/': 'Search insights...',
  '/ad-management': 'Search intelligent ads...',
  '/campaigns': 'Search analytics, campaigns, reports...',
  '/analytics': 'Search analytics...',
  '/ai-insights': 'Search predictions or models...',
  '/audience': 'Search audience clusters...',
  '/system-health': 'Search system metrics...',
  '/real-time-events': 'Search event logs, IPs, or campaign IDs...',
}

export default function Layout() {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] || 'AdAI Intelligence'
  const placeholder = searchPlaceholders[pathname] || 'Search...'

  return (
    <div className="bg-surface-container-lowest text-on-surface min-h-screen">
      <Sidebar />
      <TopBar title={title} searchPlaceholder={placeholder} />
      <main className="ml-60 pt-24 p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
