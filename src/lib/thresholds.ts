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

// FFRct Coloring - Lower values are worse
export const getFfrctColor = (ffrct: number | undefined): RiskColorVar => {
  if (ffrct === undefined || ffrct > 0.85) return '--risk-dark-green';
  if (ffrct > 0.80) return '--risk-green';
  if (ffrct > 0.75) return '--risk-yellow';
  if (ffrct > 0.70) return '--risk-orange';
  return '--risk-red';
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