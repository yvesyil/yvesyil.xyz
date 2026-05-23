import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { fadeOutThen } from '../lib/navigation';

const pageOrder = ['/', '/whoami', '/projects', '/writings', '/contact'];

export default function PageDots() {
  const navigate = useNavigate();
  const pathname = useLocation({ select: (loc) => loc.pathname });
  const [currentPath, setCurrentPath] = useState(pathname);

  useEffect(() => {
    setCurrentPath(pathname);
  }, [pathname]);

  // Hide dots on writing detail pages (e.g., /writings/1)
  if (pathname && /^\/writings\/[^/]+/.test(pathname)) {
    return null;
  }

  const handleDotClick = (targetPage: string) => {
    if (targetPage === currentPath) return;
    fadeOutThen(() => navigate({ to: targetPage }));
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
