'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const pageOrder = ['/', '/whoami', '/projects', '/writings', '/contact'];

export default function PageDots() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState(pathname);

  useEffect(() => {
    setCurrentPath(pathname);
  }, [pathname]);

  const handleDotClick = (targetPage: string) => {
    if (targetPage === currentPath) return;
    router.push(targetPage);
  };

  return (
    <div className="page-dots">
      {pageOrder.map((page, index) => (
        <div
          key={page}
          className={`dot ${currentPath === page ? 'active' : ''}`}
          data-page={page}
          title={getPageTitle(page)}
          onClick={() => handleDotClick(page)}
        />
      ))}
    </div>
  );
}

function getPageTitle(page: string): string {
  switch (page) {
    case '/': return 'Home';
    case '/whoami': return 'Who Am I?';
    case '/projects': return 'Projects';
    case '/writings': return 'Writings';
    case '/contact': return 'Contact';
    default: return '';
  }
}
