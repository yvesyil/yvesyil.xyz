import { useEffect, useRef } from 'react'

// Film-grain overlay. Rendered on a transparent canvas above MandelbulbCanvas;
// its mix-blend-mode lets the grain modulate whatever is behind it.

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uTime;
  varying vec2 vUv;

  // "Hash without Sine" — David Hoskins (shadertoy.com/view/4djSRW)
  float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 fragUV = frag / uResolution;

    // Brighter grain near the cursor (centred on mouse position)
    float emphasis = exp(-length(
      (fragUV - uMouse / uResolution) * vec2(uResolution.x / uResolution.y, 1.0)
    ) * 4.0);

    // Quantize the sample coord into GRAIN_SIZE blocks and time-quantize to
    // ~10 steps/sec for a film-projector flicker feel.
    float tStep = floor(uTime * 10.0);
    const float GRAIN_SIZE = 2.0;
    vec2 cell = floor(frag / GRAIN_SIZE);
    float g = hash13(vec3(cell, tStep));

    // Additive grain: each pixel contributes a small positive brightness in
    // the site palette. mix-blend-mode: plus-lighter on the canvas adds this
    // straight onto whatever is behind, giving the film-sparkle effect.
    float strength = mix(0.012, 0.03, emphasis);
    float brightness = g * strength;
    vec3 tint = normalize(vec3(7.0, 10.0, 7.0)); // ≈ (0.50, 0.71, 0.50)
    gl_FragColor = vec4(tint * brightness, 1.0);
  }
`

export default function NoiseCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let cleanup: (() => void) | null = null

    ;(async () => {
      const THREE = await import('three')
      if (cancelled || !container) return

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
      renderer.setClearColor(0x000000, 0)
      renderer.setPixelRatio(1)
      renderer.setSize(window.innerWidth, window.innerHeight)
      container.appendChild(renderer.domElement)

      const uniforms = {
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMouse: { value: new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2) },
        uTime: { value: 0 },
      }

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
      })

      const geometry = new THREE.PlaneGeometry(2, 2)
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      const current = { x: target.x, y: target.y }

      const handleMouse = (e: MouseEvent) => {
        target.x = e.clientX
        target.y = window.innerHeight - e.clientY
      }
      const handleTouch = (e: TouchEvent) => {
        if (e.touches.length === 0) return
        target.x = e.touches[0].clientX
        target.y = window.innerHeight - e.touches[0].clientY
      }
      window.addEventListener('mousemove', handleMouse)
      window.addEventListener('touchmove', handleTouch, { passive: true })

      const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight)
        uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', handleResize)

      let raf = 0
      const start = performance.now()
      const tick = () => {
        current.x += (target.x - current.x) * 0.06
        current.y += (target.y - current.y) * 0.06

        uniforms.uMouse.value.set(current.x, current.y)
        uniforms.uTime.value = (performance.now() - start) / 1000

        renderer.render(scene, camera)
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)

      cleanup = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('mousemove', handleMouse)
        window.removeEventListener('touchmove', handleTouch)
        window.removeEventListener('resize', handleResize)
        geometry.dispose()
        material.dispose()
        renderer.dispose()
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement)
        }
      }
    })()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
        // Additive blend — the shader outputs only brightness contribution,
        // so this directly brightens whatever is behind it.
        mixBlendMode: 'plus-lighter',
      }}
    />
  )
}
