// src/components/SerialComparisonChart.tsx
import React, { useState, useMemo } from 'react';
import { CctaReport, PlaqueVolumeMode, Segment } from '@/types/ccta';
import styles from './SerialComparisonChart.module.css';
import { getStenosisColor, getHrpColor, getCompositionColor, getLrncVolumeColor, getNcpVolumeColor, getCpVolumeColor, getPavColor, RiskColorVar, CompositionColorVar } from '@/lib/thresholds';
import { formatNumber } from '@/lib/compute';
import { ChangeMatrix } from './ChangeMatrix'; // Make sure ChangeMatrix is imported

const VESSEL_SEGMENTS = {
  RCA: [1, 2, 3, 4, 16],
  LM_LAD: [5, 6, 7, 8, 9, 10],
  LCx: [11, 12, 13, 14, 15, 17, 18],
};
type VesselFilter = "Whole Heart" | "RCA" | "LM+LAD" | "LCx";
type MapMode = "Stenosis" | "HRP" | "Composition" | "Burden";
const SEGMENT_ORDER: number[] = [5, 11, 13, 15, 18, 12, 14, 6, 7, 9, 10, 8, 1, 2, 3, 4, 16, 17];
const SEGMENT_NAMES: { [key: number]: string } = {
    5: "LM", 11: "pLCx", 13: "dLCx", 15: "L-PDA", 18: "Ramus", 12: "OM1", 14: "OM2",
    6: "pLAD", 7: "mLAD", 9: "D1", 10: "D2", 8: "dLAD", 1: "pRCA", 2: "mRCA",
    3: "dRCA", 4: "R-PDA", 16: "R-PLB", 17: "L-PLB"
};
const CHART_CONFIG = {
    Stenosis: { title: "Stenosis (%)", max: 100, unit: '%' },
    Burden: { title: "Plaque Burden (PAV %)", max: 40, unit: '%' },
    HRP: { title: "High-Risk Plaque Features", max: 2, unit: '' },
    LRNC_Volume: { title: "LRNC Volume (mm³)", max: 40, unit: ' mm³' },
    NCP_Volume: { title: "NCP Volume (mm³)", max: 120, unit: ' mm³' },
    CP_Volume: { title: "CP Volume (mm³)", max: 350, unit: ' mm³' }
};

interface BarInfo { value: number; color: RiskColorVar | CompositionColorVar; label: string; }

