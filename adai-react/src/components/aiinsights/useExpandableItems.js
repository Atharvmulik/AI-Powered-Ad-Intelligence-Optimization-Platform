import { useMemo, useState } from 'react'

export function useExpandableItems(items, initialCount) {
  const [expanded, setExpanded] = useState(false)

  const visibleItems = useMemo(() => {
    if (!items) return []
    return expanded ? items : items.slice(0, initialCount)
  }, [expanded, initialCount, items])

  const toggleExpanded = () => setExpanded((prev) => !prev)

  return { expanded, visibleItems, toggleExpanded }
}
