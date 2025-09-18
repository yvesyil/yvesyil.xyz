// Polaroid Cursor Effect
// Creates polaroid photos that follow mouse movement

let polaroidInitialized = false;
let photosLoaded = false;
let container: HTMLDivElement | null = null;
let polaroids: PolaroidElement[] = [];
let mouseX = 0;
let mouseY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let spawnTimer = 0; // Timer for consistent spawning
let wasMouseMoving = false;
let resumeDelay = 0; // frames to delay after movement resumes
const RESUME_DELAY_FRAMES = 5; // ~0.1s at 60fps
let resumeUntilMs = 0; // timestamp until which we delay spawning after resume
let idleFrames = 0; // frames not moving
const IDLE_ARM_FRAMES = 20; // require ~0.33s idle before arming resume delay

interface PolaroidElement {
  element: HTMLDivElement;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  image: string;
}

// Tiny images for better performance
const photoList = [
  '/photos/tiny/AngelHoldingChalice.jpg',
  '/photos/tiny/AStreetInHaarlem.jpg',
  '/photos/tiny/Autopark.jpg',
  '/photos/tiny/CafeHetWapenVanBlo.jpg',
  '/photos/tiny/Caritasbronden.jpg',
  '/photos/tiny/CatLaying.jpg',
  '/photos/tiny/CatWithLargeCollar.jpg',
  '/photos/tiny/ChurchInTheDistance.jpg',
  '/photos/tiny/Cows.jpg',
  '/photos/tiny/CowsCurious.jpg',
  '/photos/tiny/DeBurcht.jpg',
  '/photos/tiny/FrederiksbergSlot.jpg',
  '/photos/tiny/GrassPlane.jpg',
  '/photos/tiny/Lake.jpg',
  '/photos/tiny/Maan.jpg',
  '/photos/tiny/Mermaid.jpg',
  '/photos/tiny/Office.jpg',
  '/photos/tiny/SAIL.jpg',
  '/photos/tiny/SintBonifatiuskerk.jpg',
  '/photos/tiny/Stairs.jpg',
  '/photos/tiny/ZaanRiver.jpg',
];

async function preloadPhotos(urls: string[]): Promise<void> {
  const loaders = urls.map((src) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // treat errors as resolved to avoid blocking
      img.src = src;
    })
  );
  await Promise.all(loaders);
}

const config = {
  maxPolaroids: 20, // Higher limit to prevent pauses
  polaroidLife: 60, // Shorter life so photos cycle faster
  spawnInterval: 8, // Spawn every 4 frames (15 times per second)
  fadeOutDuration: 30, // Faster fade for quicker turnover
  minMovementThreshold: 1, // Lower threshold
  polaroidSize: 140, // Bigger photos
};

let photoIndex = 0;
function getNextPhoto(): string {
  const src = photoList[photoIndex];
  photoIndex = (photoIndex + 1) % photoList.length;
  return src;
}

