// src/components/PavlTriangleChart.tsx
import React from 'react';
import { getPavColor } from '@/lib/thresholds';
import styles from './PavlTriangleChart.module.css';

const BARS = 12;
const MAX_PAV = 25; // Scale runs from 0 to 25+

export const PavlTriangleChart: React.FC<{ pav: number }> = ({ pav }) => {
  // Determine how many bars should be active based on the PAV value
  const pavStage = pav > 0 ? Math.min(BARS - 1, Math.floor((pav / MAX_PAV) * (BARS - 1))) : -1;
  const color = getPavColor(pav);

  return (
    <div className={styles.container}>
      <div className={styles.barContainer}>
        {Array.from({ length: BARS }).map((_, i) => {
          const isActive = i <= pavStage;
          const colorVar = isActive ? color : '--risk-neutral-gray';
          return (
            <div
              key={i}
              className={styles.bar}
              style={{ 
                height: `${(i + 1) * (100 / BARS)}%`,
                backgroundColor: `var(${colorVar})`
              }}
            />
          );
        })}
      </div>
      <div className={styles.labels}>
        <span>0%</span>
        <span>{'>'}{MAX_PAV}%</span>
      </div>
    </div>
  );
};