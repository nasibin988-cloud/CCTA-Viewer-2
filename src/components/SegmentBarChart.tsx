import React, { useState, useMemo } from 'react';
import { CctaReport, PlaqueVolumeMode, Segment, MapMode } from '@/types/ccta';
import styles from './SegmentBarChart.module.css';
import {
    getStenosisColor, getFfrctColor, getLrncVolumeColor,
    getNcpVolumeColor, getCpVolumeColor, getPavColor, getTpvColor,
    RiskColorVar
} from '@/lib/thresholds';
import { formatNumber } from '@/lib/compute';

// Segment order now matches the anatomical sequence of the other components.
const SEGMENT_ORDER: number[] = [
    5, 6, 7, 8, 9, 10, 17, // LM & LAD chain
    11, 12, 13, 14, 18, 15, // LCx chain
    1, 2, 3, 4, 16 // RCA chain
];

const SEGMENT_NAMES: { [key: number]: string } = {
    5: "LM", 6: "pLAD", 7: "mLAD", 8: "dLAD", 9: "D1", 10: "D2", 17: "Ramus",
    11: "pLCx", 12: "OM1", 13: "dLCx", 14: "OM2", 18: "L-PLB", 15: "L-PDA",
    1: "pRCA", 2: "mRCA", 3: "dRCA", 4: "R-PDA", 16: "R-PLB"
};

const CHART_CONFIG: { [key: string]: { title: string; max: number; min?: number; thresholds: {v: number; c: RiskColorVar | string}[] } } = {
    Stenosis: { title: "Stenosis (%)", max: 100, thresholds: [ {v: 25, c: '--risk-yellow'}, {v: 50, c: '--risk-orange'}, {v: 70, c: '--risk-red'} ]},
    FFRct: { title: "FFRct", max: 1.0, min: 0.5, thresholds: [ {v: 0.70, c: getFfrctColor(0.70)}, {v: 0.75, c: getFfrctColor(0.75)}, {v: 0.80, c: getFfrctColor(0.80)}, {v: 0.85, c: getFfrctColor(0.85)} ]},
    LRNC_Volume: { title: "LRNC Volume (mm³)", max: 36, thresholds: [ {v: 5, c: '--risk-yellow'}, {v: 15, c: '--risk-orange'}, {v: 30, c: '--risk-red'} ]},
    NCP_Volume: { title: "NCP Volume (mm³)", max: 120, thresholds: [ {v: 20, c: '--risk-yellow'}, {v: 50, c: '--risk-orange'}, {v: 100, c: '--risk-red'} ]},
    CP_Volume: { title: "CP Volume (mm³)", max: 360, thresholds: [ {v: 50, c: '--risk-yellow'}, {v: 150, c: '--risk-orange'}, {v: 300, c: '--risk-red'} ]},
    TPV: { title: "TPV (mm³)", max: 180, thresholds: [ {v: 30, c: '--risk-yellow'}, {v: 75, c: '--risk-orange'}, {v: 150, c: '--risk-red'} ]},
    PAV: { title: "PAV (%)", max: 18, thresholds: [ {v: 5, c: '--risk-orange'}, {v: 15, c: '--risk-red'} ]},
};

interface BarInfo { value: number; color: string; label: string; }

