import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import AdManagement from './pages/AdManagement'
import Analytics from './pages/Analytics'
import AIInsights from './pages/AIInsights'
import Audience from './pages/Audience'
import SystemHealth from './pages/SystemHealth'
import Campaigns from './pages/Campaigns'
import RealTimeEvents from './pages/RealTimeEvents'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="ad-management" element={<AdManagement />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ai-insights" element={<AIInsights />} />
        <Route path="audience" element={<Audience />} />
        <Route path="system-health" element={<SystemHealth />} />
        <Route path="real-time-events" element={<RealTimeEvents />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
