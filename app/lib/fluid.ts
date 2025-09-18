// Working Fluid Simulation for Next.js
// Simplified but effective implementation that recreates the original look

let fluidInitialized = false;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

// Fluid state
let trails: FluidTrail[] = [];
let mouseX = 0;
let mouseY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let animationId: number | null = null;

interface FluidTrail {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: { r: number; g: number; b: number };
  intensity: number;
}

// Configuration matching original
const config = {
  maxTrails: 200,
  trailLife: 120,
  fadeRate: 0.98,
  splatRadius: 25,
  velocityMultiplier: 0.3,
  colorIntensity: 0.8,
  grainAmount: 0.02,
};

function generateColor(intensity: number = 1): { r: number; g: number; b: number } {
  // Colors similar to original: red/orange tones
  const hue = Math.random() * 60; // 0-60 degrees (red to yellow)
  const saturation = 0.8 + Math.random() * 0.2;
  const value = 0.6 + intensity * 0.4;
  
  return hsvToRgb(hue, saturation, value);
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255) * 0.4, // Reduce intensity like original
    g: Math.round((g + m) * 255) * 0.05, // Very low green
    b: Math.round((b + m) * 255) * 0.2   // Some blue
  };
}

function createTrail(x: number, y: number, vx: number, vy: number): FluidTrail {
  const speed = Math.sqrt(vx * vx + vy * vy);
  const intensity = Math.min(speed * 0.1, 1);
  
  return {
    x,
    y,
    vx: vx * config.velocityMultiplier + (Math.random() - 0.5) * 2,
    vy: vy * config.velocityMultiplier + (Math.random() - 0.5) * 2,
    life: config.trailLife,
    maxLife: config.trailLife,
    size: 2 + Math.random() * 4,
    color: generateColor(intensity),
    intensity: intensity
  };
}

function updateTrails() {
  // Update existing trails
  for (let i = trails.length - 1; i >= 0; i--) {
    const trail = trails[i];
    
    // Update position with fluid-like motion
    trail.x += trail.vx;
    trail.y += trail.vy;
    
    // Apply drag and curl effects
    trail.vx *= 0.985;
    trail.vy *= 0.985;
    
    // Add some curl/swirl
    const curl = 0.02;
    const temp = trail.vx;
    trail.vx += trail.vy * curl;
    trail.vy -= temp * curl;
    
    // Update life
    trail.life--;
    trail.intensity = (trail.life / trail.maxLife) * config.colorIntensity;
    
    // Remove dead trails
    if (trail.life <= 0) {
      trails.splice(i, 1);
    }
  }
  
  // Add new trails based on mouse movement
  const dx = mouseX - lastMouseX;
  const dy = mouseY - lastMouseY;
  const speed = Math.sqrt(dx * dx + dy * dy);
  
  if (speed > 1 && trails.length < config.maxTrails) {
    const numTrails = Math.min(Math.floor(speed * 0.3), 8);
    
    for (let i = 0; i < numTrails; i++) {
      const offsetX = (Math.random() - 0.5) * 15;
      const offsetY = (Math.random() - 0.5) * 15;
      
      trails.push(createTrail(
        mouseX + offsetX,
        mouseY + offsetY,
        dx * 0.5 + (Math.random() - 0.5) * 3,
        dy * 0.5 + (Math.random() - 0.5) * 3
      ));
    }
  }
  
  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

function drawFluid() {
  if (!ctx || !canvas) return;

  // Create local non-null references for type narrowing
  const context = ctx as CanvasRenderingContext2D;
  const cnv = canvas as HTMLCanvasElement;
  
  // Clear with dark background and fade effect
  context.fillStyle = 'rgba(7, 10, 7, 0.03)'; // Very subtle fade
  context.fillRect(0, 0, cnv.width, cnv.height);
  
  // Draw trails with glow effect
  trails.forEach(trail => {
    const alpha = trail.intensity;
    
    if (alpha > 0.01) {
      // Main trail blob
      context.beginPath();
      context.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2);
      
      const gradient = context.createRadialGradient(
        trail.x, trail.y, 0,
        trail.x, trail.y, trail.size * 3
      );
      
      gradient.addColorStop(0, `rgba(${trail.color.r}, ${trail.color.g}, ${trail.color.b}, ${alpha * 0.8})`);
      gradient.addColorStop(0.5, `rgba(${trail.color.r}, ${trail.color.g}, ${trail.color.b}, ${alpha * 0.4})`);
      gradient.addColorStop(1, `rgba(${trail.color.r}, ${trail.color.g}, ${trail.color.b}, 0)`);
      
      context.fillStyle = gradient;
      context.fill();
      
      // Additional glow layer
      context.beginPath();
      context.arc(trail.x, trail.y, trail.size * 2, 0, Math.PI * 2);
      
      const outerGradient = context.createRadialGradient(
        trail.x, trail.y, 0,
        trail.x, trail.y, trail.size * 6
      );
      
      outerGradient.addColorStop(0, `rgba(${trail.color.r * 1.2}, ${trail.color.g * 1.2}, ${trail.color.b * 1.2}, ${alpha * 0.3})`);
      outerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      context.fillStyle = outerGradient;
      context.fill();
    }
  });
  
  // Add film grain effect
  if (Math.random() < 0.3) {
    const imageData = context.getImageData(0, 0, cnv.width, cnv.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * config.grainAmount * 255;
      data[i] += grain;     // R
      data[i + 1] += grain * 0.5; // G
      data[i + 2] += grain; // B
    }
    
    context.putImageData(imageData, 0, 0);
  }
}

function animate() {
  updateTrails();
  drawFluid();
  animationId = requestAnimationFrame(animate);
}

function resizeCanvas() {
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
  
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
}

// Event handlers
function attachEventListeners() {
  if (typeof window === 'undefined' || !canvas) return;

  const body = document.querySelector('body');
  if (!body) return;

  const mouseMoveHandler = (e: MouseEvent) => {
    const rect = canvas!.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  };

  const touchMoveHandler = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = canvas!.getBoundingClientRect();
      const touch = e.touches[0];
      mouseX = touch.clientX - rect.left;
      mouseY = touch.clientY - rect.top;
    }
  };

  const resizeHandler = () => {
    resizeCanvas();
  };

  body.addEventListener("mousemove", mouseMoveHandler);
  body.addEventListener("touchmove", touchMoveHandler, { passive: false });
  window.addEventListener("resize", resizeHandler);
}

// Main initialization function
export function initFluidSimulation() {
  if (typeof window === 'undefined') return;
  
  if (fluidInitialized) {
    console.log('Fluid already initialized');
    return;
  }

  console.log('Initializing working fluid simulation...');

  canvas = document.getElementById("fluid") as HTMLCanvasElement;
  
  if (!canvas) {
    console.error('Fluid canvas not found');
    return;
  }

  ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get 2D context');
    return;
  }

  // Setup canvas
  resizeCanvas();
  
  // Initialize mouse position
  const rect = canvas.getBoundingClientRect();
  mouseX = rect.width / 2;
  mouseY = rect.height / 2;
  lastMouseX = mouseX;
  lastMouseY = mouseY;

  // Set initial dark background
  ctx.fillStyle = 'rgb(7, 10, 7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Attach event listeners
  attachEventListeners();
  
  // Start animation loop
  animate();

  fluidInitialized = true;
  console.log('Working fluid simulation initialized successfully!');
}

// Cleanup function
export function cleanupFluidSimulation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  trails = [];
  fluidInitialized = false;
}