const ChartDisplay: React.FC<{
    report: CctaReport,
    mode: MapMode,
    compositionSubMode?: PlaqueVolumeMode
}> = ({ report, mode, compositionSubMode }) => {
    const allSegments = useMemo(() => {
        const segmentMap = new Map(report.vessels.flatMap(v => v.segments).map(s => [s.segId, s]));
        return SEGMENT_ORDER.map(id => segmentMap.get(id));
    }, [report]);
    
    const configKey = mode === 'Composition' && compositionSubMode ? compositionSubMode : mode;
    const config = CHART_CONFIG[configKey as keyof typeof CHART_CONFIG];
    
    const HEADROOM_FACTOR = 1.1;

    const getBarInfo = (segment: Segment | undefined): BarInfo => {
        const noDataInfo: BarInfo = { value: 0, color: 'var(--risk-dark-green)', label: "0" };
        if (!segment) return noDataInfo;
        const totalPlaque = (segment.lrnc_mm3 || 0) + (segment.ncp_mm3 || 0) + (segment.cp_mm3 || 0);
        let colorVar: RiskColorVar;
        switch (configKey) {
            case 'Stenosis': 
                colorVar = getStenosisColor(segment.stenosis_pct);
                return { value: segment.stenosis_pct, color: `var(${colorVar})`, label: formatNumber(segment.stenosis_pct, 0) };
            case 'FFRct': 
                const ffrct = segment.ffrct ?? 0;
                return { value: ffrct, color: getFfrctColor(segment.ffrct), label: segment.ffrct ? formatNumber(ffrct, 2) : 'N/A' };
            case 'LRNC_Volume': 
                colorVar = getLrncVolumeColor(segment.lrnc_mm3);
                return { value: segment.lrnc_mm3, color: `var(${colorVar})`, label: formatNumber(segment.lrnc_mm3, 1) };
            case 'NCP_Volume': 
                colorVar = getNcpVolumeColor(segment.ncp_mm3);
                return { value: segment.ncp_mm3, color: `var(${colorVar})`, label: formatNumber(segment.ncp_mm3, 1) };
            case 'CP_Volume': 
                colorVar = getCpVolumeColor(segment.cp_mm3);
                return { value: segment.cp_mm3, color: `var(${colorVar})`, label: formatNumber(segment.cp_mm3, 1) };
            case 'TPV': 
                colorVar = getTpvColor(totalPlaque);
                return { value: totalPlaque, color: `var(${colorVar})`, label: formatNumber(totalPlaque, 1) };
            case 'PAV': 
                colorVar = getPavColor(segment.pav_pct);
                return { value: segment.pav_pct, color: `var(${colorVar})`, label: formatNumber(segment.pav_pct, 1) };
            default: return noDataInfo;
        }
    };

    if (!config) return null;

    const isFfrct = configKey === 'FFRct';
    const range = isFfrct ? config.max - (config.min || 0) : config.max;

    return (
        <div className={styles.chartContainer}>
            <div className={styles.yAxis}>
                <div className={styles.yAxisLabel}>{config.title}</div>
                 {config.thresholds.map(line => {
                    const logicalBottom = isFfrct ? ((line.v - (config.min || 0)) / range) * 100 : (line.v / config.max) * 100;
                    const visualBottom = logicalBottom / HEADROOM_FACTOR;
                    if (visualBottom <= 0 || visualBottom > 100) return null;
                    const color = typeof line.c === 'string' && line.c.startsWith('#') ? line.c : `var(${line.c})`;
                    
                    const tickClass = (isFfrct && (line.v === 0.80 || line.v === 0.75)) ? `${styles.yAxisTick} ${styles.boldTick}` : styles.yAxisTick;

                    return (
                        <div key={line.v} className={tickClass} style={{ bottom: `${visualBottom}%` }}>
                           <span style={{ color: color }}>{line.v}</span>
                        </div>
                    );
                })}
            </div>
            <div className={styles.mainChartColumn}>
                <div className={styles.chartArea}>
                    {config.thresholds.map(line => {
                        const logicalBottom = isFfrct ? ((line.v - (config.min || 0)) / range) * 100 : (line.v / config.max) * 100;
                        const visualBottom = logicalBottom / HEADROOM_FACTOR;
                        if (visualBottom <= 0 || visualBottom > 100) return null;
                        const color = typeof line.c === 'string' && line.c.startsWith('#') ? line.c : `var(${line.c})`;
                        
                        // REVERSED: 0.80 line is now the boldest
                        let lineClass = styles.gridLine;
                        if(isFfrct && line.v === 0.75) lineClass += ` ${styles.gridLineBold}`;
                        if(isFfrct && line.v === 0.80) lineClass += ` ${styles.gridLineBolder}`;

                        return <div key={line.v} className={lineClass} style={{ bottom: `${visualBottom}%`, borderTopColor: color }}></div>
                    })}
                    {isFfrct && <div className={styles.axisBreak}></div>}
                    
                    <div className={styles.barsContainer}>
                        {allSegments.map((segmentData, index) => {
                            const segId = SEGMENT_ORDER[index];
                            if (!segmentData) {
                                return <div key={segId} className={styles.barWrapper}></div>;
                            }
                            
                            const { value: rawValue, color, label } = getBarInfo(segmentData);
                            const cappedValue = Math.min(rawValue, config.max);
                            const valueForHeight = isFfrct ? cappedValue - (config.min || 0) : cappedValue;
                            const logicalHeight = Math.max(0, (valueForHeight / range) * 100);
                            const visualHeight = logicalHeight / HEADROOM_FACTOR;
                            const showLabel = rawValue > 0 && label !== "N/A";

                            return (
                                <div key={segId} className={styles.barWrapper}>
                                    {showLabel && <div className={styles.valueLabel} style={{ bottom: `calc(${visualHeight}% + 4px)` }}>{label}</div>}
                                    <div className={styles.bar} style={{ height: `${visualHeight}%`, backgroundColor: color }}></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className={styles.xAxisLabels}>
                    {SEGMENT_ORDER.map(segId => (
                        <div key={segId} className={styles.segmentLabel}>{SEGMENT_NAMES[segId] || segId}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const SegmentBarChart: React.FC<{ report: CctaReport }> = ({ report }) => {
    const [mode, setMode] = useState<MapMode>("Composition");
    const [compositionSubMode, setCompositionSubMode] = useState<PlaqueVolumeMode | undefined>('LRNC_Volume');

    const handleModeClick = (m: MapMode) => {
        setMode(m);
        if (m === 'Composition') {
            setCompositionSubMode('LRNC_Volume');
        } else {
            setCompositionSubMode(undefined);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Segment Analysis</h2>
            <div className={styles.controls}>
                {(["Composition", "FFRct", "Stenosis"] as MapMode[]).map(m => (
                    <button key={m} onClick={() => handleModeClick(m)}
                            className={mode === m ? styles.activeToggle : styles.toggle}>
                        {m}
                    </button>
                ))}
            </div>
            {mode === 'Composition' && (
                <div className={styles.controls} style={{ marginTop: '-8px', borderBottom: 'none', paddingBottom: '8px' }}>
                    {(["LRNC_Volume", "NCP_Volume", "CP_Volume", "TPV", "PAV"] as PlaqueVolumeMode[]).map(subM => (
                        <button key={subM} onClick={() => setCompositionSubMode(subM)}
                                className={compositionSubMode === subM ? styles.activeToggle : styles.toggle}>
                            {subM.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            )}
            <ChartDisplay report={report} mode={mode} compositionSubMode={compositionSubMode} />
        </div>
    );
};