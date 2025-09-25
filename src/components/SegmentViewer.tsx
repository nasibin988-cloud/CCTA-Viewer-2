// src/components/SegmentViewer.tsx
import React from 'react';
import styles from './SegmentViewer.module.css';

export const SegmentViewer: React.FC = () => {
  return (
    <div className={styles.viewerContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className={styles.segmentCell}>
          {/* Content for each cell will go here later */}
        </div>
      ))}
    </div>
  );
};