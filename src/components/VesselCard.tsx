// src/components/VesselCard.tsx

import React from 'react';
import { Vessel } from '@/types/ccta';
import { formatNumber } from '@/lib/compute';
import styles from './VesselCard.module.css';
import { PavlTriangleChart } from './PavlTriangleChart';
import { getGlobalTpvColor, getPavColor } from '@/lib/thresholds';

export const VesselCard: React.FC<{ vessel: Vessel; isProminent?: boolean; }> = ({ vessel, isProminent }) => {
  const totalVolume = vessel.composition.lrnc_mm3 + vessel.composition.ncp_mm3 + vessel.composition.cp_mm3;
  const cardClass = isProminent ? `${styles.card} ${styles.prominent}` : styles.card;
  const vesselName = vessel.id === 'WHOLE_HEART' ? 'Whole Heart' : vessel.id.replace('_', '+');

  const wholeHeartTpvColor = vessel.id === 'WHOLE_HEART' ? `var(${getGlobalTpvColor(totalVolume)})` : undefined;
  const wholeHeartPavColor = vessel.id === 'WHOLE_HEART' ? `var(${getPavColor(vessel.pav_pct)})` : undefined;

  return (
    <div className={cardClass}>
      <div className={styles.topRow}>
        <h3 className={styles.vesselTitle}>
          {vesselName}
          {vessel.id !== 'WHOLE_HEART' && ` (${formatNumber(vessel.length_mm, 0)} mm)`}
        </h3>
        <div className={styles.pavChartWrapper}>
          <PavlTriangleChart pav={vessel.pav_pct} />
          <div className={styles.pavValue}>
            PAV = <span className={styles.pavValueNumber} style={{ color: wholeHeartPavColor }}>{formatNumber(vessel.pav_pct, 1)}%</span>
          </div>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.metric}>
          <div className={styles.label}>LRNCV</div>
          <div className={styles.value}>{formatNumber(vessel.composition.lrnc_mm3)}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.label}>NCPV</div>
          <div className={styles.value}>{formatNumber(vessel.composition.ncp_mm3)}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.label}>CPV</div>
          <div className={styles.value}>{formatNumber(vessel.composition.cp_mm3)}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.label}>TPV</div>
          <div className={styles.value} style={{ color: wholeHeartTpvColor }}>{formatNumber(totalVolume)}</div>
        </div>
      </div>
    </div>
  );
};