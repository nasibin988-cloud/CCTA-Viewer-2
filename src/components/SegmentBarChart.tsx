// src/components/SegmentBarChart.tsx
import React, { useState, useMemo } from 'react';
import { CctaReport, PlaqueVolumeMode, Segment } from '@/types/ccta';
import styles from './SegmentBarChart.module.css';
import {
    getStenosisColor, getHrpColor, getCompositionColor, getLrncVolumeColor,
    getNcpVolumeColor, getCpVolumeColor, getPavColor, RiskColorVar, CompositionColorVar
} from '@/lib/thresholds';
import { formatNumber } from '@/lib/compute';

type MapMode = "Stenosis" | "HRP" | "Composition" | "Burden";

// Define the order of segments for the X-axis
const SEGMENT_ORDER: number[] = [5, 11, 13, 15, 18, 12, 14, 6, 7, 9, 10, 8, 1, 2, 3, 4, 16, 17];
const SEGMENT_NAMES: { [key: number]: string } = {
    5: "LM", 11: "pLCx", 13: "dLCx", 15: "L-PDA", 18: "Ramus", 12: "OM1", 14: "OM2",
    6: "pLAD", 7: "mLAD", 9: "D1", 10: "D2", 8: "dLAD", 1: "pRCA", 2: "mRCA",
    3: "dRCA", 4: "R-PDA", 16: "R-PLB", 17: "L-PLB"
};


// Configuration for each chart mode
const CHART_CONFIG = {
    Stenosis: {
        title: "Stenosis (%)",
        max: 100,
        unit: '%',
        thresholds: [
            { value: 25, label: "Mild" },
            { value: 50, label: "Moderate" },
            { value: 70, label: "Severe" },
        ]
    },
    Burden: {
        title: "Plaque Burden (PAV %)",
        max: 40,
        unit: '%',
        thresholds: [
            { value: 5, label: "Mild" },
            { value: 15, label: "Moderate" },
        ]
    },
    HRP: {
        title: "High-Risk Plaque Features",
        max: 2, // CHANGED: Max value for axis is now 2
        unit: '',
        thresholds: [
            { value: 1, label: "1 Feature" },
            // NOTE: The max value of 2 will be custom-labeled "≥2 Features"
        ]
    },
    LRNC_Volume: {
        title: "LRNC Volume (mm³)",
        max: 40,
        unit: ' mm³',
        thresholds: [
            { value: 5, label: "Moderate" },
            { value: 15, label: "High" },
            { value: 30, label: "Very High" },
        ]
    },
    NCP_Volume: {
        title: "NCP Volume (mm³)",
        max: 120,
        unit: ' mm³',
        thresholds: [
            { value: 20, label: "Moderate" },
            { value: 50, label: "High" },
            { value: 100, label: "Very High" },
        ]
    },
    CP_Volume: {
        title: "CP Volume (mm³)",
        max: 350,
        unit: ' mm³',
        thresholds: [
            { value: 50, label: "Moderate" },
            { value: 150, label: "High" },
            { value: 300, label: "Very High" },
        ]
    },
    Composition: {
        title: "Dominant Plaque Type",
        max: 1,
        unit: '',
        thresholds: []
    }
};

interface BarInfo {
    value: number;
    color: RiskColorVar | CompositionColorVar;
    label: string;
}

