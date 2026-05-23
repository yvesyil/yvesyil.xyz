import { useEffect, useRef } from 'react'

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

  // "Hash without Sine" — David Hoskins (shadertoy.com/view/4djSRW)
  float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    // NDC, aspect-corrected
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;

    // Mouse-influenced camera orbit. Mouse position drives yaw/pitch, time
    // adds a slow continuous rotation underneath.
    vec2 mouseN = (uMouse - uResolution * 0.5) / uResolution;
    float yaw = uTime * 0.12 + mouseN.x * 1.8;
    float pitch = mouseN.y * 0.9;

    // Orbit camera
    float dist = 2.4;
    vec3 ro = vec3(
      sin(yaw) * cos(pitch),
      sin(pitch),
      cos(yaw) * cos(pitch)
    ) * dist;

    // Build view basis looking at origin
    vec3 forward = normalize(-ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 rd = normalize(forward * 1.5 + uv.x * right + uv.y * up);

    // Slowly breathing power for subtle morphing
    float power = 8.0 + sin(uTime * 0.25) * 0.6;

    // Raymarch
    float t = 0.4;
    bool hit = false;
    int steps = 0;
    for (int i = 0; i < 64; i++) {
      vec3 p = ro + rd * t;
      float d = mandelbulbDE(p, power);
      if (d < 0.0015) { hit = true; break; }
      if (t > 5.0) break;
      t += d * 0.9;
      steps = i + 1;
    }

    vec3 base = vec3(7.0, 10.0, 7.0) / 255.0;
    vec3 col = base;
    vec3 tint = vec3(0.42, 0.62, 0.42);

    // Mandelbulb — edges only. Smoothstep the fresnel rim so only the
    // outermost band lights up; the interior stays at the base colour.
    if (hit) {
      vec3 p = ro + rd * t;
      vec3 n = estimateNormal(p, power);
      float ndotv = max(dot(-rd, n), 0.0);
      float rim = smoothstep(0.55, 1.0, 1.0 - ndotv);
      col += tint * rim * 0.18;
    }

    // Film grain overlay — quantized cells, slow ~10 steps/sec flicker
    vec2 frag = gl_FragCoord.xy;
    vec2 mouseUV = uv * 0.5 + 0.5;
    vec2 fragUV = frag / uResolution;
    float emphasis = exp(-length((fragUV - uMouse / uResolution) * vec2(uResolution.x/uResolution.y, 1.0)) * 4.0);
    float tStep = floor(uTime * 10.0);
    const float GRAIN_SIZE = 2.0;
    vec2 cell = floor(frag / GRAIN_SIZE);
    float g = hash13(vec3(cell, tStep));
    float strength = mix(0.012, 0.03, emphasis);
    float modulation = (g - 0.5) * strength;
    col += normalize(vec3(7.0, 10.0, 7.0)) * modulation;

    gl_FragColor = vec4(col, 1.0);
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

      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false })
      // 1.0 DPR keeps the raymarcher cheap; it's a background, slight softness is fine.
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

      // Smoothed mouse follow so the camera doesn't jitter.
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
        zIndex: 0,
      }}
    />
  )
}
