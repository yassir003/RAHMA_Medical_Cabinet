import React from 'react';
import styles from './auth.module.css';
import { Logo } from '@/components/Logo';
import { AuthVisual } from '@/components/AuthVisual';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <div className={styles.leftSidebar}>
        <div className={styles.logoWrapper}>
          <Logo light={true} />
        </div>
        <div className={styles.formContainer}>
          {children}
        </div>
      </div>

      {/* Replaced inline right sidebar with the new component */}
      <AuthVisual />
    </div>
  );
}