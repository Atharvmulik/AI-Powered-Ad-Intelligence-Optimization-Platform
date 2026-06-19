import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      {/* Background grid + orbs */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/10 blur-[80px] top-[20%] left-[20%] pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-secondary/5 blur-[80px] bottom-[20%] right-[20%] pointer-events-none" />

      <div className="relative z-10 max-w-md bg-[#0d1117] border border-outline-variant/30 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6">
        <span className="material-symbols-outlined text-primary text-6xl animate-bounce">question_mark</span>
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-mono">404</h1>
          <h2 className="text-lg font-bold text-on-surface mt-2">Page Not Found</h2>
          <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
            The page you are looking for doesn't exist or has been moved to another quadrant of the ad intelligence platform.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}
