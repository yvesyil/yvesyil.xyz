import { ReactNode } from 'react';
import styles from './WritingLayout.module.css';

interface WritingLayoutProps {
  children: ReactNode;
}

export default function WritingLayout({ children }: WritingLayoutProps) {
  return (
    <div className={styles.container}>
      {children}
    </div>
  );
}
