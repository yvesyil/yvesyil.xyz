'use client';

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function FadeOnRouteChange() {
  const pathname = usePathname()

  useEffect(() => {
    const container = document.querySelector('.page-content') as HTMLElement | null
    if (!container) return

    container.style.transition = 'opacity 250ms ease-in-out'
    container.style.opacity = '0'

    const id = requestAnimationFrame(() => {
      container.style.opacity = '1'
    })

    return () => cancelAnimationFrame(id)
  }, [pathname])

  return null
}


