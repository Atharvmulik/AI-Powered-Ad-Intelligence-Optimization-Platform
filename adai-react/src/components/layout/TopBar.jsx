export default function TopBar({ title = 'AdAI Intelligence', searchPlaceholder = 'Search insights...' }) {
  return (
    <header className="flex justify-between items-center w-[calc(100%-15rem)] px-container-margin-desktop h-16 ml-60 fixed top-0 bg-surface-container border-b border-outline-variant shadow-sm z-40">
      <div className="flex items-center gap-6 flex-1">
        <h2 className="font-headline-md text-headline-md font-black text-on-surface shrink-0">{title}</h2>
        <div className="max-w-md w-full relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface font-body-md"
            placeholder={searchPlaceholder}
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-bright rounded-full transition-all relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
        </button>
        <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-bright rounded-full transition-all">
          <span className="material-symbols-outlined">warning</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-bright rounded-full transition-all">
          <span className="material-symbols-outlined">dark_mode</span>
        </button>
        <div className="h-8 w-px bg-outline-variant mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-none">Admin</p>
            <p className="text-[10px] text-on-surface-variant">Global Admin</p>
          </div>
          <img
            alt="Admin Profile Avatar"
            className="w-10 h-10 rounded-full border-2 border-primary object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnAyjf820ImIA0qSiOqeXhMPcscXeGgCGIy7--lQH2Tssgpt-E5UKnV5KcX6zDgiYNALEtaJfPEzvxz2wrBWVfhoNPWteicUa-hVvvbx6YLM3pKUWtuRMuZwXUpK_nWtJ1qiwLMJNvNmN2P4G3CPeRBkAhAu1vTEQWenWbj5fGgQCYQTwXOkTteOCVyjZ1T9U1WrNhdH9PzjYKx-fKgTg4sJ9tEfli7JTQdyKk3MSmKrpU3ZDK2TfajME1ePJSvs9W50JmWpsBzGpB"
          />
        </div>
      </div>
    </header>
  )
}
