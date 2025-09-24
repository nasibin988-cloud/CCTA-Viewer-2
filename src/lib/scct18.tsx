import React, { useState, useEffect, memo } from 'react';
import { CctaReport, PlaqueVolumeMode, MapMode } from '@/types/ccta';
import {
    getStenosisColor,
    getFfrctColor,
    getCompositionColor,
    getLrncVolumeColor,
    getNcpVolumeColor,
    getCpVolumeColor,
    getPavColor,
    getTpvColor,
} from './thresholds';
import { AnatomyDiagramComponent } from '../components/AnatomyDiagramComponent';

interface SCCT18_SVG_Props {
    report: CctaReport;
    mode: MapMode;
    compositionSubMode?: PlaqueVolumeMode;
    onSegmentHover: (segId: number, event: React.MouseEvent) => void;
    onSegmentLeave: () => void;
}

// Helper function to calculate a darker shade of a hex color
const darkenColor = (hex: string, percent: number): string => {
    if (!hex || !hex.startsWith('#')) return hex; // Return original if not a valid hex

    // Ensure hex is 6 digits
    const normalizedHex = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;

    let r = parseInt(normalizedHex.substring(1, 3), 16);
    let g = parseInt(normalizedHex.substring(3, 5), 16);
    let b = parseInt(normalizedHex.substring(5, 7), 16);

    const amount = 1 - percent / 100;

    r = Math.max(0, Math.floor(r * amount));
    g = Math.max(0, Math.floor(g * amount));
    b = Math.max(0, Math.floor(b * amount));

    const toHex = (c: number) => ('00' + c.toString(16)).slice(-2);

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};


const SCCT18_SVG_Component: React.FC<SCCT18_SVG_Props> = ({ report, mode, compositionSubMode, onSegmentHover, onSegmentLeave }) => {
    const [colorMap, setColorMap] = useState<{ [key: number]: { fill: string; stroke: string } }>({});

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const newColorMap: { [key: number]: { fill: string; stroke: string } } = {};
        report.vessels.flatMap(v => v.segments).forEach(segmentData => {
            let fillColor: string;

            if (mode === 'Stenosis') {
                const colorVar = getStenosisColor(segmentData.stenosis_pct);
                fillColor = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim();
            } else if (mode === 'FFRct') {
                fillColor = getFfrctColor(segmentData.ffrct);
            } else if (mode === 'Composition') {
                const { ncp_mm3, cp_mm3, lrnc_mm3, pav_pct } = segmentData;
                const totalPlaque = lrnc_mm3 + ncp_mm3 + cp_mm3;
                let colorVar: string;
                switch(compositionSubMode) {
                    case 'LRNC_Volume': colorVar = getLrncVolumeColor(lrnc_mm3); break;
                    case 'NCP_Volume': colorVar = getNcpVolumeColor(ncp_mm3); break;
                    case 'CP_Volume': colorVar = getCpVolumeColor(cp_mm3); break;
                    case 'TPV': colorVar = getTpvColor(totalPlaque); break;
                    case 'PAV': colorVar = getPavColor(pav_pct); break;
                    default: colorVar = getCompositionColor(ncp_mm3, cp_mm3); break;
                }
                fillColor = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim();
            } else {
                 const colorVar = '--risk-dark-green';
                 fillColor = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim();
            }
            
            const strokeColor = darkenColor(fillColor, 25); // Make it 25% darker
            
            newColorMap[segmentData.segId] = { fill: fillColor, stroke: strokeColor };
        });
        setColorMap(newColorMap);

    }, [report, mode, compositionSubMode]);

    return (
        <div onMouseLeave={onSegmentLeave}>
            <AnatomyDiagramComponent 
                colorMap={colorMap}
                onSegmentHover={onSegmentHover}
                onSegmentLeave={onSegmentLeave}
            />
        </div>
    );
};

export const SCCT18_SVG = memo(SCCT18_SVG_Component);