function createPolaroidElement(x: number, y: number): PolaroidElement {
  const element = document.createElement('div');
  const image = getNextPhoto();
  
  element.className = 'polaroid-photo';
  element.innerHTML = `
    <div class="polaroid-inner">
      <img src="${image}" alt="Random photo" />
      <div class="polaroid-caption"></div>
    </div>
  `;
  
  // Random rotation and slight scale variation
  const rotation = (Math.random() - 0.5) * 30; // -15 to 15 degrees
  const scale = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  
  element.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 1000;
    transform: translate(-50%, -50%) rotate(${rotation}deg) scale(${scale});
    transition: none;
  `;
  // Set initial position immediately so it doesn't flash at (0,0)
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  
  const polaroidElement: PolaroidElement = {
    element,
    x,
    y,
    rotation,
    scale,
    opacity: 1,
    life: config.polaroidLife,
    maxLife: config.polaroidLife,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    image
  };
  
  if (container) {
    container.appendChild(element);
  }
  
  return polaroidElement;
}

function updatePolaroids() {
  // If images aren't ready, skip updates (prevents blank placeholders)
  if (!photosLoaded) return;
  // Update existing polaroids
  for (let i = polaroids.length - 1; i >= 0; i--) {
    const polaroid = polaroids[i];
    
    // Update position with slight drift
    polaroid.x += polaroid.vx;
    polaroid.y += polaroid.vy;
    
    // Apply slight drag
    polaroid.vx *= 0.98;
    polaroid.vy *= 0.98;
    
    // Update life
    polaroid.life--;
    
    // Calculate opacity based on remaining life
    if (polaroid.life < config.fadeOutDuration) {
      polaroid.opacity = polaroid.life / config.fadeOutDuration;
    }
    
    // Update element position and opacity
    polaroid.element.style.left = `${polaroid.x}px`;
    polaroid.element.style.top = `${polaroid.y}px`;
    polaroid.element.style.opacity = polaroid.opacity.toString();
    
    // Remove dead polaroids
    if (polaroid.life <= 0) {
      if (container && polaroid.element.parentNode) {
        container.removeChild(polaroid.element);
      }
      polaroids.splice(i, 1);
    }
  }
  
  // Movement metrics and gating
  const dx = mouseX - lastMouseX;
  const dy = mouseY - lastMouseY;
  const movement = Math.sqrt(dx * dx + dy * dy);
  const isMoving = movement > config.minMovementThreshold;

  // Track idle vs moving frames to avoid re-arming delay on micro pauses
  if (isMoving) {
    // Only arm a delay if we were truly idle for a bit
    if (!wasMouseMoving && idleFrames >= IDLE_ARM_FRAMES) {
      resumeDelay = RESUME_DELAY_FRAMES;
      spawnTimer = 0; // reset cadence
      resumeUntilMs = typeof performance !== 'undefined' ? performance.now() + 120 : 0; // ~120ms
    }
    idleFrames = 0;
  } else {
    idleFrames++;
  }

  // Time-based guard (more robust across frame rates)
  if (resumeUntilMs && typeof performance !== 'undefined' && performance.now() < resumeUntilMs) {
    wasMouseMoving = isMoving;
    // DO NOT update lastMouse here; keep delta non-zero after delay
    spawnTimer++; // advance cadence during delay so first spawn can happen right after
    return;
  } else {
    resumeUntilMs = 0;
  }

  // Fallback frame-based guard
  if (resumeDelay > 0) {
    resumeDelay--;
    wasMouseMoving = isMoving;
    // DO NOT update lastMouse here; keep delta non-zero after delay
    spawnTimer++; // advance cadence during frame-based delay
    return;
  }

  // Advance cadence
  spawnTimer++;
  
  // Continuous spawning while moving
  if (isMoving) {
    if (spawnTimer >= config.spawnInterval) {
      // Spawn away from the cursor to avoid covering it
      const spawnDistance = 70 + Math.random() * 30; // 70-100px
      const spawnAngle = Math.random() * Math.PI * 2;
      const ringX = mouseX + Math.cos(spawnAngle) * spawnDistance;
      const ringY = mouseY + Math.sin(spawnAngle) * spawnDistance;

      // Spawn; replace oldest if at capacity
      if (polaroids.length < config.maxPolaroids) {
        polaroids.push(createPolaroidElement(ringX, ringY));
      } else {
        // Remove oldest polaroid and add new one for continuous flow
        const oldest = polaroids.shift();
        if (oldest && container && oldest.element.parentNode) {
          container.removeChild(oldest.element);
        }
        polaroids.push(createPolaroidElement(ringX, ringY));
      }
      spawnTimer = 0;
    }
  }
  
  lastMouseX = mouseX;
  lastMouseY = mouseY;
  wasMouseMoving = isMoving;
}

function animate() {
  updatePolaroids();
  requestAnimationFrame(animate);
}

// Event handlers
function attachEventListeners() {
  if (typeof window === 'undefined') return;

  const mouseMoveHandler = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };

  const mouseEnterHandler = (e: MouseEvent) => {
    // Initialize mouse position when entering the page
    mouseX = e.clientX;
    mouseY = e.clientY;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  };

  const touchMoveHandler = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      mouseX = touch.clientX;
      mouseY = touch.clientY;
    }
  };

  const touchStartHandler = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      mouseX = touch.clientX;
      mouseY = touch.clientY;
      lastMouseX = mouseX;
      lastMouseY = mouseY;
    }
  };

  document.addEventListener("mousemove", mouseMoveHandler);
  document.addEventListener("mouseenter", mouseEnterHandler);
  document.addEventListener("touchmove", touchMoveHandler, { passive: false });
  document.addEventListener("touchstart", touchStartHandler, { passive: true });
}

// Main initialization function
export async function initPolaroidCursor() {
  if (typeof window === 'undefined') return;
  
  if (polaroidInitialized) {
    console.log('Polaroid cursor already initialized');
    return;
  }

  console.log('Initializing polaroid cursor effect...');

  // Create container for polaroids
  container = document.createElement('div');
  container.id = 'polaroid-container';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 1000;
  `;
  
  document.body.appendChild(container);

  // Initialize mouse position to center, but will be updated on first mouse move
  mouseX = window.innerWidth / 2;
  mouseY = window.innerHeight / 2;
  lastMouseX = mouseX;
  lastMouseY = mouseY;

  // Get actual mouse position if available
  document.addEventListener('mousemove', (e) => {
    if (mouseX === window.innerWidth / 2 && mouseY === window.innerHeight / 2) {
      // First mouse move - initialize properly
      mouseX = e.clientX;
      mouseY = e.clientY;
      lastMouseX = mouseX;
      lastMouseY = mouseY;
    }
  }, { once: true });

  // Attach event listeners immediately
  attachEventListeners();

  // Preload photos before starting the effect
  try {
    await preloadPhotos(photoList);
    photosLoaded = true;
  } catch (_) {
    photosLoaded = true; // don't block in case of unexpected errors
  }

  // Start animation loop only after photos are loaded
  animate();

  polaroidInitialized = true;
  console.log('Polaroid cursor effect initialized successfully!');
}

// Cleanup function
export function cleanupPolaroidCursor() {
  if (container && container.parentNode) {
    document.body.removeChild(container);
  }
  
  polaroids.forEach(polaroid => {
    if (polaroid.element.parentNode) {
      polaroid.element.parentNode.removeChild(polaroid.element);
    }
  });
  
  polaroids = [];
  container = null;
  polaroidInitialized = false;
}
