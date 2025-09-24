import React, { useState, useMemo, useCallback } from 'react';
import { CctaReport, PlaqueVolumeMode, Segment, MapMode } from '@/types/ccta';
import { SCCT18_SVG } from '@/lib/scct18';
import styles from './SegmentMap.module.css';
import { pavStage, formatNumber } from '@/lib/compute';

export const Scoreboard: React.FC<{ report: CctaReport }> = ({ report }) => {
    const global = report.global;
    const allSegments = report.vessels.flatMap(v => v.segments);

    const pavLabels = ["0%", ">0-5%", ">5-15%", ">15%"];
    const currentPavStage = pavStage(global.pav_pct);

    const tpvLabels = ["0", ">0-250", ">250-750", ">750"];
    const getTpvStage = (tpv: number): 0 | 1 | 2 | 3 => {
        if (tpv === 0) return 0;
        if (tpv <= 250) return 1;
        if (tpv <= 750) return 2;
        return 3;
    };
    const currentTpvStage = getTpvStage(global.tpv_mm3);

    let severe = 0, moderate = 0, mild = 0, minimal = 0;
    allSegments.forEach(segment => {
        const stenosis = segment.stenosis_pct;
        const isLM = segment.segId === 5;
        if (stenosis >= 70 || (isLM && stenosis >= 50)) severe++;
        else if (stenosis >= 50) moderate++;
        else if (stenosis >= 25) mild++;
        else if (stenosis > 0) minimal++;
    });

    const stenosisData = [
        { label: 'Minimal', range: '1-24%', count: minimal, color: 'var(--risk-green)' },
        { label: 'Mild', range: '25-49%', count: mild, color: 'var(--risk-yellow)' },
        { label: 'Moderate', range: '50-69%', count: moderate, color: 'var(--risk-orange)' },
        { label: 'Severe', range: '≥70%', count: severe, color: 'var(--risk-red)' },
    ];

    const riskColors = ['var(--risk-dark-green)', 'var(--risk-green)', 'var(--risk-orange)', 'var(--risk-red)'];
    const stenosisTextColors = ['var(--dark-ink)', '#8c6d07', 'white', 'white'];

    return (
        <div className={styles.scoreboard}>
            <div className={styles.meterGroup}>
                <p>Percent Atheroma Volume (PAV)</p>
                <div className={styles.meterBoxes}>
                    {pavLabels.map((label, i) => (
                        <span key={label}
                              className={i === currentPavStage ? styles.activeMeter : styles.meter}
                              style={{
                                backgroundColor: i === currentPavStage ? riskColors[i] : 'var(--risk-neutral-gray)',
                                '--meter-color': riskColors[i]
                              } as React.CSSProperties}>
                            {label}
                        </span>
                    ))}
                </div>
            </div>
            <div className={styles.meterGroup}>
                <p>Total Plaque Volume (mm³)</p>
                <div className={styles.meterBoxes}>
                    {tpvLabels.map((label, i) => (
                        <span key={label}
                              className={i === currentTpvStage ? styles.activeMeter : styles.meter}
                              style={{
                                backgroundColor: i === currentTpvStage ? riskColors[i] : 'var(--risk-neutral-gray)',
                                '--meter-color': riskColors[i]
                              } as React.CSSProperties}>
                            {label}
                        </span>
                    ))}
                </div>
            </div>
            <div className={styles.stenosisGroup}>
                {stenosisData.map((item, index) => (
                    <div key={item.label} className={styles.stenosisBox} style={{ backgroundColor: item.color, color: stenosisTextColors[index] }}>
                        <div className={styles.stenosisLabel}>{item.label}</div>
                        <div className={styles.stenosisRange}>{item.range}</div>
                        <div className={styles.stenosisCount}>{item.count}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const Tooltip: React.FC<{ data: Segment | null }> = ({ data }) => {
    if (!data) return null;
    const totalPlaque = data.lrnc_mm3 + data.ncp_mm3 + data.cp_mm3;
    return (
        <>
            <h4>{data.name} (Seg {data.segId})</h4>
            <div className={styles.tooltipGrid}>
                <span>Stenosis:</span>       <span>{formatNumber(data.stenosis_pct, 0)}%</span>
                <span>PAV:</span>            <span>{formatNumber(data.pav_pct, 1)}%</span>
                <span>FFRct:</span>          <span>{data.ffrct !== undefined ? formatNumber(data.ffrct, 2) : 'N/A'}</span>
                <hr /><hr />
                <span>Total Plaque:</span>   <span>{formatNumber(totalPlaque, 1)} mm³</span>
                <span> ┕ LRNC:</span>       <span>{formatNumber(data.lrnc_mm3, 1)} mm³</span>
                <span> ┕ NCP:</span>        <span>{formatNumber(data.ncp_mm3, 1)} mm³</span>
                <span> ┕ CP:</span>         <span>{formatNumber(data.cp_mm3, 1)} mm³</span>
            </div>
        </>
    );
};

export const SegmentMap: React.FC<{ report: CctaReport }> = ({ report }) => {
    const [mode, setMode] = useState<MapMode>("Stenosis");
    const [compositionSubMode, setCompositionSubMode] = useState<PlaqueVolumeMode | undefined>(undefined);
    const [tooltip, setTooltip] = useState<{ visible: boolean; data: Segment | null; x: number; y: number }>({
        visible: false, data: null, x: 0, y: 0,
    });

    const allSegments = useMemo(() => report.vessels.flatMap(v => v.segments), [report]);

    const handleSegmentHover = useCallback((segId: number, event: React.MouseEvent) => {
        const segmentData = allSegments.find(s => s.segId === segId);
        if (segmentData) {
            setTooltip({ visible: true, data: segmentData, x: event.nativeEvent.offsetX + 20, y: event.nativeEvent.offsetY + 20 });
        }
    }, [allSegments]);

    const handleSegmentLeave = useCallback(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
    }, []);

    const handleModeClick = (m: MapMode) => {
      setMode(m);
      if (m === 'Composition') {
          // Automatically select LRNC_Volume when Composition is clicked
          setCompositionSubMode('LRNC_Volume');
      } else {
          setCompositionSubMode(undefined);
      }
    }

    return (
        <div className={styles.container}>
            {tooltip.visible && (
                <div className={styles.tooltip} style={{ top: `${tooltip.y}px`, left: `${tooltip.x}px` }}>
                    <Tooltip data={tooltip.data} />
                </div>
            )}

            <div className={styles.controls}>
                {(["Stenosis", "FFRct", "Composition", "Lesions", "Interactive"] as MapMode[]).map(m => (
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

            <div className={styles.mapArea}>
                <div className={styles.mapBackground}>
                    <SCCT18_SVG
                        report={report}
                        mode={mode}
                        compositionSubMode={compositionSubMode}
                        onSegmentHover={handleSegmentHover}
                        onSegmentLeave={handleSegmentLeave}
                    />
                </div>
               
                <div className={styles.legend}>
                    <h4>Legend ({compositionSubMode ? compositionSubMode.replace('_', ' ') : mode})</h4>

                    {mode === 'Stenosis' && (
                        <>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> Severe (≥70%)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> Moderate (50-69%)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-yellow)' }}></span> Mild (25-49%)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-green)' }}></span> Minimal (1-24%)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-dark-green)' }}></span> None (0%)</div>
                        </>
                    )}
                    
                    {mode === 'FFRct' && (
                        <>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> Ischemic (≤0.70)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> Borderline (0.71-0.75)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-yellow)' }}></span> Gray Zone (0.76-0.80)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-green)' }}></span> Normal (0.81-0.85)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-dark-green)' }}></span> Healthy ({'>'}0.85)</div>
                        </>
                    )}

                    {mode === 'Composition' && compositionSubMode === 'LRNC_Volume' && (
                         <>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> ≥30 mm³</div>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> 15-29 mm³</div>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-yellow)' }}></span> 5-14 mm³</div>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-green)' }}></span> 1-4 mm³</div>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-dark-green)' }}></span> 0 mm³</div>
                         </>
                    )}
                    {mode === 'Composition' && compositionSubMode === 'NCP_Volume' && (
                         <>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> ≥100 mm³</div>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> 50-99 mm³</div>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-yellow)' }}></span> 20-49 mm³</div>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-green)' }}></span> 1-19 mm³</div>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-dark-green)' }}></span> 0 mm³</div>
                         </>
                    )}
                    {mode === 'Composition' && compositionSubMode === 'CP_Volume' && (
                         <>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> ≥300 mm³</div>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> 150-299 mm³</div>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-yellow)' }}></span> 50-149 mm³</div>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-green)' }}></span> 1-49 mm³</div>
                             <div className={styles.legendItem}><span style={{ background: 'var(--risk-dark-green)' }}></span> 0 mm³</div>
                         </>
                    )}
                     {mode === 'Composition' && compositionSubMode === 'TPV' && (
                        <>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> ≥150 mm³</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> 75-149 mm³</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-yellow)' }}></span> 30-74 mm³</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-green)' }}></span> 1-29 mm³</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-dark-green)' }}></span> 0 mm³</div>
                        </>
                    )}
                    {mode === 'Composition' && compositionSubMode === 'PAV' && (
                        <>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> {'>'}15%</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> {'>'}5-15%</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-green)' }}></span> {'>'}0-5%</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-dark-green)' }}></span> 0%</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};