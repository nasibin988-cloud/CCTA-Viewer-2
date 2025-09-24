import React, { useState, useMemo } from 'react';
import { CctaReport, PlaqueVolumeMode, Segment, MapMode } from '@/types/ccta';
import styles from './SerialComparisonChart.module.css';
import { 
    getStenosisColor, getFfrctColor, getLrncVolumeColor, getNcpVolumeColor, 
    getCpVolumeColor, getPavColor, getTpvColor, RiskColorVar, getGlobalTpvColor 
} from '@/lib/thresholds';
import { formatNumber } from '@/lib/compute';
import { ChangeMatrix } from './ChangeMatrix';

const VESSEL_SEGMENTS = {
  RCA: [1, 2, 3, 4, 16],
  LM_LAD: [5, 6, 7, 8, 9, 10, 17],
  LCx: [11, 12, 13, 14, 18, 15],
};

type ViewMode = "All Vessels" | "RCA" | "LM+LAD" | "LCx" | "Systems";

const SEGMENT_ORDER: number[] = [
    5, 6, 7, 8, 9, 10, 17, // LM & LAD chain
    11, 12, 13, 14, 18, 15, // LCx chain
    1, 2, 3, 4, 16 // RCA chain
];

// UPDATED: Reordered the columns for the "Systems" view
const SYSTEMS_ORDER: ("Whole Heart" | "LM+LAD" | "LCx" | "RCA")[] = ["Whole Heart", "LM+LAD", "LCx", "RCA"];

const SEGMENT_NAMES: { [key: number]: string } = {
    5: "LM", 6: "pLAD", 7: "mLAD", 8: "dLAD", 9: "D1", 10: "D2", 17: "Ramus",
    11: "pLCx", 12: "OM1", 13: "dLCx", 14: "OM2", 18: "L-PLB", 15: "L-PDA",
    1: "pRCA", 2: "mRCA", 3: "dRCA", 4: "R-PDA", 16: "R-PLB"
};

const CHART_CONFIG: { [key: string]: { title: string; max: number; min?: number; thresholds: {v: number; c: RiskColorVar}[] } } = {
    Stenosis: { title: "Stenosis (%)", max: 100, thresholds: [ {v: 25, c: '--risk-yellow'}, {v: 50, c: '--risk-orange'}, {v: 70, c: '--risk-red'} ]},
    FFRct: { title: "FFRct", max: 1.0, min: 0.5, thresholds: [ {v: 0.70, c: '--risk-red'}, {v: 0.75, c: '--risk-orange'}, {v: 0.80, c: '--risk-yellow'}, {v: 0.85, c: '--risk-green'} ]},
    LRNC_Volume: { title: "LRNC Volume (mm³)", max: 36, thresholds: [ {v: 5, c: '--risk-yellow'}, {v: 15, c: '--risk-orange'}, {v: 30, c: '--risk-red'} ]},
    NCP_Volume: { title: "NCP Volume (mm³)", max: 120, thresholds: [ {v: 20, c: '--risk-yellow'}, {v: 50, c: '--risk-orange'}, {v: 100, c: '--risk-red'} ]},
    CP_Volume: { title: "CP Volume (mm³)", max: 360, thresholds: [ {v: 50, c: '--risk-yellow'}, {v: 150, c: '--risk-orange'}, {v: 300, c: '--risk-red'} ]},
    TPV: { title: "TPV (mm³)", max: 180, thresholds: [ {v: 30, c: '--risk-yellow'}, {v: 75, c: '--risk-orange'}, {v: 150, c: '--risk-red'} ]},
    PAV: { title: "PAV (%)", max: 18, thresholds: [ {v: 5, c: '--risk-orange'}, {v: 15, c: '--risk-red'} ]},
};

const getChangeLabel = (change: number, metric: any) => {
    if (Math.abs(change) < 1e-6) return null;
    const sign = change > 0 ? '+' : '';
    const decimals = (metric === 'Stenosis' || (metric === 'TPV' && metric !== 'Systems')) ? 0 : (metric === 'FFRct' ? 2 : 1);
    return `${sign}${formatNumber(change, decimals)}`;
};

const getChangeFavorability = (change: number, metric: any): 'favorable' | 'unfavorable' | 'neutral' => {
    if (Math.abs(change) < 1e-6) return 'neutral';
    
    let isFavorable: boolean;
    if (metric === 'FFRct' || metric === 'CP_Volume') {
        isFavorable = change > 0;
    } else {
        isFavorable = change < 0;
    }
    return isFavorable ? 'favorable' : 'unfavorable';
};

