import React from 'react';
import Image from 'next/image';
import styles from './AuthVisual.module.css';

export const AuthVisual = () => {
  return (
    <div className={styles.rightSidebar}>
      {/* Decorative lines / circles */}
      <div className={`${styles.decor} ${styles.decor1}`} />
      <div className={`${styles.decor} ${styles.decor2}`} />
      <div className={`${styles.decor} ${styles.decor3}`} />

      <div className={styles.imageWrapper}>
        <Image
          src="/doctor-handshake.png"
          alt="Doctor greeting patient"
          fill
          className={styles.image}
          priority
        />
      </div>
    </div>
  );
};