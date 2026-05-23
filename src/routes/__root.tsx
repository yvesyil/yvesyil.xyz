import { useEffect } from 'react'
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import PageDots from '../components/PageDots'

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
