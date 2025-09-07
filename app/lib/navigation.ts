import { debounce } from './utils';

// Page navigation order
const pageOrder = ['/', '/whoami', '/projects', '/writings', '/contact'];

let currentIndex = 0;
let isNavigating = false;
let listenersAttached = false;
let lastNavigationTime = 0;
const NAVIGATION_COOLDOWN = 250;

// Function to check if current page should have scroll navigation
function shouldEnableNavigation(): boolean {
  if (typeof window === 'undefined') return false;
  const contentElement = document.querySelector('.content-navigation-enabled');
  return contentElement !== null;
}

// Function to update current index based on current path
function updateCurrentIndex(): void {
  if (typeof window === 'undefined') return;
  const currentPath = window.location.pathname;
  const index = pageOrder.indexOf(currentPath);
  currentIndex = index !== -1 ? index : 0;
}

// Navigation function using Next.js router
function navigateToPage(targetPage: string): void {
  if (typeof window === 'undefined') return;
  
  // Use Next.js client-side navigation
  window.location.href = targetPage;
}

// Handle wheel events for scroll navigation
const handleWheel = debounce(async (event: WheelEvent) => {
  if (isNavigating || !shouldEnableNavigation()) return;
  
  const now = Date.now();
  if (now - lastNavigationTime < NAVIGATION_COOLDOWN) return;
  
  event.preventDefault();
  
  let targetIndex: number;
  if (event.deltaY > 0) {
    targetIndex = (currentIndex + 1) % pageOrder.length;
  } else {
    targetIndex = (currentIndex - 1 + pageOrder.length) % pageOrder.length;
  }
  
  const targetPage = pageOrder[targetIndex];
  
  isNavigating = true;
  lastNavigationTime = now;
  
  try {
    navigateToPage(targetPage);
  } catch (error) {
    console.error('Navigation error:', error);
  }
  
  setTimeout(() => {
    isNavigating = false;
  }, 150);
}, 30);

// Handle touch events for mobile
let touchStartY = 0;
let touchEndY = 0;
let touchStartX = 0;
let touchEndX = 0;
let touchStartTime = 0;

const handleTouchStart = (event: TouchEvent): void => {
  if (!shouldEnableNavigation()) return;
  
  const touch = event.changedTouches[0];
  touchStartY = touch.screenY;
  touchStartX = touch.screenX;
  touchStartTime = Date.now();
};

const handleTouchEnd = debounce(async (event: TouchEvent) => {
  if (isNavigating || !shouldEnableNavigation()) return;
  
  const now = Date.now();
  if (now - lastNavigationTime < NAVIGATION_COOLDOWN) return;
  
  const touch = event.changedTouches[0];
  touchEndY = touch.screenY;
  touchEndX = touch.screenX;
  
  const deltaY = touchStartY - touchEndY;
  const deltaX = Math.abs(touchStartX - touchEndX);
  const touchDuration = Date.now() - touchStartTime;
  
  if (Math.abs(deltaY) < 30 || 
      deltaX > Math.abs(deltaY) || 
      touchDuration > 500 || 
      touchDuration < 30) {
    return;
  }
  
  event.preventDefault();
  
  let targetIndex: number;
  if (deltaY > 0) {
    targetIndex = (currentIndex + 1) % pageOrder.length;
  } else {
    targetIndex = (currentIndex - 1 + pageOrder.length) % pageOrder.length;
  }
  
  const targetPage = pageOrder[targetIndex];
  
  isNavigating = true;
  lastNavigationTime = now;
  
  try {
    navigateToPage(targetPage);
  } catch (error) {
    console.error('Navigation error:', error);
  }
  
  setTimeout(() => {
    isNavigating = false;
  }, 150);
}, 25);

// Handle keyboard navigation
const handleKeyDown = async (event: KeyboardEvent): Promise<void> => {
  if (isNavigating || !shouldEnableNavigation()) return;
  
  const now = Date.now();
  if (now - lastNavigationTime < NAVIGATION_COOLDOWN) return;
  
  let targetIndex: number;
  switch(event.key) {
    case 'ArrowDown':
    case ' ':
      event.preventDefault();
      targetIndex = (currentIndex + 1) % pageOrder.length;
      break;
    case 'ArrowUp':
      event.preventDefault();
      targetIndex = (currentIndex - 1 + pageOrder.length) % pageOrder.length;
      break;
    default:
      return;
  }
  
  const targetPage = pageOrder[targetIndex];
  
  isNavigating = true;
  lastNavigationTime = now;
  
  try {
    navigateToPage(targetPage);
  } catch (error) {
    console.error('Navigation error:', error);
  }
  
  setTimeout(() => {
    isNavigating = false;
  }, 150);
};

// Function to attach event listeners
function attachListeners(): void {
  if (typeof document === 'undefined' || listenersAttached) return;
  
  document.addEventListener('wheel', handleWheel, { passive: false });
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
  document.addEventListener('keydown', handleKeyDown);
  
  listenersAttached = true;
}

// Function to remove event listeners
function removeListeners(): void {
  if (typeof document === 'undefined' || !listenersAttached) return;
  
  document.removeEventListener('wheel', handleWheel);
  document.removeEventListener('touchstart', handleTouchStart);
  document.removeEventListener('touchend', handleTouchEnd);
  document.removeEventListener('keydown', handleKeyDown);
  
  listenersAttached = false;
}

// Function to initialize navigation
export function initializeNavigation(): void {
  if (typeof window === 'undefined') return;
  
  updateCurrentIndex();
  
  if (shouldEnableNavigation()) {
    attachListeners();
  } else {
    removeListeners();
  }
}

// Clean up function
export function cleanupNavigation(): void {
  removeListeners();
}
