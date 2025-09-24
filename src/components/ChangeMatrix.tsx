import React, { useMemo, useState } from 'react';
import { CctaReport, Segment } from '@/types/ccta';
import styles from './ChangeMatrix.module.css';
import { formatNumber } from '@/lib/compute';

interface ChangeMatrixProps {
    currentReport: CctaReport;
    priorReport: CctaReport;
}

type DisplayMode = 'annualized' | 'absolute' | 'percentage';

const SEGMENT_ORDER: number[] = [
    0, // All Vessel
    5, 6, 7, 8, 9, 10, 17, // LM & LAD chain
    11, 12, 13, 14, 18, 15, // LCx chain
    1, 2, 3, 4, 16 // RCA chain
];

const SEGMENT_NAMES: { [key: number]: string } = {
    0: "All Vessel", 5: "LM", 6: "pLAD", 7: "mLAD", 8: "dLAD", 9: "D1", 10: "D2", 17: "Ramus",
    11: "pLCx", 12: "OM1", 13: "dLCx", 14: "OM2", 18: "L-PLB", 15: "L-PDA",
    1: "pRCA", 2: "mRCA", 3: "dRCA", 4: "R-PDA", 16: "R-PLB"
};

const METRICS = ['LRNC_Volume', 'NCP_Volume', 'CP_Volume', 'TPV', 'PAV', 'FFRct', 'Stenosis'] as const;
type Metric = typeof METRICS[number];

const isHighRisk = (metric: Metric, value: number): boolean => {
    if (value === 0) return false;
    switch (metric) {
        case 'Stenosis': return value >= 50;
        case 'PAV': return value > 5;
        case 'FFRct': return value <= 0.75;
        case 'LRNC_Volume': return value >= 15;
        case 'NCP_Volume': return value >= 50;
        case 'CP_Volume': return value >= 150;
        case 'TPV': return value >= 75;
        default: return false;
    }
};

