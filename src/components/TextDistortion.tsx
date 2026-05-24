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

// SVG wave starts appearing only once the cursor is "almost on" the text
// (k = quadratic proximity). Below WAVE_K_START the wave is silent; from
// WAVE_K_START to 1.0 its displacement scale ramps from 0 to the variant's
// max scale defined below.
const WAVE_K_START = 0.5
const WAVE_MAX_SCALE: Record<'sm' | 'md' | 'lg', number> = {
  sm: 10,
  md: 32,
  lg: 55,
}

// Flicker bursts (sharp jumps, clip-path slicing, triple-shadow flash) only
// turn on at the very top of the proximity range — when the cursor is on top
// of the text. Probability ramps from 0 at FLICKER_K_START to full at k=1.
const FLICKER_K_START = 0.85

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

    const restartWave = (variant: 'sm' | 'md' | 'lg') => {
      const animate = document.getElementById(`text-wave-anim-${variant}`) as unknown as
        | (SVGElement & { beginElement?: () => void })
        | null
      animate?.beginElement?.()
    }

    const displacementMap = (variant: 'sm' | 'md' | 'lg') =>
      document.querySelector(`#text-wave-distort-${variant} feDisplacementMap`) as
        | SVGElement
        | null

    // Per-variant aggregated state, updated each frame.
    const wantedScale: Record<'sm' | 'md' | 'lg', number> = { sm: 0, md: 0, lg: 0 }
    const variantActive: Record<'sm' | 'md' | 'lg', boolean> = { sm: false, md: false, lg: false }

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
      wantedScale.sm = 0
      wantedScale.md = 0
      wantedScale.lg = 0
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

          // === FLICKER BURSTS — only fire near max proximity ===
          const flickerStrength = k > FLICKER_K_START
            ? (k - FLICKER_K_START) / (1 - FLICKER_K_START)
            : 0

          let glitchX = 0
          if (flickerStrength > 0 && Math.random() < 0.06 * flickerStrength) {
            glitchX = (Math.random() - 0.5) * 22
          }

          let clipPath = ''
          if (flickerStrength > 0 && Math.random() < 0.05 * flickerStrength) {
            const slice = 10 + Math.random() * 50
            clipPath = Math.random() < 0.5
              ? `inset(${slice.toFixed(1)}% 0 0 0)`
              : `inset(0 0 ${slice.toFixed(1)}% 0)`
          }

          const useTripleSplit = flickerStrength > 0 && Math.random() < 0.08 * flickerStrength
          const shadow = useTripleSplit
            ? `${(-chromatic * 1.6).toFixed(2)}px 0 rgba(255, 80, 80, 0.9), ` +
              `${(chromatic * 1.6).toFixed(2)}px 0 rgba(80, 220, 255, 0.9), ` +
              `0 ${(chromatic * 0.8).toFixed(2)}px rgba(180, 255, 120, 0.4)`
            : `${(-chromatic).toFixed(2)}px 0 rgba(255, 80, 80, 0.85), ` +
              `${chromatic.toFixed(2)}px 0 rgba(80, 220, 255, 0.85)`

          el.style.textShadow = shadow
          el.style.transform =
            `translate(${(jitterX + glitchX).toFixed(2)}px, ${jitterY.toFixed(2)}px) ` +
            `skewX(${skew.toFixed(2)}deg)`
          el.style.clipPath = clipPath
          // SVG wave filter — its displacement scale is driven by per-variant
          // max k aggregated below. The filter URL is applied here so the
          // element receives the wave only when k passes WAVE_K_START.
          const waveK = k > WAVE_K_START
            ? (k - WAVE_K_START) / (1 - WAVE_K_START)  // 0 at k=START, 1 at k=1
            : 0
          if (waveK > 0) {
            const tag = el.tagName
            const variant: 'sm' | 'md' | 'lg' =
              tag === 'H1' || el.classList.contains('section-title')
                ? 'lg'
                : tag === 'H2'
                  ? 'md'
                  : 'sm'
            const scale = waveK * waveK * WAVE_MAX_SCALE[variant] // quadratic ramp
            if (scale > wantedScale[variant]) wantedScale[variant] = scale
            el.style.filter = `url(#text-wave-distort-${variant})`
          } else if (el.style.filter) {
            el.style.filter = ''
          }
        } else {
          clearStyles(el)
        }
      })

      // Push aggregated scales to each variant's filter and restart the
      // animation on the false → true transition (no elements → some).
      for (const variant of ['sm', 'md', 'lg'] as const) {
        const map = displacementMap(variant)
        if (map) map.setAttribute('scale', wantedScale[variant].toFixed(2))
        const isActive = wantedScale[variant] > 0
        if (isActive && !variantActive[variant]) restartWave(variant)
        variantActive[variant] = isActive
      }

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
