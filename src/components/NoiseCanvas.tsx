import { useEffect, useRef } from 'react'

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

// "Hash without Sine" — David Hoskins
// https://www.shadertoy.com/view/4djSRW
// Well-distributed GPU hash with no visible patterns or wrap.
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / u_resolution.xy;

  // Aspect-corrected distance to the cursor for the local "warm zone"
  float aspect = u_resolution.x / u_resolution.y;
  vec2 mouseUV = u_mouse / u_resolution;
  vec2 toMouse = vec2((uv.x - mouseUV.x) * aspect, uv.y - mouseUV.y);
  float emphasis = exp(-length(toMouse) * 4.0);

  // Time-quantized to ~20 steps/sec for a slow film-projector flicker
  float t = floor(u_time * 20.0);

  // Quantize the sample coord so each grain spans GRAIN_SIZE×GRAIN_SIZE
  // device pixels instead of being a single pixel.
  const float GRAIN_SIZE = 2.0;
  vec2 cell = floor(frag / GRAIN_SIZE);
  float g = hash13(vec3(cell, t));

  float strength = mix(0.025, 0.04, emphasis);
  float modulation = (g - 0.5) * strength;

  // Grain shares the site-background hue rather than going gray.
  // normalize((7, 10, 7)) ≈ (0.50, 0.71, 0.50) — green-biased.
  vec3 base = vec3(7.0, 10.0, 7.0) / 255.0;
  vec3 tint = normalize(vec3(7.0, 10.0, 7.0));
  vec3 col = base + tint * modulation;

  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export default function NoiseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false }) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
    if (!gl) return

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    )
    const posLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'u_resolution')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uTime = gl.getUniformLocation(program, 'u_time')

    // Render at full DPR so each device pixel gets its own noise sample.
    // Capped at 2 to avoid hammering 3x phones / 4k retina pointlessly.
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

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

    let raf = 0
    const startTime = performance.now()
    const tick = () => {
      current.x += (target.x - current.x) * 0.12
      current.y += (target.y - current.y) * 0.12

      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform2f(uMouse, current.x * dpr, current.y * dpr)
      gl.uniform1f(uTime, (performance.now() - startTime) / 1000)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('touchmove', handleTouch)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buffer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
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
