export default function LoadingSpinner() {
  return (
    <div className="min-h-[400px] w-full flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <p className="text-xs text-on-surface-variant font-mono tracking-widest uppercase animate-pulse">Loading AdAI Intelligence...</p>
    </div>
  )
}
