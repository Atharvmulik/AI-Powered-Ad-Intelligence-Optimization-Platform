import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { pageTitles, searchPlaceholders } from '@/constants/navigation'

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
