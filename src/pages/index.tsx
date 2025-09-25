import { SummaryHeader } from "@/components/SummaryHeader";
import { VesselCard } from "@/components/VesselCard";
import { SegmentMap, Scoreboard } from "@/components/SegmentMap";
import { SegmentBarChart } from "@/components/SegmentBarChart";
import { SerialComparisonChart } from "@/components/SerialComparisonChart";
import type { CctaReport, Vessel, VesselId } from "@/types/ccta";
import reportData from '@/data/sample-serial.json';

const report: CctaReport = reportData as CctaReport;

export default function HomePage() {
  // Synthesize "Whole Heart" data for the new summary card
  const wholeHeartData: Vessel = {
    id: 'WHOLE_HEART',
    length_mm: report.vessels.reduce((sum, v) => sum + v.length_mm, 0),
    tpv_mm3: report.global.tpv_mm3,
    pav_pct: report.global.pav_pct,
    lap_pct: report.global.lap_pct,
    ri_max: Math.max(...report.vessels.map(v => v.ri_max || 0)),
    composition: {
      lrnc_mm3: report.vessels.reduce((sum, v) => sum + v.composition.lrnc_mm3, 0),
      ncp_mm3: report.vessels.reduce((sum, v) => sum + v.composition.ncp_mm3, 0),
      cp_mm3: report.vessels.reduce((sum, v) => sum + v.composition.cp_mm3, 0),
    },
    segments: [], // Not needed for summary card
  };

  // Manually define the desired order and sort the vessels array
  const desiredOrder: VesselId[] = ['LM_LAD', 'LCx', 'RCA'];
  const sortedVessels = [...report.vessels].sort((a, b) => desiredOrder.indexOf(a.id) - desiredOrder.indexOf(b.id));

  const orderedVessels = [wholeHeartData, ...sortedVessels];

  return (
    <main style={{ padding: '16px', maxWidth: '1600px', margin: '0 auto' }}>
      <SummaryHeader report={report} />

      {/* NEW: Horizontal header section for cards and scoreboard */}
      <header style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'stretch', marginBottom: '16px' }}>
        {orderedVessels.map((vessel, index) => (
          <VesselCard key={vessel.id} vessel={vessel} isProminent={index === 0} />
        ))}
        <Scoreboard report={report} />
      </header>

      {/* Main content area */}
      <section>
        <SegmentMap report={report} />
        <SegmentBarChart report={report} />
        <SerialComparisonChart report={report} />
      </section>
    </main>
  );
}