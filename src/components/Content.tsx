import { ReactNode } from 'react';
import Navigation from './Navigation';
import styles from './Content.module.css';

interface ContentProps {
  title?: string;
  titleClassName?: string;
  next?: string;
  prev?: string;
  children: ReactNode;
}

export default function Content({ title, titleClassName, next, prev, children }: ContentProps) {
  return (
    <>
      <Navigation />
      <main className={`content-navigation-enabled ${styles.contentMain}`}>
        <div data-next={next} data-prev={prev} className={styles.contentContainer}>
          {title && <h1 className={`${styles.sectionTitle} ${titleClassName ?? ''}`}>{title}</h1>}
          <div className={styles.sectionBody}>{children}</div>
        </div>
      </main>
    </>
  );
}
