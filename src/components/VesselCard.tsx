// src/components/VesselCard.tsx

import React from 'react';
import { Vessel } from '@/types/ccta';
import { formatNumber } from '@/lib/compute';
import styles from './VesselCard.module.css';
import { DonutChart } from './DonutChart';

export const VesselCard: React.FC<{ vessel: Vessel; }> = ({ vessel }) => {
  const totalVolume = vessel.composition.lrnc_mm3 + vessel.composition.ncp_mm3 + vessel.composition.cp_mm3;

  return (
    <div className={styles.card}>
      <div className={styles.contentWrapper}>
        <div className={styles.leftContent}>
          <h3 className={styles.vesselTitle}>{vessel.id.replace('_', '+')} ({formatNumber(vessel.length_mm, 0)} mm)</h3>
          
          <div className={styles.compositionTable}>
            {/* The table header now has specific classes for each column */}
            <div className={styles.tableHeader}>
              <div className={styles.col1}>LRNC</div>
              <div className={styles.col2}>Non-Calcified</div>
              <div className={styles.col3}>Calcified</div>
              <div className={styles.col4}>Total</div>
            </div>
            {/* The table row also has specific classes for each column */}
            <div className={styles.tableRow}>
              <div className={styles.col1}>{formatNumber(vessel.composition.lrnc_mm3)}</div>
              <div className={styles.col2}>{formatNumber(vessel.composition.ncp_mm3)}</div>
              <div className={styles.col3}>{formatNumber(vessel.composition.cp_mm3)}</div>
              <div className={styles.col4}>{formatNumber(totalVolume)}</div>
            </div>
          </div>
        </div>

        <DonutChart pav={vessel.pav_pct} size={90} strokeWidth={11} />
      </div>
    </div>
  );
};