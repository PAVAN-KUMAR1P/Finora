import { useEffect } from 'react'

/** Calls `handler` when Escape is pressed (used by modal dialogs). */
export function useEscape(handler) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && handler()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handler])
}
