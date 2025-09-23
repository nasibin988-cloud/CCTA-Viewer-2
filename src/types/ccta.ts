export type Dominance = "Right" | "Left" | "Co";
export type QualityFlag = "motion" | "blooming" | "stent" | "heavyCa" | "limitedCoverage";
export type HRPFeature = "LAP" | "PR" | "SC" | "NRS";
export type VesselId = "RCA" | "LM_LAD" | "LCx";

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
  hrp_count: number;
  sis: number;
  cac_agatston?: number;
}

export interface Segment {
  segId: number;
  name: string;
  length_mm: number;
  stenosis_pct: number;
  ri: number;
  hrp: HRPFeature[];
  lrnc_mm3: number;
  ncp_mm3: number;
  cp_mm3: number;
  pav_pct: number;
  lap_pct: number;
  ffrct?: number;
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
export type PlaqueVolumeMode = "LRNC_Volume" | "NCP_Volume" | "CP_Volume";

export type MapMode = "Stenosis" | "HRP" | "Composition" | "Burden"; // Composition will now be the parent mode