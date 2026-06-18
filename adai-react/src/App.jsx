import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import LoadingSpinner from './components/common/LoadingSpinner'

// Layout component
import Layout from './components/layout/Layout'

// Lazy-loaded page components for bundle size optimization
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AdManagement = lazy(() => import('./pages/AdManagement'))
const Campaigns = lazy(() => import('./pages/Campaigns'))
const Analytics = lazy(() => import('./pages/Analytics'))
const AIInsights = lazy(() => import('./pages/AIInsights'))
const Audience = lazy(() => import('./pages/Audience'))
const SystemHealth = lazy(() => import('./pages/SystemHealth'))
const RealTimeEvents = lazy(() => import('./pages/RealTimeEvents'))
const NotFound = lazy(() => import('./pages/NotFound'))

// ProtectedRoute guard consuming context state
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected dashboard routes wrapped in Layout */}
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
              {/* Nested dashboard unknown paths redirect back to dashboard main */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Global fallback: NotFound page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  )
}
