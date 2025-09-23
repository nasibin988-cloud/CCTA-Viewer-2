// src/components/SegmentMap.tsx
import React, { useState, useMemo } from 'react';
import { CctaReport, GlobalMetrics, PlaqueVolumeMode, Segment } from '@/types/ccta';
import { SCCT18_SVG } from '@/lib/scct18';
import styles from './SegmentMap.module.css';
import { getAtherosclerosisStage, pavStage, formatNumber } from '@/lib/compute';

type MapMode = "Stenosis" | "HRP" | "Composition" | "Burden";

const AtherosclerosisScore: React.FC<{ global: GlobalMetrics }> = ({ global }) => {
    const finalStage = getAtherosclerosisStage(global.tpv_mm3, global.pav_pct);
    const tpvLabels = ["0", ">0-250", ">250-750", ">750"];
    const getTpvStage = (tpv: number): 0 | 1 | 2 | 3 => {
        if (tpv === 0) return 0;
        if (tpv <= 250) return 1;
        if (tpv <= 750) return 2;
        return 3;
    };
    const currentTpvStage = getTpvStage(global.tpv_mm3);
    const pavLabels = ["0%", ">0-5%", ">5-15%", ">15%"];
    const currentPavStage = pavStage(global.pav_pct);
    const riskColors = ['--risk-green', '--risk-yellow', '--risk-orange', '--risk-red'];

    return (
        <div className={styles.scoreboard}>
            <h3 style={{ color: `var(${riskColors[finalStage]})` }}>
                Atherosclerosis Stage: {finalStage}
            </h3>
            <div style={{ marginTop: '10px' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '11px' }}>Total Plaque Volume (mm³)</p>
                <div style={{ display: 'flex', gap: '3px' }}>
                    {tpvLabels.map((label, i) => (
                        <span key={label} style={{
                            flex: 1, padding: '3px 0', textAlign: 'center',
                            backgroundColor: i === currentTpvStage ? `var(${riskColors[i]})` : 'var(--line)',
                            color: i === currentTpvStage ? 'white' : 'var(--ink)',
                            borderRadius: '3px', fontSize: '10px'
                        }}>{label}</span>
                    ))}
                </div>
            </div>
            <div style={{ marginTop: '10px' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '11px' }}>Percent Atheroma Volume (PAV)</p>
                <div style={{ display: 'flex', gap: '3px' }}>
                    {pavLabels.map((label, i) => (
                        <span key={label} style={{
                            flex: 1, padding: '3px 0', textAlign: 'center',
                            backgroundColor: i === currentPavStage ? `var(${riskColors[i]})` : 'var(--line)',
                            color: i === currentPavStage ? 'white' : 'var(--ink)',
                            borderRadius: '3px', fontSize: '10px'
                        }}>{label}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StenosisSummary: React.FC<{ report: CctaReport }> = ({ report }) => {
    const allSegments = report.vessels.flatMap(v => v.segments);
    let severe = 0, moderate = 0, mild = 0, minimal = 0;
    allSegments.forEach(segment => {
        const stenosis = segment.stenosis_pct;
        const isLM = segment.segId === 5;
        if (stenosis >= 70 || (isLM && stenosis >= 50)) {
            severe++;
        } else if (stenosis >= 50 && stenosis <= 69) {
            moderate++;
        } else if (stenosis >= 25 && stenosis <= 49) {
            mild++;
        } else if (stenosis >= 1 && stenosis <= 24) {
            minimal++;
        }
    });

    const summaryData = [
        { label: 'Minimal', range: '1-24%', count: minimal, bgColor: 'var(--risk-green)', textColor: 'var(--risk-neutral-gray)' },
        { label: 'Mild', range: '25-49%', count: mild, bgColor: 'var(--risk-yellow)', textColor: '#8c6d07' },
        { label: 'Moderate', range: '50-69%', count: moderate, bgColor: 'var(--risk-orange)', textColor: 'white' },
        { label: 'Severe', range: '≥70%', count: severe, bgColor: 'var(--risk-red)', textColor: 'white' },
    ];

    return (
        <div style={{ display: 'flex', gap: '6px', width: '109%' }}>
            {summaryData.map(item => (
                <div key={item.label} style={{
                    flex: 1,
                    backgroundColor: item.bgColor,
                    borderRadius: '8px',
                    padding: '8px 5px',
                    textAlign: 'center',
                    color: item.textColor,
                    border: `1px solid ${item.bgColor === 'var(--risk-green)' ? 'var(--line)' : 'transparent'}`,
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 500 }}>
                        {item.label}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 500, opacity: 0.8, marginBottom: '4px' }}>
                        {item.range}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>
                        {item.count}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Tooltip Component
const Tooltip: React.FC<{ data: Segment | null }> = ({ data }) => {
    if (!data) return null;

    const totalPlaque = data.lrnc_mm3 + data.ncp_mm3 + data.cp_mm3;

    return (
        <>
            <h4>{data.name} (Seg {data.segId})</h4>
            <div className={styles.tooltipGrid}>
                <span>Stenosis:</span>         <span>{formatNumber(data.stenosis_pct, 0)}%</span>
                <span>PAV:</span>              <span>{formatNumber(data.pav_pct, 1)}%</span>
                <span>HRP Features:</span>     <span>{data.hrp.length > 0 ? data.hrp.join(', ') : 'None'}</span>
                <hr /><hr />
                <span>Total Plaque:</span>     <span>{formatNumber(totalPlaque, 1)} mm³</span>
                <span> ┕ LRNC:</span>          <span>{formatNumber(data.lrnc_mm3, 1)} mm³</span>
                <span> ┕ NCP:</span>           <span>{formatNumber(data.ncp_mm3, 1)} mm³</span>
                <span> ┕ CP:</span>            <span>{formatNumber(data.cp_mm3, 1)} mm³</span>
            </div>
        </>
    );
};

export const SegmentMap: React.FC<{ report: CctaReport }> = ({ report }) => {
    const [mode, setMode] = useState<MapMode>("Stenosis");
    const [compositionSubMode, setCompositionSubMode] = useState<PlaqueVolumeMode | undefined>(undefined);
    const [tooltip, setTooltip] = useState<{ visible: boolean; data: Segment | null; x: number; y: number }>({
        visible: false,
        data: null,
        x: 0,
        y: 0,
    });

    const allSegments = useMemo(() => report.vessels.flatMap(v => v.segments), [report]);

    const handleSegmentHover = (segId: number, event: React.MouseEvent) => {
        const segmentData = allSegments.find(s => s.segId === segId);
        if (segmentData) {
            setTooltip({
                visible: true,
                data: segmentData,
                x: event.clientX,
                y: event.clientY,
            });
        }
    };

    const handleSegmentLeave = () => {
        setTooltip(prev => ({ ...prev, visible: false }));
    };

    return (
        <div className={styles.container}>
            {tooltip.visible && (
                <div
                    className={styles.tooltip}
                    style={{
                        top: `${tooltip.y + 15}px`,
                        left: `${tooltip.x + 15}px`,
                    }}
                >
                    <Tooltip data={tooltip.data} />
                </div>
            )}

            <div className={styles.controls}>
                {(["Stenosis", "HRP", "Composition", "Burden"] as MapMode[]).map(m => (
                    <button
                        key={m}
                        onClick={() => {
                            setMode(m);
                            if (m === 'Composition') {
                                setCompositionSubMode("LRNC_Volume");
                            } else {
                                setCompositionSubMode(undefined);
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

                <div className={styles.scoreboardContainer}>
                    <AtherosclerosisScore global={report.global} />
                    <StenosisSummary report={report} />
                </div>

                <div className={styles.legend}>
                    <h4>Legend ({compositionSubMode ? compositionSubMode.replace('_', ' ') : mode})</h4>

                    {mode === 'Stenosis' && (
                        <>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> Severe (≥70%)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> Moderate (50-69%)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-yellow)' }}></span> Mild (25-49%)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-green)' }}></span> Minimal (1-24%)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-neutral-gray)' }}></span> None (0%)</div>
                        </>
                    )}

                    {mode === 'HRP' && (
                        <>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> ≥2 features</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> 1 feature</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-neutral-gray)' }}></span> 0 features</div>
                        </>
                    )}

                    {mode === 'Composition' && compositionSubMode === 'LRNC_Volume' && (
                        <>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> Very High (≥30 mm³)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> High (15-29 mm³)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-yellow)' }}></span> Moderate (5-14 mm³)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-green)' }}></span> Low (1-4 mm³)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-neutral-gray)' }}></span> None (0 mm³)</div>
                        </>
                    )}
                    {mode === 'Composition' && compositionSubMode === 'NCP_Volume' && (
                        <>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> Very High (≥100 mm³)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> High (50-99 mm³)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-yellow)' }}></span> Moderate (20-49 mm³)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-green)' }}></span> Low (1-19 mm³)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-neutral-gray)' }}></span> None (0 mm³)</div>
                        </>
                    )}
                    {mode === 'Composition' && compositionSubMode === 'CP_Volume' && (
                        <>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> Very High (≥300 mm³)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> High (150-299 mm³)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-yellow)' }}></span> Moderate (50-149 mm³)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-green)' }}></span> Low (1-49 mm³)</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-neutral-gray)' }}></span> None (0 mm³)</div>
                        </>
                    )}
                    
                    {mode === 'Composition' && !compositionSubMode && (
                        <>
                            <p style={{ margin: '0 0 5px 0' }}>Dominant Plaque Type</p>
                            <div className={styles.legendItem}><span style={{ background: 'var(--ncp-color)' }}></span> Non-Calcified Plaque</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--cp-color)' }}></span> Calcified Plaque</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-neutral-gray)' }}></span> No Plaque</div>
                        </>
                    )}

                    {mode === 'Burden' && (
                        <>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-red)' }}></span> {'Severe (>15%)'}</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-orange)' }}></span> {'Moderate (>5-15%)'}</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-yellow)' }}></span> {'Mild (>0-5%)'}</div>
                            <div className={styles.legendItem}><span style={{ background: 'var(--risk-neutral-gray)' }}></span> None (0%)</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};