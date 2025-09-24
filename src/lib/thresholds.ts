// src/lib/thresholds.ts

export type RiskColorVar = '--risk-dark-green' | '--risk-green' | '--risk-yellow' | '--risk-orange' | '--risk-red' | '--risk-neutral-gray';
export type CompositionColorVar = '--ncp-color' | '--cp-color' | '--lrb-color' | '--risk-neutral-gray';

// Stenosis Percentage Coloring
export const getStenosisColor = (pct: number): RiskColorVar => {
  if (pct === 0) return '--risk-dark-green';
  if (pct < 25) return '--risk-green';
  if (pct < 50) return '--risk-yellow';
  if (pct < 70) return '--risk-orange';
  return '--risk-red';
};

// NEW: FFRct Coloring from a continuous 51-color spectrum
export const getFfrctColor = (ffrct: number | undefined): string => {
    if (ffrct === undefined) return '#808080'; // Return a neutral gray for undefined values

    const ffrctSpectrum: string[] = [
        '#D90429', '#DA0E28', '#DC1827', '#DE2226', '#DF2C25', '#E13624', '#E34023', 
        '#E44A22', '#E65421', '#E85E20', '#E9681F', '#EB721E', '#ED7C1D', '#EE861C', 
        '#F0901B', '#F29A1A', '#F3A419', '#F5AE18', '#F7B817', '#F8C216', '#FACD15', 
        '#FCD714', '#FDE113', '#FFEB12', '#FDF30E', '#ECF60C', '#D8F80B', '#C5FA09', 
        '#B1FC08', '#9EFE06', '#8AFF05', '#77FF03', '#63FF02', '#50FE01', '#3CFD00', 
        '#30F81A', '#24F333', '#18EE4D', '#0CE966', '#00E580', '#00E099', '#00DBB3', 
        '#00D7CD', '#00D2E6', '#00CEFF', '#00C2FF', '#00B6FF', '#00ABFF', '#00A0FF', 
        '#0095FF', '#008AFF'
    ];

    // Normalize ffrct from [0.5, 1.0] to an index from 0 to 50
    const minFfrct = 0.50;
    const maxFfrct = 1.00;
    const normalized = Math.max(0, Math.min(1, (ffrct - minFfrct) / (maxFfrct - minFfrct)));
    const index = Math.round(normalized * (ffrctSpectrum.length - 1));
    
    return ffrctSpectrum[index];
};


// Dominant Plaque Composition Coloring
export const getCompositionColor = (ncp: number, cp: number): CompositionColorVar => {
  if (ncp === 0 && cp === 0) return '--risk-neutral-gray';
  return ncp >= cp ? '--ncp-color' : '--cp-color';
};

// Low-Density Non-Calcified Plaque (LRNC) Volume Coloring
export const getLrncVolumeColor = (volume: number): RiskColorVar => {
    if (volume === 0) return '--risk-dark-green';
    if (volume < 5) return '--risk-green';
    if (volume < 15) return '--risk-yellow';
    if (volume < 30) return '--risk-orange';
    return '--risk-red';
};

// Non-Calcified Plaque (NCP) Volume Coloring
export const getNcpVolumeColor = (volume: number): RiskColorVar => {
    if (volume === 0) return '--risk-dark-green';
    if (volume < 20) return '--risk-green';
    if (volume < 50) return '--risk-yellow';
    if (volume < 100) return '--risk-orange';
    return '--risk-red';
};

// Calcified Plaque (CP) Volume Coloring
export const getCpVolumeColor = (volume: number): RiskColorVar => {
    if (volume === 0) return '--risk-dark-green';
    if (volume < 50) return '--risk-green';
    if (volume < 150) return '--risk-yellow';
    if (volume < 300) return '--risk-orange';
    return '--risk-red';
};

// Total Plaque Volume (TPV) Coloring for individual segments
export const getTpvColor = (volume: number): RiskColorVar => {
    if (volume === 0) return '--risk-dark-green';
    if (volume < 30) return '--risk-green';
    if (volume < 75) return '--risk-yellow';
    if (volume < 150) return '--risk-orange';
    return '--risk-red';
};

// NEW: Global Total Plaque Volume (TPV) Coloring for Whole Heart card
export const getGlobalTpvColor = (volume: number): RiskColorVar => {
    if (volume === 0) return '--risk-dark-green';
    if (volume <= 250) return '--risk-green';
    if (volume <= 750) return '--risk-orange';
    return '--risk-red';
};

// Percent Atheroma Volume (PAV) Coloring
export const getPavColor = (pct: number): RiskColorVar => {
  if (pct === 0) return '--risk-dark-green';
  if (pct > 0 && pct <= 5) return '--risk-green';
  if (pct > 5 && pct <= 15) return '--risk-orange';
  return '--risk-red';
};