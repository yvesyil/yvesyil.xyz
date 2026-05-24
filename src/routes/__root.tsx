import { useEffect, useState } from 'react'
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import MandelbulbCanvas from '../components/MandelbulbCanvas'
import NoiseCanvas from '../components/NoiseCanvas'
import PageDots from '../components/PageDots'
import TextDistortion from '../components/TextDistortion'
import GlitchFilter from '../components/GlitchFilter'

// Reactive media-query hook. Used to gate cursor-driven effects (text
// distortion + glitch filter) on desktop only — touch devices don't have a
// cursor, and the SVG filters are GPU-expensive on phones.
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

function RootComponent() {
  const pathname = useLocation({ select: (loc) => loc.pathname })
  const isMobile = useMediaQuery('(max-width: 900px), (pointer: coarse)')

  useEffect(() => {
    const container = document.querySelector('.page-content') as HTMLElement | null
    if (!container) return
    container.style.transition = 'opacity 250ms ease-in-out'
    container.style.opacity = '1'
  }, [pathname])

  return (
    <>
      <MandelbulbCanvas />
      <NoiseCanvas />
      {!isMobile && <GlitchFilter />}
      {!isMobile && <TextDistortion />}
      <div className="page-content">
        <Outlet />
      </div>
      <PageDots />
    </>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
