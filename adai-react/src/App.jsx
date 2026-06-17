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
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

// Simple auth check — replace with real JWT/context later
function isAuthenticated() {
  return localStorage.getItem('adai_auth') === 'true'
}

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected dashboard routes — all wrapped in Layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="ad-management" element={<AdManagement />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ai-insights" element={<AIInsights />} />
        <Route path="audience" element={<Audience />} />
        <Route path="system-health" element={<SystemHealth />} />
        <Route path="real-time-events" element={<RealTimeEvents />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
