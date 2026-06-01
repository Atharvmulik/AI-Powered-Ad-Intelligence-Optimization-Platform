import { NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/', icon: 'dashboard', label: 'Dashboard', exact: true },
  { to: '/ad-management', icon: 'ads_click', label: 'Ad Management' },
  { to: '/campaigns', icon: 'campaign', label: 'Campaigns' },
  { to: '/analytics', icon: 'analytics', label: 'Analytics' },
  { to: '/ai-insights', icon: 'psychology', label: 'AI Insights' },
  { to: '/audience', icon: 'groups', label: 'Audience' },
  { to: '/system-health', icon: 'health_and_safety', label: 'System Health' },
  { to: '/real-time-events', icon: 'sensors', label: 'Real-Time Events' },
]

const bottomItems = [
  { to: '/settings', icon: 'settings', label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside className="h-screen w-60 fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant flex flex-col py-stack-lg z-50">
      {/* Logo */}
      <div className="px-6 mb-8">
        <h1 className="font-display-lg text-display-lg font-bold text-on-surface leading-none">AdAI</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Intelligence Hub</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-high'
                  : 'text-on-surface-variant font-medium hover:bg-surface-container-high'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-body-md text-body-md">{item.label}</span>
          </NavLink>
        ))}

        {/* Divider + bottom items */}
        <div className="pt-6 mt-6 border-t border-outline-variant space-y-1">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                  isActive
                    ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-high'
                    : 'text-on-surface-variant font-medium hover:bg-surface-container-high'
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-body-md text-body-md">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Upgrade button */}
      <div className="px-4 mt-auto pt-6">
        <button className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
          Upgrade Plan
        </button>
      </div>
    </aside>
  )
}
