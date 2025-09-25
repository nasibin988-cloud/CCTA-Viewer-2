// src/components/SegmentViewer.tsx
import React from 'react';
import styles from './SegmentViewer.module.css';
import { Segment } from '@/types/ccta';
import { getFfrctColor } from '@/lib/thresholds';
import { PavlTriangleChart } from './PavlTriangleChart';
import CompositionDonutChart from './CompositionDonutChart';
import { formatNumber } from '@/lib/compute';
import SegmentSampleSVG from './Segment_Sample.svg';

export const SegmentViewer: React.FC<{ selectedSegment: Segment | null }> = ({ selectedSegment }) => {

  if (!selectedSegment) {
    return (
      <div className={styles.placeholderContainer}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={styles.segmentCell}>
            Click a segment to view details
          </div>
        ))}
      </div>
    );
  }

  const tpv = selectedSegment.lrnc_mm3 + selectedSegment.ncp_mm3 + selectedSegment.cp_mm3;
  // Per the image, "Non-Calcified" is the portion of NCP that is NOT LRNC
  const nonCalcifiedForDonut = selectedSegment.ncp_mm3 - selectedSegment.lrnc_mm3;

  return (
    <div className={styles.viewerContainer}>
        <h2 className={styles.title}>{selectedSegment.name} (Seg {selectedSegment.segId})</h2>
        
        <div className={styles.ffrBar}>
            <div className={styles.ffrValueTop}>{formatNumber(selectedSegment.ffrct_pullback?.[0] ?? 0, 2)}</div>
            <div className={styles.ffrSpectrum}>
                {(selectedSegment.ffrct_pullback ?? []).map((ffrVal, idx) => (
                    <div key={idx} className={styles.ffrTick} style={{ backgroundColor: getFfrctColor(ffrVal) }}/>
                ))}
            </div>
            <div className={styles.ffrValueBottom}>{formatNumber(selectedSegment.ffrct_pullback?.[selectedSegment.ffrct_pullback.length - 1] ?? 0, 2)}</div>
        </div>

        <div className={styles.vesselDisplay}>
           <div className={styles.vesselImageWrapper}>
              <SegmentSampleSVG />
            </div>
        </div>

        <div className={styles.metricsGrid}>
            <div className={styles.topMetrics}>
                <div className={styles.metricCard}>
                    <PavlTriangleChart pav={selectedSegment.pav_pct} />
                    <div className={styles.metricValue}>PAV = {formatNumber(selectedSegment.pav_pct, 1)}%</div>
                </div>
                <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>TPV</div>
                    <div className={styles.metricValueLarge}>{formatNumber(tpv, 1)} <span className={styles.unit}>mm³</span></div>
                </div>
            </div>

            <div className={styles.compositionCard}>
                <div className={styles.metricLabel}>Plaque Composition</div>
                <CompositionDonutChart lrnc={selectedSegment.lrnc_mm3} ncp={nonCalcifiedForDonut} cp={selectedSegment.cp_mm3} />
            </div>

            <div className={styles.bottomMetrics}>
                <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Plaque Length</div>
                    <div className={styles.metricValueLarge}>{formatNumber(selectedSegment.plaque_length_mm, 1)} <span className={styles.unit}>mm</span></div>
                </div>
                <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Max Stenosis</div>
                    <div className={styles.metricValueLarge}>{formatNumber(selectedSegment.stenosis_pct, 0)}<span className={styles.unit}>%</span></div>
                </div>
            </div>
        </div>
    </div>
  );
};