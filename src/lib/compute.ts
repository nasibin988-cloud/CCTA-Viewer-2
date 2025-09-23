// src/lib/compute.ts

// This function remains the same as it correctly calculates the 0-3 stage for PAV
export function pavStage(pav_pct: number): 0 | 1 | 2 | 3 {
  if (pav_pct === 0) return 0;
  if (pav_pct > 0 && pav_pct <= 5) return 1;
  if (pav_pct > 5 && pav_pct <= 15) return 2;
  return 3; // > 15
}

// NEW: This function calculates the final stage based on the highest of TPV and PAV
export function getAtherosclerosisStage(tpv_mm3: number, pav_pct: number): 0 | 1 | 2 | 3 {
    // Determine stage based on TPV from the provided chart
    let tpvStage: 0 | 1 | 2 | 3;
    if (tpv_mm3 === 0) tpvStage = 0;
    else if (tpv_mm3 <= 250) tpvStage = 1;
    else if (tpv_mm3 <= 750) tpvStage = 2;
    else tpvStage = 3;

    // Determine stage based on PAV using the existing function
    const pavS = pavStage(pav_pct);

    // The final stage is the higher of the two individual stages
    return Math.max(tpvStage, pavS) as 0 | 1 | 2 | 3;
}

export function formatNumber(value: number | null | undefined, decimals: number = 1): string {
    if (value == null) return "—";
    return value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}