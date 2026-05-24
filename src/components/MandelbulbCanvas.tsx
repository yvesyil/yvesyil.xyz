import { useEffect, useRef } from 'react'
import { useLocation } from '@tanstack/react-router'

// Per-route Mandelbulb `power` — defines the fractal's shape; each route
// lands on a visibly different bulb. Power is lerped smoothly between routes.
const ROUTE_POWER: Record<string, number> = {
  '/':         8.0,
  '/whoami':   5.0,
  '/projects': 14.0,
  '/writings': 3.5,
  '/contact':  6.5,
  '/read':     1.5,
}
const DEFAULT_POWER = ROUTE_POWER['/']

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
  uniform float uPower;
  uniform float uBulbStrength;
  varying vec2 vUv;

  // Mandelbulb distance estimator. Classic formulation:
  // https://www.skytopia.com/project/fractal/2mandelbulb.html
  float mandelbulbDE(vec3 pos, float power) {
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;

    for (int i = 0; i < 6; i++) {
      r = length(z);
      if (r > 2.0) break;

      float theta = acos(z.z / r);
      float phi = atan(z.y, z.x);
      dr = pow(r, power - 1.0) * power * dr + 1.0;

      float zr = pow(r, power);
      theta *= power;
      phi *= power;

      z = zr * vec3(
        sin(theta) * cos(phi),
        sin(phi) * sin(theta),
        cos(theta)
      );
      z += pos;
    }
    return 0.5 * log(r) * r / dr;
  }

  vec3 estimateNormal(vec3 p, float power) {
    float eps = 0.0015;
    vec2 e = vec2(eps, 0.0);
    return normalize(vec3(
      mandelbulbDE(p + e.xyy, power) - mandelbulbDE(p - e.xyy, power),
      mandelbulbDE(p + e.yxy, power) - mandelbulbDE(p - e.yxy, power),
      mandelbulbDE(p + e.yyx, power) - mandelbulbDE(p - e.yyx, power)
    ));
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;
    // Shift the bulb visually to the right by offsetting the uv leftward,
    // so the scene-origin (where the bulb sits) renders at +uv.x on screen.
    uv.x -= 0.4;

    // Mouse-influenced camera orbit. Mouse position drives yaw/pitch, time
    // adds a slow continuous rotation underneath.
    vec2 mouseN = (uMouse - uResolution * 0.5) / uResolution;
    float yaw = uTime * 0.12 + mouseN.x * 1.8;
    float pitch = mouseN.y * 0.9;

    float dist = 2.4;
    vec3 ro = vec3(
      sin(yaw) * cos(pitch),
      sin(pitch),
      cos(yaw) * cos(pitch)
    ) * dist;

    vec3 forward = normalize(-ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 rd = normalize(forward * 1.5 + uv.x * right + uv.y * up);

    // Per-route power with a slow breathing offset for subtle morphing
    float power = uPower + sin(uTime * 0.25) * 0.4;

    vec3 base = vec3(7.0, 10.0, 7.0) / 255.0;
    vec3 col = base;
    vec3 tint = vec3(0.42, 0.62, 0.42);

    // Skip the raymarch entirely when uBulbStrength is near 0 — saves GPU
    // on routes where the bulb is hidden (writing posts).
    if (uBulbStrength > 0.01) {
      float t = 0.4;
      bool hit = false;
      for (int i = 0; i < 64; i++) {
        vec3 p = ro + rd * t;
        float d = mandelbulbDE(p, power);
        if (d < 0.0015) { hit = true; break; }
        if (t > 5.0) break;
        t += d * 0.9;
      }

      // Edges only — smoothstep fresnel rim so the interior stays the base
      // colour and only the outermost band lights up.
      if (hit) {
        vec3 p = ro + rd * t;
        vec3 n = estimateNormal(p, power);
        float ndotv = max(dot(-rd, n), 0.0);
        float rim = smoothstep(0.55, 1.0, 1.0 - ndotv);
        col += tint * rim * 0.18 * uBulbStrength;
      }
    }

    gl_FragColor = vec4(col, 1.0);
  }
`

export default function MandelbulbCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = useLocation({ select: (loc) => loc.pathname })
  const powerTargetRef = useRef(DEFAULT_POWER)
  // 0 = hide the bulb (writing posts), 1 = show.
  const bulbTargetRef = useRef(1)

  useEffect(() => {
    powerTargetRef.current = ROUTE_POWER[pathname] ?? DEFAULT_POWER
    const isWritingPost = /^\/writings\/[^/]+/.test(pathname)
    bulbTargetRef.current = isWritingPost ? 0 : 1
  }, [pathname])

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

      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false })
      renderer.setPixelRatio(1)
      renderer.setSize(window.innerWidth, window.innerHeight)
      container.appendChild(renderer.domElement)

      const uniforms = {
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMouse: { value: new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2) },
        uTime: { value: 0 },
        uPower: { value: DEFAULT_POWER },
        uBulbStrength: { value: 1 },
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
      let curPower = DEFAULT_POWER
      let curBulb = 1
      const tick = () => {
        current.x += (target.x - current.x) * 0.06
        current.y += (target.y - current.y) * 0.06

        curPower += (powerTargetRef.current - curPower) * 0.03
        curBulb += (bulbTargetRef.current - curBulb) * 0.04

        uniforms.uMouse.value.set(current.x, current.y)
        uniforms.uTime.value = (performance.now() - start) / 1000
        uniforms.uPower.value = curPower
        uniforms.uBulbStrength.value = curBulb

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
        zIndex: 0,
      }}
    />
  )
}
