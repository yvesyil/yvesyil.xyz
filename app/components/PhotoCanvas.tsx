'use client';

import { useEffect } from 'react';

export default function PhotoCanvas() {
  useEffect(() => {
    // Import and initialize the polaroid cursor effect
    const initPolaroid = async () => {
      const { initPolaroidCursor } = await import('../lib/polaroid-cursor');
      initPolaroidCursor();
    };

    initPolaroid();
    
    // Cleanup on unmount
    return () => {
      import('../lib/polaroid-cursor').then(({ cleanupPolaroidCursor }) => {
        cleanupPolaroidCursor();
      });
    };
  }, []);

  // Return null since polaroids are added directly to document.body
  return null;
}
