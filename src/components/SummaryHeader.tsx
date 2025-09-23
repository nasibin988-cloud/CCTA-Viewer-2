// src/components/SummaryHeader.tsx

import React from 'react';
import { CctaReport } from '../types/ccta';

interface Props {
  report: CctaReport;
}

export const SummaryHeader: React.FC<Props> = ({ report }) => {
  const patient = report.patient;
  const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();

  return (
    <header style={{ padding: 'calc(2 * var(--space-unit))', borderBottom: '1px solid var(--line)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-h1)', margin: 0 }}>{patient.name}</h1>
        {/* UPDATED: Wrapped in a flex container */}
        <div style={{ 
            margin: '4px 0 0 0', 
            color: 'var(--muted-ink)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
          <span>{age}{patient.sex} | MRN: {patient.mrn}</span>
          <span>Date of Study: {patient.studyDate}</span>
        </div>
      </div>
    </header>
  );
};