import { useEffect } from 'react'

// Cursor-driven glitch distortion on text elements:
//   - chromatic aberration (red/cyan text-shadow offsets)
//   - per-frame jitter (random shake)
//   - directional skew based on cursor angle
// Intensity scales quadratically with cursor proximity.

const SELECTOR = 'h1, h2, h3, blockquote, .section-title, a:not(.no-distort)'
const RADIUS = 160        // px — proximity for the effect to engage
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

    const clearStyles = (el: HTMLElement) => {
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

          // === WAVE — SVG displacement filter does the real work; this is
          // just a tiny residual skew so the element edges hint at motion. ===
          const now = performance.now()
          const phase = box.top * 0.01
          const waveSkew = Math.sin(now * 0.005 + phase) * k * 1.5

          // === GLITCH BURSTS — probabilistic, scaled by proximity ===
          // Occasional sharp horizontal jump (broken-signal feel)
          let glitchX = 0
          if (Math.random() < 0.06 * k) {
            glitchX = (Math.random() - 0.5) * 22
          }

          // Occasional clip-path band — slices off top or bottom of the text
          let clipPath = ''
          if (Math.random() < 0.05 * k) {
            const slice = 10 + Math.random() * 50 // 10–60%
            clipPath = Math.random() < 0.5
              ? `inset(${slice.toFixed(1)}% 0 0 0)`
              : `inset(0 0 ${slice.toFixed(1)}% 0)`
          }

          // Occasional triple-shadow chromatic stack (more aggressive split)
          const useTripleSplit = Math.random() < 0.08 * k
          const shadow = useTripleSplit
            ? `${(-chromatic * 1.6).toFixed(2)}px 0 rgba(255, 80, 80, 0.9), ` +
              `${(chromatic * 1.6).toFixed(2)}px 0 rgba(80, 220, 255, 0.9), ` +
              `0 ${(chromatic * 0.8).toFixed(2)}px rgba(180, 255, 120, 0.4)`
            : `${(-chromatic).toFixed(2)}px 0 rgba(255, 80, 80, 0.85), ` +
              `${chromatic.toFixed(2)}px 0 rgba(80, 220, 255, 0.85)`

          el.style.textShadow = shadow
          el.style.transform =
            `translate(${(jitterX + glitchX).toFixed(2)}px, ${jitterY.toFixed(2)}px) ` +
            `skewX(${(skew + waveSkew).toFixed(2)}deg)`
          el.style.clipPath = clipPath
          // SVG displacement filter — wave-distorts the text glyphs themselves
          // (not just the element). The filter's internal animation makes the
          // noise pattern travel upward, so the wave appears to climb the text.
          // Variant by element size: bigger text needs bigger, lower-frequency
          // waves to feel proportional rather than like fine jitter.
          const tag = el.tagName
          const filterId =
            tag === 'H1' || el.classList.contains('section-title')
              ? 'text-wave-distort-lg'
              : tag === 'H2'
                ? 'text-wave-distort-md'
                : 'text-wave-distort-sm'
          el.style.filter = `url(#${filterId})`
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
