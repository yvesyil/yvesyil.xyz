'use client';

import { ReactNode } from 'react';

interface WritingLayoutProps {
  children: ReactNode;
}

export default function WritingLayout({ children }: WritingLayoutProps) {
  return (
    <>
      <div className="container">
        {children}
      </div>
      
      <style jsx>{`
        .container {
          text-align: left;
          font-size: 1.5rem;
          padding: 4rem 2rem;
          box-sizing: border-box;
          max-width: 1500px;
          width: 100%;
          line-height: 1.6;
          background-color: transparent;
          min-height: 100vh;
          overflow-y: auto;
        }

        .container :global(h1) {
          text-align: center;
          margin-bottom: 2rem;
        }

        .container :global(h2) {
          margin-bottom: 1.5rem;
          margin-top: 2rem;
        }

        .container :global(p) {
          margin-bottom: 1.5rem;
        }

        .container :global(ul), .container :global(ol) {
          margin-bottom: 1.5rem;
          padding-left: 2rem;
        }

        .container :global(li) {
          margin-bottom: 0.5rem;
          color: var(--site-default);
          list-style: disc;
        }

        .container :global(code) {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: monospace;
        }

        .container :global(blockquote) {
          margin: 2rem 0;
          padding-left: 1.5rem;
          border-left: 3px solid var(--site-alt);
          font-style: italic;
          color: var(--site-light);
        }

        .container :global(img) {
          max-width: 100%;
          height: auto;
          margin: 1.5rem auto;
          display: block;
        }

        .container :global(br) {
          margin-bottom: 1rem;
        }

        @media screen and (max-width: 900px) {
          .container {
            padding: 2rem;
            font-size: 1.2rem;
          }
        }
      `}</style>
    </>
  );
}
