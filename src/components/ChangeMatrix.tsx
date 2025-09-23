// src/components/ChangeMatrix.tsx
import React, { useMemo, useState } from 'react';
import { CctaReport, Segment } from '@/types/ccta';
import styles from './ChangeMatrix.module.css';
import { 
    getStenosisColor, getPavColor, getHrpColor, getLrncVolumeColor, 
    getNcpVolumeColor, getCpVolumeColor 
} from '@/lib/thresholds';
import { formatNumber } from '@/lib/compute';

interface ChangeMatrixProps {
    currentReport: CctaReport;
    priorReport: CctaReport;
}

type DisplayMode = 'absolute' | 'percentage';
const SEGMENT_ORDER: number[] = [5, 11, 13, 15, 18, 12, 14, 6, 7, 9, 10, 8, 1, 2, 3, 4, 16, 17];
const SEGMENT_NAMES: { [key: number]: string } = {
    5: "LM", 11: "pLCx", 13: "dLCx", 15: "L-PDA", 18: "Ramus", 12: "OM1", 14: "OM2",
    6: "pLAD", 7: "mLAD", 9: "D1", 10: "D2", 8: "dLAD", 1: "pRCA", 2: "mRCA",
    3: "dRCA", 4: "R-PDA", 16: "R-PLB", 17: "L-PLB"
};
const METRICS = ['Stenosis', 'Burden', 'HRP', 'LRNC_Volume', 'NCP_Volume', 'CP_Volume'] as const;
type Metric = typeof METRICS[number];

const getValue = (metric: Metric, segment?: Segment): number => {
    if (!segment) return 0;
    switch (metric) {
        case 'Stenosis': return segment.stenosis_pct;
        case 'Burden': return segment.pav_pct;
        case 'HRP': return segment.hrp.length;
        case 'LRNC_Volume': return segment.lrnc_mm3;
        case 'NCP_Volume': return segment.ncp_mm3;
        case 'CP_Volume': return segment.cp_mm3;
        default: return 0;
    }
};

const getAbsoluteRiskClass = (metric: Metric, value: number): string => {
    const colorVar = {
        'Stenosis': getStenosisColor(value),
        'Burden': getPavColor(value),
        'HRP': getHrpColor(value),
        'LRNC_Volume': getLrncVolumeColor(value),
        'NCP_Volume': getNcpVolumeColor(value),
        'CP_Volume': getCpVolumeColor(value),
    }[metric];

    switch (colorVar) {
        case '--risk-red': return styles.riskSevere;
        case '--risk-orange': return styles.riskModerate;
        case '--risk-yellow': return styles.riskMild;
        case '--risk-green': return styles.riskMinimal;
        default: return styles.riskNone;
    }
};

const getRelativeChangeIcon = (change: number): React.ReactElement => {
    if (Math.abs(change) < 1e-6) return <span className={styles.stable}>–</span>;
    if (change > 0) return <span className={styles.worsened}>▲</span>;
    return <span className={styles.improved}>▼</span>;
};


export const ChangeMatrix: React.FC<ChangeMatrixProps> = ({ currentReport, priorReport }) => {
    const [displayMode, setDisplayMode] = useState<DisplayMode>('absolute');
    const currentSegments = useMemo(() => new Map(currentReport.vessels.flatMap(v => v.segments).map(s => [s.segId, s])), [currentReport]);
    const priorSegments = useMemo(() => new Map(priorReport.vessels.flatMap(v => v.segments).map(s => [s.segId, s])), [priorReport]);

    return (
        <div className={styles.matrixContainer}>
            <div className={styles.toggleContainer}>
                <span>Show Change:</span>
                <button onClick={() => setDisplayMode('absolute')} className={displayMode === 'absolute' ? styles.activeToggle : styles.toggle}>
                    Absolute
                </button>
                <button onClick={() => setDisplayMode('percentage')} className={displayMode === 'percentage' ? styles.activeToggle : styles.toggle}>
                    %
                </button>
            </div>
            <table className={styles.matrixTable}>
                <thead>
                    <tr>
                        <th className={styles.metricHeader}>Metric</th>
                        {SEGMENT_ORDER.map(segId => <th key={segId}>{SEGMENT_NAMES[segId] || segId}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {METRICS.map(metric => (
                        <tr key={metric}>
                            <td className={styles.metricHeader}>{metric.replace('_', ' ')}</td>
                            {SEGMENT_ORDER.map(segId => {
                                const currentSegment = currentSegments.get(segId);
                                const priorSegment = priorSegments.get(segId);
                                
                                const currentValue = getValue(metric, currentSegment);
                                const priorValue = getValue(metric, priorSegment);

                                const backgroundClass = getAbsoluteRiskClass(metric, currentValue);
                                const absoluteChange = currentValue - priorValue;
                                const icon = getRelativeChangeIcon(absoluteChange);
                                
                                let valueText = '';
                                const noChange = Math.abs(absoluteChange) < 1e-6;

                                if (!noChange) {
                                    if (displayMode === 'absolute' || metric === 'HRP') {
                                        const sign = absoluteChange > 0 ? '+' : '';
                                        const decimals = (metric === 'Stenosis' || metric === 'HRP') ? 0 : 1;
                                        valueText = `${sign}${formatNumber(absoluteChange, decimals)}`;
                                    } else { // Percentage Mode
                                        if (priorValue === 0) {
                                            valueText = 'New'; // Handle new plaque appearance
                                        } else {
                                            const percentageChange = (absoluteChange / priorValue) * 100;
                                            const sign = percentageChange > 0 ? '+' : '';
                                            valueText = `${sign}${formatNumber(percentageChange, 0)}%`;
                                        }
                                    }
                                }

                                return (
                                    <td key={segId} className={backgroundClass}>
                                        <div className={styles.cellContent}>
                                            {icon}
                                            <span className={styles.valueText}>{valueText}</span>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};