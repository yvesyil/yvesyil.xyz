import { useEffect } from 'react'

// Cursor-driven glitch distortion on text elements:
//   - chromatic aberration (red/cyan text-shadow offsets)
//   - per-frame jitter (random shake)
//   - directional skew based on cursor angle
// Intensity scales quadratically with cursor proximity.

const SELECTOR = 'h1, h2, h3, blockquote, .section-title, a:not(.no-distort)'
const RADIUS = 160        // px — proximity for the effect to engage
const WAVE_RADIUS = 40    // px — tighter proximity for the SVG wave filter
const CHROMATIC_MAX = 4   // px — max red/cyan split
const JITTER_MAX = 1    // px — random shake per frame
const SKEW_MAX = 7       // deg — max horizontal skew

export default function TextDistortion() {
  useEffect(() => {
    const mouse = { x: -99999, y: -99999 }

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      mouse.x = e.touches[0].clientX
      mouse.y = e.touches[0].clientY
    }

    const range = document.createRange()
    // Track which elements are currently in hover range so we can detect
    // the "out → in" transition and restart the SVG wave from frame 0.
    const hovering = new WeakSet<HTMLElement>()

    const restartWave = (variant: 'sm' | 'md' | 'lg') => {
      const animate = document.getElementById(`text-wave-anim-${variant}`) as unknown as
        | (SVGElement & { beginElement?: () => void })
        | null
      animate?.beginElement?.()
    }

    const clearStyles = (el: HTMLElement) => {
      if (hovering.has(el)) hovering.delete(el)
      if (el.style.transform || el.style.textShadow || el.style.clipPath || el.style.filter) {
        el.style.transform = ''
        el.style.textShadow = ''
        el.style.clipPath = ''
        el.style.filter = ''
      }
    }

    let raf = 0
    const update = () => {
      const vh = window.innerHeight
      const elements = document.querySelectorAll<HTMLElement>(SELECTOR)
      elements.forEach((el) => {
        // Cheap viewport cull first
        const box = el.getBoundingClientRect()
        if (box.bottom < -RADIUS || box.top > vh + RADIUS) {
          clearStyles(el)
          return
        }

        // Coarse element-box check to skip Range work for far-away elements
        const boxClosestX = Math.max(box.left, Math.min(mouse.x, box.right))
        const boxClosestY = Math.max(box.top, Math.min(mouse.y, box.bottom))
        const boxDist = Math.hypot(mouse.x - boxClosestX, mouse.y - boxClosestY)
        if (boxDist >= RADIUS) {
          clearStyles(el)
          return
        }

        // Measure the actual TEXT glyph rects (one per visual line) so the
        // proximity is to the rendered characters, not the empty padding of
        // a wide element.
        range.selectNodeContents(el)
        const lineRects = range.getClientRects()
        if (lineRects.length === 0) {
          clearStyles(el)
          return
        }

        let d = Infinity
        let nearestCX = 0
        let nearestCY = 0
        for (let i = 0; i < lineRects.length; i++) {
          const r = lineRects[i]
          const cx = Math.max(r.left, Math.min(mouse.x, r.right))
          const cy = Math.max(r.top, Math.min(mouse.y, r.bottom))
          const dist = Math.hypot(mouse.x - cx, mouse.y - cy)
          if (dist < d) {
            d = dist
            nearestCX = (r.left + r.right) * 0.5
            nearestCY = (r.top + r.bottom) * 0.5
          }
        }

        if (d < RADIUS) {
          const t = 1 - d / RADIUS
          const k = t * t

          // Skew direction comes from the nearest text-rect's center
          const ddx = mouse.x - nearestCX
          const ddy = mouse.y - nearestCY
          const dd = Math.hypot(ddx, ddy)
          const nx = dd > 0.001 ? ddx / dd : 0

          const chromatic = k * CHROMATIC_MAX
          const jitterX = (Math.random() - 0.5) * k * JITTER_MAX
          const jitterY = (Math.random() - 0.5) * k * JITTER_MAX
          const skew = nx * k * SKEW_MAX

          el.style.textShadow =
            `${(-chromatic).toFixed(2)}px 0 rgba(255, 80, 80, 0.85), ` +
            `${chromatic.toFixed(2)}px 0 rgba(80, 220, 255, 0.85)`
          el.style.transform =
            `translate(${jitterX.toFixed(2)}px, ${jitterY.toFixed(2)}px) ` +
            `skewX(${skew.toFixed(2)}deg)`
          // SVG displacement filter — wave-distorts the text glyphs themselves.
          // Only engages within the much tighter WAVE_RADIUS, so it fires
          // only when the cursor is essentially on the text (when jitter and
          // skew are at full strength too).
          if (d < WAVE_RADIUS) {
            const tag = el.tagName
            const variant: 'sm' | 'md' | 'lg' =
              tag === 'H1' || el.classList.contains('section-title')
                ? 'lg'
                : tag === 'H2'
                  ? 'md'
                  : 'sm'
            el.style.filter = `url(#text-wave-distort-${variant})`

            // Out → in transition: restart the wave from frame 0 (bottom of
            // the text) so each new hover begins the animation fresh.
            if (!hovering.has(el)) {
              hovering.add(el)
              restartWave(variant)
            }
          } else {
            if (el.style.filter) el.style.filter = ''
            if (hovering.has(el)) hovering.delete(el)
          }
        } else {
          clearStyles(el)
        }
      })
      raf = requestAnimationFrame(update)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    raf = requestAnimationFrame(update)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      cancelAnimationFrame(raf)
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        el.style.transform = ''
        el.style.textShadow = ''
      })
    }
  }, [])

  return null
}