const ChartDisplay: React.FC<{
    currentReport: CctaReport; priorReport: CctaReport; metricMode: MapMode;
    compositionSubMode?: PlaqueVolumeMode; viewMode: ViewMode;
}> = ({ currentReport, priorReport, metricMode, compositionSubMode, viewMode }) => {

    const configKey = metricMode === 'Composition' ? compositionSubMode : metricMode;
    const config = CHART_CONFIG[configKey as keyof typeof CHART_CONFIG];
    const HEADROOM_FACTOR = 1.1;

    const chartData = useMemo(() => {
        const getSegmentValue = (segment: Segment | undefined, key: any): number => {
            if (!segment) return 0;
            switch (key) {
                case 'Stenosis': return segment.stenosis_pct;
                case 'FFRct': return segment.ffrct ?? 0;
                case 'LRNC_Volume': return segment.lrnc_mm3;
                case 'NCP_Volume': return segment.ncp_mm3;
                case 'CP_Volume': return segment.cp_mm3;
                case 'TPV': return segment.lrnc_mm3 + segment.ncp_mm3 + segment.cp_mm3;
                case 'PAV': return segment.pav_pct;
                default: return 0;
            }
        };
        const getSystemValue = (report: CctaReport | Omit<CctaReport, 'priorStudy'>, system: string, key: any): number => {
            const segmentsToAnalyze = (report.vessels as any[]).flatMap(v => v.segments).filter((s: Segment) => {
                if (system === "Whole Heart") return true;
                const vesselId = system === 'LM+LAD' ? 'LM_LAD' : system;
                return VESSEL_SEGMENTS[vesselId as keyof typeof VESSEL_SEGMENTS]?.includes(s.segId);
            });
            if (!segmentsToAnalyze.length) return 0;
            switch(key) {
                case 'Stenosis': return Math.max(...segmentsToAnalyze.map(s => s.stenosis_pct));
                case 'FFRct': return Math.min(...segmentsToAnalyze.filter(s => s.ffrct !== undefined && s.ffrct > 0).map(s => s.ffrct as number)) || 0;
                case 'PAV': 
                    if(system === "Whole Heart") return report.global.pav_pct;
                    const vesselId = system === 'LM+LAD' ? 'LM_LAD' : system;
                    return report.vessels.find(v => v.id === vesselId)?.pav_pct ?? 0;
                default: return segmentsToAnalyze.reduce((acc, s) => acc + getSegmentValue(s, key), 0);
            }
        };

        if (viewMode === 'Systems') {
            return SYSTEMS_ORDER.map(systemName => ({ key: systemName, label: systemName, priorValue: getSystemValue(priorReport, systemName, configKey), currentValue: getSystemValue(currentReport, systemName, configKey) }));
        }
        
        const segmentMap = new Map<number, {prior?: Segment, current?: Segment}>();
        priorReport.vessels.flatMap(v => v.segments).forEach(s => segmentMap.set(s.segId, { prior: s }));
        currentReport.vessels.flatMap(v => v.segments).forEach(s => segmentMap.set(s.segId, { ...segmentMap.get(s.segId), current: s }));

        const orderedSegmentList = SEGMENT_ORDER
            .filter(id => viewMode === 'All Vessels' || VESSEL_SEGMENTS[viewMode.replace('+', '_') as keyof typeof VESSEL_SEGMENTS]?.includes(id))
            .filter(id => segmentMap.has(id));

        return orderedSegmentList.map(segId => {
            const { prior, current } = segmentMap.get(segId)!;
            return {
                key: segId,
                label: SEGMENT_NAMES[segId] || String(segId),
                priorValue: getSegmentValue(prior, configKey),
                currentValue: getSegmentValue(current, configKey),
            };
        });
    }, [viewMode, configKey, currentReport, priorReport]);

    if (!config) return <div style={{ height: '450px', display: 'grid', placeContent: 'center' }}><p>Select a metric to view the chart.</p></div>;

    const getColor = (value: number) => {
        switch(configKey) {
            case 'Stenosis': return getStenosisColor(value);
            case 'FFRct': return getFfrctColor(value);
            case 'LRNC_Volume': return getLrncVolumeColor(value);
            case 'NCP_Volume': return getNcpVolumeColor(value);
            case 'CP_Volume': return getCpVolumeColor(value);
            case 'TPV': return viewMode === 'Systems' ? getGlobalTpvColor(value) : getTpvColor(value);
            case 'PAV': return getPavColor(value);
            default: return '--risk-dark-green';
        }
    };

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
                    return (
                        <div key={line.v} className={styles.yAxisTick} style={{ bottom: `${visualBottom}%` }}>
                           <span style={{ color: `var(${line.c})` }}>{line.v}</span>
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
                        return <div key={line.v} className={styles.gridLine} style={{ bottom: `${visualBottom}%`, borderTopColor: `var(${line.c})` }}></div>
                    })}
                    {isFfrct && <div className={styles.axisBreak}></div>}
                    
                    <div className={styles.barsContainer}>
                        {chartData.map((data, index) => {
                            const change = data.currentValue - data.priorValue;
                            const changeText = getChangeLabel(change, configKey);
                            const favorability = getChangeFavorability(change, configKey);
                            const decimals = (configKey === 'Stenosis' || (configKey === 'TPV' && viewMode === 'Systems')) ? 0 : (configKey === 'FFRct' ? 2 : 1);

                            const cappedPrior = Math.min(data.priorValue, config.max);
                            const valueForPriorHeight = isFfrct ? cappedPrior - (config.min || 0) : cappedPrior;
                            const logicalPriorHeight = Math.max(0, (valueForPriorHeight / range) * 100);
                            const visualPriorHeight = logicalPriorHeight / HEADROOM_FACTOR;

                            const cappedCurrent = Math.min(data.currentValue, config.max);
                            const valueForCurrentHeight = isFfrct ? cappedCurrent - (config.min || 0) : cappedCurrent;
                            const logicalCurrentHeight = Math.max(0, (valueForCurrentHeight / range) * 100);
                            const visualCurrentHeight = logicalCurrentHeight / HEADROOM_FACTOR;

                            return (
                                <div key={data.key} className={`${styles.barPairWrapper} ${styles[favorability + 'Background']}`}>
                                    {index > 0 && <div className={styles.separatorLine}></div>}
                                    {changeText && (
                                        <div className={`${styles.changeLabel} ${styles[favorability + 'Change']}`}>
                                            {changeText}
                                        </div>
                                    )}
                                    <div className={styles.priorValueLabel} style={{ bottom: `calc(${visualPriorHeight}% + 4px)` }}>
                                        {formatNumber(data.priorValue, decimals)}
                                    </div>
                                    <div className={styles.currentValueLabel} style={{ bottom: `calc(${visualCurrentHeight}% + 4px)` }}>
                                        {formatNumber(data.currentValue, decimals)}
                                    </div>
                                    <div className={styles.priorBar} style={{ height: `${visualPriorHeight}%`, backgroundColor: `var(${getColor(data.priorValue)})` }} />
                                    <div className={styles.currentBar} style={{ height: `${visualCurrentHeight}%`, backgroundColor: `var(${getColor(data.currentValue)})` }} />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className={styles.xAxisLabels}>
                    {chartData.map(data => (
                        <div key={data.key} className={styles.segmentLabel}>{data.label}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const SerialComparisonChart: React.FC<{ report: CctaReport }> = ({ report }) => {
    const [viewMode, setViewMode] = useState<ViewMode>("All Vessels");
    const [metricMode, setMetricMode] = useState<MapMode>("Stenosis");
    const [compositionSubMode, setCompositionSubMode] = useState<PlaqueVolumeMode | undefined>(undefined);
    const [showMatrix, setShowMatrix] = useState(false);

    if (!report.priorStudy) return null;

    const handleMetricClick = (m: MapMode) => {
        setMetricMode(m);
        if (m === 'Composition') {
            setCompositionSubMode('LRNC_Volume');
        } else {
            setCompositionSubMode(undefined);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Serial Comparison Analysis</h2>
                <div className={styles.vesselToggles}>
                    {/* UPDATED: Reordered the main view toggles */}
                    {(["All Vessels", "LM+LAD", "LCx", "RCA", "Systems"] as ViewMode[]).map(v => (
                        <button key={v} onClick={() => setViewMode(v)} className={viewMode === v ? styles.activeVesselToggle : styles.vesselToggle}>
                            {v.replace('+', ' + ')}
                        </button>
                    ))}
                    <button onClick={() => setShowMatrix(prev => !prev)} className={showMatrix ? styles.activeMatrixToggle : styles.matrixToggle}>
                        MATRIX
                    </button>
                </div>
                <div className={styles.dateInfo}>
                    <span>Prior: {report.priorStudy.patient.studyDate}</span>
                    <span>Current: {report.patient.studyDate}</span>
                </div>
            </div>
            
            <div className={styles.controls}>
                {(["Stenosis", "FFRct", "Composition"] as (MapMode | "Composition")[]).map(m => (
                    <button key={m} onClick={() => handleMetricClick(m)} className={metricMode === m ? styles.activeToggle : styles.toggle}> {m} </button>
                ))}
            </div>
            {metricMode === 'Composition' && (
                <div className={styles.controls} style={{marginTop: '-8px', borderBottom: 'none', paddingBottom: '8px'}}>
                    {(["LRNC_Volume", "NCP_Volume", "CP_Volume", "TPV", "PAV"] as PlaqueVolumeMode[]).map(subM => (
                        <button key={subM} onClick={() => setCompositionSubMode(subM)} className={compositionSubMode === subM ? styles.activeToggle : styles.toggle}>
                            {subM.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            )}

            <ChartDisplay currentReport={report} priorReport={report.priorStudy} metricMode={metricMode} compositionSubMode={compositionSubMode} viewMode={viewMode} />
            
            {showMatrix && <ChangeMatrix currentReport={report} priorReport={report.priorStudy} />}
        </div>
    );
};