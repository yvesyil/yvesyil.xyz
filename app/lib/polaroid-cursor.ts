// Polaroid Cursor Effect
// Creates polaroid photos that follow mouse movement

let polaroidInitialized = false;
let container: HTMLDivElement | null = null;
let polaroids: PolaroidElement[] = [];
let mouseX = 0;
let mouseY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let spawnTimer = 0; // Timer for consistent spawning
let isMouseMoving = false;

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

// All available photos - only from public/photos/
const photoList = [
  '/photos/AStreetInHaarlem.jpg',
  '/photos/Autopark.jpg',
  '/photos/DeBurcht.jpg',
  '/photos/SAIL.jpg',
  '/photos/SintBonifatiuskerk.jpg',
];

const config = {
  maxPolaroids: 20, // Higher limit to prevent pauses
  polaroidLife: 120, // Shorter life so photos cycle faster
  spawnInterval: 4, // Spawn every 4 frames (15 times per second)
  fadeOutDuration: 30, // Faster fade for quicker turnover
  minMovementThreshold: 1, // Lower threshold
  polaroidSize: 140, // Bigger photos
};

function getRandomPhoto(): string {
  return photoList[Math.floor(Math.random() * photoList.length)];
}

function createPolaroidElement(x: number, y: number): PolaroidElement {
  const element = document.createElement('div');
  const image = getRandomPhoto();
  
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
    width: ${config.polaroidSize}px;
    height: ${config.polaroidSize * 1.2}px;
    pointer-events: none;
    z-index: 1000;
    transform: translate(-50%, -50%) rotate(${rotation}deg) scale(${scale});
    transition: none;
  `;
  
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
  
  // Debug and simplified spawning
  const dx = mouseX - lastMouseX;
  const dy = mouseY - lastMouseY;
  const movement = Math.sqrt(dx * dx + dy * dy);
  
  // Always increment timer (for debugging)
  spawnTimer++;
  
  // Debug logging
  if (spawnTimer % 60 === 0) {
    console.log(`Mouse: ${mouseX}, ${mouseY}, Movement: ${movement.toFixed(2)}, Polaroids: ${polaroids.length}`);
  }
  
  // Continuous spawning logic - remove limit check for smooth flow
  if (movement > config.minMovementThreshold) {
    if (spawnTimer >= config.spawnInterval) {
      // Always spawn when moving, regardless of current count
      if (polaroids.length < config.maxPolaroids) {
        console.log('Spawning polaroid!');
        const spawnX = mouseX + (Math.random() - 0.5) * 50;
        const spawnY = mouseY + (Math.random() - 0.5) * 50;
        polaroids.push(createPolaroidElement(spawnX, spawnY));
      } else {
        // Remove oldest polaroid and add new one for continuous flow
        const oldest = polaroids.shift();
        if (oldest && container && oldest.element.parentNode) {
          container.removeChild(oldest.element);
        }
        console.log('Replacing oldest polaroid!');
        const spawnX = mouseX + (Math.random() - 0.5) * 50;
        const spawnY = mouseY + (Math.random() - 0.5) * 50;
        polaroids.push(createPolaroidElement(spawnX, spawnY));
      }
      spawnTimer = 0;
    }
  }
  
  // Don't reset timer when not moving - let it keep counting
  
  lastMouseX = mouseX;
  lastMouseY = mouseY;
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
export function initPolaroidCursor() {
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

  // Attach event listeners
  attachEventListeners();
  
  // Start animation loop
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
