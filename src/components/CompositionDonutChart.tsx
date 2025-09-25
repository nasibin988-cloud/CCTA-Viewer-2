import React from 'react';
import styles from './CompositionDonutChart.module.css';
import { formatNumber } from '@/lib/compute';

interface Props {
  lrnc: number;
  ncp: number;
  cp: number;
  size?: number;
  strokeWidth?: number;
}

const CompositionDonutChart: React.FC<Props> = ({ lrnc, ncp, cp, size = 140, strokeWidth = 20 }) => {
  const total = lrnc + ncp + cp;
  const nonCalcifiedOnly = ncp; // Use the direct NCP value for the pink/red part

  if (total === 0) {
    return (
        <div className={styles.wrapper}>
            <div className={styles.chartContainer} style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle cx={size/2} cy={size/2} r={size/2 - strokeWidth/2} strokeWidth={strokeWidth} stroke="var(--line)" fill="rgba(0,0,0,0.2)" />
                </svg>
                <div className={styles.centerText}>No Plaque</div>
            </div>
        </div>
    );
  }

  const lrncPct = (lrnc / total);
  const ncpOnlyPct = (nonCalcifiedOnly / total);
  const cpPct = (cp / total);

  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const cpDash = cpPct * circumference;
  const ncpOnlyDash = ncpOnlyPct * circumference;
  const lrncDash = lrncPct * circumference;

  const cpOffset = 0;
  const ncpOnlyOffset = cpDash;
  const lrncOffset = cpDash + ncpOnlyDash;

  const createArc = (dash: number, offset: number, color: string) => {
    if (dash <= 0) return null;
    return (
      <circle
        className={styles.arc}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        stroke={color}
        fill="transparent"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
      />
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.chartContainer} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.svg}>
          {/* Background circle */}
          <circle cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} stroke="var(--line)" fill="rgba(0,0,0,0.2)" />
          {/* Data Arcs */}
          {createArc(cpDash, cpOffset, '#C0C0C0')}
          {createArc(ncpOnlyDash, ncpOnlyOffset, '#F08080')}
          {createArc(lrncDash, lrncOffset, 'var(--risk-red)')}
        </svg>
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span style={{ backgroundColor: '#C0C0C0' }}></span>
          Calcified ({formatNumber(cpPct * 100, 0)}%)
        </div>
        <div className={styles.legendItem}>
          <span style={{ backgroundColor: '#F08080' }}></span>
          Non-Calcified ({formatNumber(ncpOnlyPct * 100, 0)}%)
        </div>
        <div className={styles.legendItem}>
          <span style={{ backgroundColor: 'var(--risk-red)' }}></span>
          LRNC ({formatNumber(lrncPct * 100, 0)}%)
        </div>
      </div>
    </div>
  );
};

export default CompositionDonutChart;