// src/pages/index.tsx

import { SummaryHeader } from "@/components/SummaryHeader";
import { VesselCard } from "@/components/VesselCard";
import { SegmentMap } from "@/components/SegmentMap";
import { SegmentBarChart } from "@/components/SegmentBarChart";
import { SerialComparisonChart } from "@/components/SerialComparisonChart"; // 1. IMPORT new component
import type { CctaReport } from "@/types/ccta";
import reportData from '@/data/sample-serial.json'; // 2. USE new data file

const report: CctaReport = reportData as CctaReport;

const orderedVesselIds: CctaReport['vessels'][0]['id'][] = ["RCA", "LM_LAD", "LCx"];
const orderedVessels = orderedVesselIds
  .map(id => report.vessels.find(v => v.id === id))
  .filter(Boolean);

export default function HomePage() {
  return (
    <main style={{ padding: '16px', maxWidth: '1440px', margin: '0 auto' }}>
      <SummaryHeader report={report} />
      
      <section style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        {orderedVessels.map(vessel => (
          vessel ? <VesselCard key={vessel.id} vessel={vessel} /> : null
        ))}
      </section>

      <SegmentMap report={report} />
      <SegmentBarChart report={report} />

      {/* 3. ADD the new component at the bottom */}
      <SerialComparisonChart report={report} />
      
    </main>
  );
}