const ChartDisplay: React.FC<{
    report: CctaReport,
    mode: MapMode,
    compositionSubMode?: PlaqueVolumeMode
}> = ({ report, mode, compositionSubMode }) => {
    const allSegments = useMemo(() => report.vessels.flatMap(v => v.segments), [report]);
    const configKey = mode === 'Composition' && compositionSubMode ? compositionSubMode : mode;
    const config = CHART_CONFIG[configKey as keyof typeof CHART_CONFIG];

    const getBarInfo = (segment: Segment | undefined): BarInfo => {
        const noPlaqueInfo: BarInfo = { value: 0, color: '--risk-neutral-gray', label: '0' };
        if (!segment) return noPlaqueInfo;

        switch (configKey) {
            case 'Stenosis':
                return { value: segment.stenosis_pct, color: getStenosisColor(segment.stenosis_pct), label: formatNumber(segment.stenosis_pct, 0) };
            case 'Burden':
                return { value: segment.pav_pct, color: getPavColor(segment.pav_pct), label: formatNumber(segment.pav_pct, 1) };
            case 'HRP':
                return { value: segment.hrp.length, color: getHrpColor(segment.hrp.length), label: segment.hrp.join(', ') || '0' };
            case 'LRNC_Volume':
                return { value: segment.lrnc_mm3, color: getLrncVolumeColor(segment.lrnc_mm3), label: formatNumber(segment.lrnc_mm3, 1) };
            case 'NCP_Volume':
                return { value: segment.ncp_mm3, color: getNcpVolumeColor(segment.ncp_mm3), label: formatNumber(segment.ncp_mm3, 1) };
            case 'CP_Volume':
                return { value: segment.cp_mm3, color: getCpVolumeColor(segment.cp_mm3), label: formatNumber(segment.cp_mm3, 1) };
            case 'Composition':
                const hasPlaque = segment.ncp_mm3 > 0 || segment.cp_mm3 > 0;
                return {
                    value: hasPlaque ? 1 : 0,
                    color: getCompositionColor(segment.ncp_mm3, segment.cp_mm3),
                    label: hasPlaque ? (segment.ncp_mm3 >= segment.cp_mm3 ? 'NCP' : 'CP') : ''
                };
            default:
                return noPlaqueInfo;
        }
    };

    // ADDED: Custom label for the max y-axis tick
    const maxLabel = (configKey === 'HRP')
        ? '≥2 Features'
        : `${config.max}${config.unit.replace(' ', '')}`;

    return (
        <div className={styles.chartContainer}>
            <div className={styles.yAxis}>
                <div className={styles.yAxisLabel}>{config.title}</div>
                {config.thresholds.map(t => (
                    <div key={t.value} style={{ bottom: `${(t.value / config.max) * 100}%` }} className={styles.yAxisTick}>
                        {configKey === 'HRP' ? t.value : t.value}{config.unit.replace(' ', '')}
                    </div>
                ))}
                 <div style={{ bottom: '100%' }} className={styles.yAxisTick}>{maxLabel}</div>
                 <div style={{ bottom: '0%' }} className={styles.yAxisTick}>0</div>
            </div>

            <div className={styles.chartArea}>
                {config.thresholds.map(t => (
                    <div key={t.value} style={{ bottom: `${(t.value / config.max) * 100}%` }} className={styles.gridLine}></div>
                ))}

                <div className={styles.barsContainer}>
                    {SEGMENT_ORDER.map(segId => {
                        const segmentData = allSegments.find(s => s.segId === segId);
                        const { value, color, label } = getBarInfo(segmentData);
                        // CHANGED: For HRP, cap the value at the max for height calculation
                        const valueForHeight = configKey === 'HRP' ? Math.min(value, config.max) : value;
                        const height = Math.min(100, (valueForHeight / config.max) * 100);

                        return (
                            <div key={segId} className={styles.barWrapper}>
                                <div className={styles.valueLabel}>{label}</div>
                                <div className={styles.bar} style={{ height: `${height}%`, backgroundColor: `var(${color})` }}></div>
                                <div className={styles.segmentLabel}>{SEGMENT_NAMES[segId] || segId}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


export const SegmentBarChart: React.FC<{ report: CctaReport }> = ({ report }) => {
    const [mode, setMode] = useState<MapMode>("Stenosis");
    const [compositionSubMode, setCompositionSubMode] = useState<PlaqueVolumeMode | undefined>(undefined);

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Segment Analysis by Bar Chart</h2>
            <div className={styles.controls}>
                {(["Stenosis", "HRP", "Composition", "Burden"] as MapMode[]).map(m => (
                    <button
                        key={m}
                        onClick={() => {
                            setMode(m);
                            if (m !== 'Composition') {
                                setCompositionSubMode(undefined);
                            } else {
                                if (!compositionSubMode) setCompositionSubMode("LRNC_Volume");
                            }
                        }}
                        className={mode === m ? styles.activeToggle : styles.toggle}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {mode === 'Composition' && (
                <div className={styles.controls} style={{ marginTop: '-8px', borderBottom: 'none', paddingBottom: '8px' }}>
                    {(["LRNC_Volume", "NCP_Volume", "CP_Volume"] as PlaqueVolumeMode[]).map(subM => (
                        <button
                            key={subM}
                            onClick={() => setCompositionSubMode(subM)}
                            className={compositionSubMode === subM ? styles.activeToggle : styles.toggle}
                        >
                            {subM.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            )}

            <ChartDisplay report={report} mode={mode} compositionSubMode={compositionSubMode} />
        </div>
    );
};