const SerialChartDisplay: React.FC<{
    currentReport: CctaReport; priorReport: CctaReport; mode: MapMode;
    compositionSubMode?: PlaqueVolumeMode; vesselFilter: VesselFilter;
}> = ({ currentReport, priorReport, mode, compositionSubMode, vesselFilter }) => {
    const currentSegments = useMemo(() => currentReport.vessels.flatMap(v => v.segments), [currentReport]);
    const priorSegments = useMemo(() => priorReport.vessels.flatMap(v => v.segments), [priorReport]);
    const configKey = mode === 'Composition' ? compositionSubMode : mode;
    const config = CHART_CONFIG[configKey as keyof typeof CHART_CONFIG];
    
    const displayedSegments = useMemo(() => {
        if (vesselFilter === 'Whole Heart') return SEGMENT_ORDER;
        const key = vesselFilter === 'LM+LAD' ? 'LM_LAD' : vesselFilter;
        return SEGMENT_ORDER.filter(id => VESSEL_SEGMENTS[key as keyof typeof VESSEL_SEGMENTS].includes(id));
    }, [vesselFilter]);

    const getBarInfo = (segment: Segment | undefined): BarInfo => {
        const noPlaqueInfo: BarInfo = { value: 0, color: '--risk-neutral-gray', label: '0' };
        if (!segment) return noPlaqueInfo;
        switch (configKey) {
            case 'Stenosis': return { value: segment.stenosis_pct, color: getStenosisColor(segment.stenosis_pct), label: formatNumber(segment.stenosis_pct, 0) };
            case 'Burden': return { value: segment.pav_pct, color: getPavColor(segment.pav_pct), label: formatNumber(segment.pav_pct, 1) };
            case 'HRP': return { value: segment.hrp.length, color: getHrpColor(segment.hrp.length), label: segment.hrp.join(', ') || '0' };
            case 'LRNC_Volume': return { value: segment.lrnc_mm3, color: getLrncVolumeColor(segment.lrnc_mm3), label: formatNumber(segment.lrnc_mm3, 1) };
            case 'NCP_Volume': return { value: segment.ncp_mm3, color: getNcpVolumeColor(segment.ncp_mm3), label: formatNumber(segment.ncp_mm3, 1) };
            case 'CP_Volume': return { value: segment.cp_mm3, color: getCpVolumeColor(segment.cp_mm3), label: formatNumber(segment.cp_mm3, 1) };
            default: return noPlaqueInfo;
        }
    };
    
    if (!config) return <div className={styles.chartArea}><p>Select a Composition type.</p></div>;

    return (
        <div className={`${styles.chartArea} ${vesselFilter !== 'Whole Heart' ? styles.filteredView : ''}`}>
            {displayedSegments.map(segId => {
                const priorData = getBarInfo(priorSegments.find(s => s.segId === segId));
                const currentData = getBarInfo(currentSegments.find(s => s.segId === segId));
                
                const unfavorable = currentData.value > priorData.value + 1e-6;
                const noChange = Math.abs(priorData.value - currentData.value) < 1e-6;
                const backgroundClass = noChange ? '' : (unfavorable ? styles.unfavorableBackground : styles.favorableBackground);
                
                const priorHeight = Math.min(100, (priorData.value / config.max) * 100);
                const currentHeight = Math.min(100, (currentData.value / config.max) * 100);

                const change = currentData.value - priorData.value;
                let changeLabel = '';
                if (configKey !== 'HRP' && !noChange) {
                    const sign = change > 0 ? '+' : '';
                    const decimals = configKey === 'Stenosis' ? 0 : 1;
                    changeLabel = `(${sign}${formatNumber(change, decimals)})`;
                }

                return (
                    <div key={segId} className={`${styles.barPairWrapper} ${backgroundClass}`}>
                        <div className={styles.valueLabel}>{priorData.label}</div>
                        <div className={styles.valueLabel}>{currentData.label}</div>
                        <div className={styles.changeLabel}>{changeLabel}</div>
                        <div className={styles.barPair}>
                            <div className={styles.bar} style={{ height: `${priorHeight}%`, backgroundColor: `var(${priorData.color})` }}></div>
                            <div className={styles.bar} style={{ height: `${currentHeight}%`, backgroundColor: `var(${currentData.color})` }}></div>
                        </div>
                        <div className={styles.segmentLabel}>{SEGMENT_NAMES[segId] || segId}</div>
                    </div>
                );
            })}
        </div>
    );
};


export const SerialComparisonChart: React.FC<{ report: CctaReport }> = ({ report }) => {
    const [mode, setMode] = useState<MapMode>("Stenosis");
    const [vesselFilter, setVesselFilter] = useState<VesselFilter>("Whole Heart");
    const [compositionSubMode, setCompositionSubMode] = useState<PlaqueVolumeMode | undefined>(undefined);
    // 1. State for the matrix visibility
    const [showMatrix, setShowMatrix] = useState(false);

    if (!report.priorStudy) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Serial Comparison Analysis</h2>
                <div className={styles.vesselToggles}>
                    {(["Whole Heart", "RCA", "LM+LAD", "LCx"] as VesselFilter[]).map(v => (
                        <button key={v} onClick={() => setVesselFilter(v)} className={vesselFilter === v ? styles.activeVesselToggle : styles.vesselToggle}>
                            {v.replace('+', ' + ')}
                        </button>
                    ))}
                    {/* 2. The MATRIX button itself */}
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
                {(["Stenosis", "HRP", "Composition", "Burden"] as MapMode[]).map(m => (
                    <button key={m} onClick={() => { setMode(m); if (m === 'Composition') { if (!compositionSubMode) setCompositionSubMode("LRNC_Volume"); } else { setCompositionSubMode(undefined); } }} className={mode === m ? styles.activeToggle : styles.toggle}> {m} </button>
                ))}
            </div>
            {mode === 'Composition' && (
                <div className={styles.controls} style={{marginTop: '-8px', borderBottom: 'none', paddingBottom: '8px'}}>
                    {(["LRNC_Volume", "NCP_Volume", "CP_Volume"] as PlaqueVolumeMode[]).map(subM => (
                        <button key={subM} onClick={() => setCompositionSubMode(subM)} className={compositionSubMode === subM ? styles.activeToggle : styles.toggle}>
                            {subM.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            )}
            <SerialChartDisplay currentReport={report} priorReport={report.priorStudy} mode={mode} vesselFilter={vesselFilter} />
            
            {/* 3. Conditional rendering of the matrix */}
            {showMatrix && <ChangeMatrix currentReport={report} priorReport={report.priorStudy} />}
        </div>
    );
};