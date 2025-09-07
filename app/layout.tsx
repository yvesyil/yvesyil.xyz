import type { Metadata } from 'next';
import './styles/globals.css';
import PolaroidCursor from './components/FluidCanvas';
import PageDots from './components/PageDots';

export const metadata: Metadata = {
  title: 'Yves Yil',
  description: '❤️‍🔥',
  generator: 'Next.js',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  viewportFit: 'cover',
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/yana/regular.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/yana/italic.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/yana/bold.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        {/* Polaroid cursor effect */}
        <PolaroidCursor />
        
        <div className="page-content">
          {children}
        </div>
        
        {/* Page Navigation Dots */}
        <PageDots />
      </body>
    </html>
  );
}
