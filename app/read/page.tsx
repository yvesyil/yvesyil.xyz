'use client';

import Reader from '../components/Reader';

export default function ReadPage() {
  return (
    <main style={{
      width: '100%',
      height: '100vh',
      position: 'fixed',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Reader />
    </main>
  );
}
