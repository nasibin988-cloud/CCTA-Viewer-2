// src/types/ccta.ts

export type Dominance = "Right" | "Left" | "Co";
export type QualityFlag = "motion" | "blooming" | "stent" | "heavyCa" | "limitedCoverage";
export type HRPFeature = "LAP" | "PR" | "SC" | "NRS";
export type VesselId = "RCA" | "LM_LAD" | "LCx" | "WHOLE_HEART";

export interface Patient {
  name: string;
  mrn: string;
  dob: string;
  sex: "M" | "F" | "X";
  studyDate: string;
  scanner: string;
  dominance: Dominance;
  notes?: string;
}

export interface Study {
  id: string;
  qualityFlags?: QualityFlag[];
  ffrctLowest?: number;
  pcat_fai?: { [key in VesselId]?: number };
  eAT_volume_ml?: number;
}

export interface GlobalMetrics {
  tpv_mm3: number;
  pav_pct: number;
  lap_pct: number;
  sis: number;
  cac_agatston?: number;
}

export interface Segment {
  segId: number;
  name: string;
  length_mm: number;
  plaque_length_mm: number; // This line was added
  stenosis_pct: number;
  ri: number;
  ffrct?: number;
  ffrct_pullback?: number[];
  lrnc_mm3: number;
  ncp_mm3: number;
  cp_mm3: number;
  pav_pct: number;
  lap_pct: number;
}

export interface Vessel {
  id: VesselId;
  length_mm: number;
  tpv_mm3: number;
  pav_pct: number;
  lap_pct: number;
  ri_max: number;
  composition: {
    lrnc_mm3: number;
    ncp_mm3: number;
    cp_mm3: number;
  };
  segments: Segment[];
}

export interface CctaReport {
  patient: Patient;
  study: Study;
  global: GlobalMetrics;
  vessels: Vessel[];
  priorStudy?: Omit<CctaReport, 'priorStudy'>;
}

export type PlaqueVolumeMode = "LRNC_Volume" | "NCP_Volume" | "CP_Volume" | "TPV" | "PAV";

export type MapMode = "Stenosis" | "FFRct" | "Composition" | "Lesions" | "Interactive" | "Systems";