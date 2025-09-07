'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { debounce } from '../lib/utils';

const pageOrder = ['/', '/whoami', '/projects', '/writings', '/contact'];

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

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
        router.push(targetPage);
        currentIndex = targetIndex;
      } catch (error) {
        console.error('Navigation error:', error);
      }
      
      setTimeout(() => {
        isNavigating = false;
      }, 150);
    }, 30);

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
        router.push(targetPage);
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
        router.push(targetPage);
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
  }, [router, pathname]);

  return null;
}
