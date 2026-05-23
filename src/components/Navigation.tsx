import { useEffect } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { debounce } from '../lib/utils';
import { fadeOutThen } from '../lib/navigation';

const pageOrder = ['/', '/whoami', '/projects', '/writings', '/contact'];

// Module-level so it persists across Navigation remounts (Content remounts
// on every route change, which would otherwise reset gesture state and let
// trailing touchpad inertia trigger a second navigation).
let wheelLastEventTime = 0;
let wheelIsNavigating = false;
const GESTURE_IDLE_MS = 30;

export default function Navigation() {
  const navigate = useNavigate();
  const pathname = useLocation({ select: (loc) => loc.pathname });

  useEffect(() => {
    let currentIndex = pageOrder.indexOf(pathname);
    if (currentIndex === -1) currentIndex = 0;

    let isNavigating = false;
    let lastNavigationTime = 0;
    const NAVIGATION_COOLDOWN = 250;

    function shouldEnableNavigation(): boolean {
      const contentElement = document.querySelector('.content-navigation-enabled');
      return contentElement !== null;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!shouldEnableNavigation()) return;

      // Always preventDefault on Content pages so the document never scrolls
      event.preventDefault();

      // Skip noise events entirely — they must NOT update the gesture timer,
      // otherwise the real swipe events get blocked right after them.
      if (Math.abs(event.deltaY) < 4 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        return;
      }

      const now = Date.now();
      const idleSinceLastWheel = now - wheelLastEventTime;
      wheelLastEventTime = now;

      // Mid-fade — absorb
      if (wheelIsNavigating) return;

      // Wheel events arriving inside the idle window are still the same
      // swipe (inertia or continuous scroll). Block them.
      if (idleSinceLastWheel < GESTURE_IDLE_MS) return;

      const targetIndex = event.deltaY > 0
        ? (currentIndex + 1) % pageOrder.length
        : (currentIndex - 1 + pageOrder.length) % pageOrder.length;
      const targetPage = pageOrder[targetIndex];

      wheelIsNavigating = true;
      isNavigating = true;
      lastNavigationTime = now;

      try {
        fadeOutThen(() => navigate({ to: targetPage }));
        currentIndex = targetIndex;
      } catch (error) {
        console.error('Navigation error:', error);
      }

      setTimeout(() => {
        wheelIsNavigating = false;
        isNavigating = false;
      }, 300);
    };

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
        fadeOutThen(() => navigate({ to: targetPage }));
        currentIndex = targetIndex;
      } catch (error) {
        console.error('Navigation error:', error);
      }

      setTimeout(() => {
        isNavigating = false;
      }, 150);
    };

    // Touch navigation
    let touchStartY = 0;
    let touchStartX = 0;
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
      const touchEndY = touch.screenY;
      const touchEndX = touch.screenX;
      
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
        fadeOutThen(() => navigate({ to: targetPage }));
        currentIndex = targetIndex;
      } catch (error) {
        console.error('Navigation error:', error);
      }

      setTimeout(() => {
        isNavigating = false;
      }, 150);
    }, 25);

    if (shouldEnableNavigation()) {
      document.addEventListener('wheel', handleWheel, { passive: false });
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [navigate, pathname]);

  return null;
}
