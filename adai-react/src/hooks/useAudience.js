import { useState, useEffect } from 'react'
import { SEGMENT_META } from '../data/audienceData'
import { randBetween } from '../utils/audienceHelpers'

export default function useAudience() {

  // ── Live reach values ──
  const [reaches, setReaches] = useState(() =>
    SEGMENT_META.map((m) =>
      m.reachUnit === 'M'
        ? randBetween(m.reachMin, m.reachMax)
        : randBetween(m.reachMin, m.reachMax)
    )
  )

  // ── Live Active Now counter ──
  const [activeNow, setActiveNow] = useState(23847)

  // ── Reach fluctuation every 3s ──
  useEffect(() => {
    const id = setInterval(() => {
      setReaches(
        SEGMENT_META.map((m) => randBetween(m.reachMin, m.reachMax))
      )
    }, 3000)
    return () => clearInterval(id)
  }, [])

  // ── Active Now fluctuation every 2s ──
  useEffect(() => {
    const id = setInterval(() => {
      setActiveNow((prev) => {
        const delta = Math.floor(randBetween(50, 200)) * (Math.random() > 0.5 ? 1 : -1)
        return Math.max(20000, prev + delta)
      })
    }, 2000)
    return () => clearInterval(id)
  }, [])

  return { reaches, activeNow }
}