import { useEffect } from 'react'
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import MandelbulbCanvas from '../components/MandelbulbCanvas'
import NoiseCanvas from '../components/NoiseCanvas'
import PageDots from '../components/PageDots'
import TextDistortion from '../components/TextDistortion'
import GlitchFilter from '../components/GlitchFilter'

function RootComponent() {
  const pathname = useLocation({ select: (loc) => loc.pathname })

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
      <GlitchFilter />
      <TextDistortion />
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