export const ChangeMatrix: React.FC<ChangeMatrixProps> = ({ currentReport, priorReport }) => {
    const [displayMode, setDisplayMode] = useState<DisplayMode>('absolute');
    
    const yearsBetweenScans = useMemo(() => {
        const currentDate = new Date(currentReport.patient.studyDate).getTime();
        const priorDate = new Date(priorReport.patient.studyDate).getTime();
        if (!currentDate || !priorDate) return 1;
        const diffInYears = (currentDate - priorDate) / (1000 * 60 * 60 * 24 * 365.25);
        return diffInYears > 0 ? diffInYears : 1;
    }, [currentReport, priorReport]);

    const allCurrentSegments = useMemo(() => currentReport.vessels.flatMap(v => v.segments), [currentReport]);
    const allPriorSegments = useMemo(() => priorReport.vessels.flatMap(v => v.segments), [priorReport]);
    
    const getValue = (metric: Metric, segId: number, reportType: 'current' | 'prior'): number => {
        const report = reportType === 'current' ? currentReport : priorReport;
        const allSegments = reportType === 'current' ? allCurrentSegments : allPriorSegments;
        
        if (segId !== 0) {
            const segment = allSegments.find(s => s.segId === segId);
            if (!segment) return 0;
            switch (metric) {
                case 'Stenosis': return segment.stenosis_pct;
                case 'PAV': return segment.pav_pct;
                case 'FFRct': return segment.ffrct ?? 0;
                case 'LRNC_Volume': return segment.lrnc_mm3;
                case 'NCP_Volume': return segment.ncp_mm3;
                case 'CP_Volume': return segment.cp_mm3;
                case 'TPV': return segment.lrnc_mm3 + segment.ncp_mm3 + segment.cp_mm3;
                default: return 0;
            }
        } else {
            switch (metric) {
                case 'Stenosis': return Math.max(0, ...allSegments.map(s => s.stenosis_pct));
                case 'FFRct': const ffrcts = allSegments.map(s => s.ffrct ?? 1.0).filter(f => f > 0); return ffrcts.length > 0 ? Math.min(...ffrcts) : 0;
                case 'PAV': return report.global.pav_pct;
                case 'LRNC_Volume': return allSegments.reduce((sum, s) => sum + s.lrnc_mm3, 0);
                case 'NCP_Volume': return allSegments.reduce((sum, s) => sum + s.ncp_mm3, 0);
                case 'CP_Volume': return allSegments.reduce((sum, s) => sum + s.cp_mm3, 0);
                case 'TPV': return report.global.tpv_mm3;
                default: return 0;
            }
        }
    };

    return (
        <div className={styles.matrixContainer}>
            <div className={styles.toggleContainer}>
                <span>Show Change:</span>
                <div className={styles.buttonGroup}>
                    <button onClick={() => setDisplayMode('absolute')} className={displayMode === 'absolute' ? styles.activeToggle : styles.toggle}>
                        Absolute
                    </button>
                    <button onClick={() => setDisplayMode('percentage')} className={displayMode === 'percentage' ? styles.activeToggle : styles.toggle}>
                        Percentage
                    </button>
                    <button onClick={() => setDisplayMode('annualized')} className={displayMode === 'annualized' ? styles.activeToggle : styles.toggle}>
                        Annualized
                    </button>
                </div>
            </div>
            <table className={styles.matrixTable}>
                <thead>
                    <tr>
                        <th className={styles.metricHeader}>Metric</th>
                        {SEGMENT_ORDER.map(segId => {
                             const segment = allCurrentSegments.find(s => s.segId === segId);
                             if (segId !== 0 && !segment) return null;
                             return <th key={segId}>{SEGMENT_NAMES[segId] || segId}</th>
                        })}
                    </tr>
                </thead>
                <tbody>
                    {METRICS.map(metric => (
                        <tr key={metric}>
                            <td className={styles.metricHeader}>{metric.replace('_', ' ')}</td>
                            {SEGMENT_ORDER.map(segId => {
                                const currentSegment = allCurrentSegments.find(s => s.segId === segId);
                                if (segId !== 0 && !currentSegment) return null;

                                const currentValue = getValue(metric, segId, 'current');
                                const priorValue = getValue(metric, segId, 'prior');
                                
                                const absoluteChange = currentValue - priorValue;
                                const isFavorable = (metric === 'FFRct' || metric === 'CP_Volume') ? absoluteChange > 0 : absoluteChange < 0;

                                let cellClass = styles.bgDefault;
                                if (Math.abs(currentValue) < 1e-6 && Math.abs(priorValue) < 1e-6) {
                                    cellClass = styles.bgStable;
                                } else if (Math.abs(absoluteChange) < 1e-6) {
                                    cellClass = styles.bgStablePositive;
                                } else if (isFavorable) {
                                    cellClass = styles.bgFavorable;
                                } else {
                                    cellClass = isHighRisk(metric, currentValue) 
                                        ? styles.bgUnfavorableHighRisk
                                        : styles.bgUnfavorableLowRisk;
                                }

                                let valueText = '–';
                                const noPriorData = Math.abs(priorValue) < 1e-6 && Math.abs(currentValue) > 1e-6;

                                if (cellClass !== styles.bgStable) {
                                    const sign = absoluteChange > 0 ? '+' : '';
                                    const decimals = (metric === 'Stenosis' || metric === 'PAV') ? 0 : (metric === 'FFRct' ? 2 : 1);
                                    
                                    if (displayMode === 'annualized') {
                                        const annualizedChange = absoluteChange / yearsBetweenScans;
                                        valueText = `${annualizedChange > 0 ? '+' : ''}${formatNumber(annualizedChange, decimals)}`;
                                    } else if (displayMode === 'absolute') {
                                        valueText = `${sign}${formatNumber(absoluteChange, decimals)}`;
                                    } else {
                                        if (noPriorData) {
                                            valueText = 'New';
                                        } else if (Math.abs(priorValue) < 1e-6) {
                                            valueText = '∞'; // Avoid division by zero
                                        }
                                        else {
                                            const percentageChange = (absoluteChange / priorValue) * 100;
                                            valueText = `${percentageChange > 0 ? '+' : ''}${formatNumber(percentageChange, 0)}%`;
                                        }
                                    }
                                }
                                
                                return (
                                    <td key={segId} className={cellClass}>
                                        <span>{valueText}</span>
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