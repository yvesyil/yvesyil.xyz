'use client';

import { ReactNode } from 'react';
import Navigation from './Navigation';

interface ContentProps {
  title?: string;
  next?: string;
  prev?: string;
  children: ReactNode;
}

export default function Content({ title, next, prev, children }: ContentProps) {

  return (
    <>
      <Navigation />
      <main className="content-navigation-enabled content-main">
        <div data-next={next} data-prev={prev} className="content-container">
          {title && <h1 className="section-title">{title}</h1>}
          <div className="section-body">{children}</div>
        </div>
      </main>
      
      <style jsx>{`
        .content-main {
          background-color: transparent;
          width: 100%;
          height: 100%;
          position: fixed;
          display: flex;
          justify-content: flex-start;
          align-items: flex-end;
          overflow: hidden;
          padding-left: 5rem;
          padding-right: 5rem;
        }

        .content-container {
          display: flex;
          align-items: left;
          justify-content: flex-start;
          flex-direction: column;
          width: 70vw;
          height: 70vh;
          position: relative;
          overflow: hidden;
        }

        .section-title {
          top: 0;
          position: relative;
          flex-shrink: 0;
          margin: 0;
        }

        .section-body {
          padding-left: 2rem;
          display: flex; 
          flex-direction: column; 
          justify-content: start;
          align-items: flex-start;
          position: relative;
          min-height: 400px;
          max-width: 100%;
          box-sizing: border-box;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .section-body::-webkit-scrollbar {
          display: none;
        }

        @media screen and (max-width: 900px) {
          .content-container {
            width: 80vw;
            height: 90vh;
          }
          
          .section-body {
            height: 75vh;
            min-height: 500px;
          }
        }

        @media (pointer: none), (pointer: coarse), (hover: none) {
          .content-main {
            padding-left: 4rem;
            padding-right: 3rem;
          }
          
          .content-container {
            width: 90vw;
            height: 85vh;
            max-height: 85vh;
          }
          
          .section-body {
            height: 70vh;
            max-height: 70vh;
            min-height: unset;
            overflow-y: auto;
          }
        }
      `}</style>
    </>
  );
}