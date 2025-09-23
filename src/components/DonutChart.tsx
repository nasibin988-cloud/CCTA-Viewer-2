import React from 'react';
import { getPavColor } from '@/lib/thresholds';
import { formatNumber } from '@/lib/compute';

interface Props {
  pav: number;
  size?: number;
  strokeWidth?: number;
}

export const DonutChart: React.FC<Props> = ({ pav, size = 80, strokeWidth = 10 }) => {
  const colorVar = getPavColor(pav);
  const color = `var(${colorVar})`;

  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pav / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: 'auto', flexShrink: 0 }}>
        <div style={{ fontSize: 'var(--text-small)', textAlign: 'center', marginBottom: '4px', color: 'var(--muted-ink)' }}>PAV</div>
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Background Gray Circle */}
                <circle
                    stroke="var(--line)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={center}
                    cy={center}
                />
                {/* Colored PAV Ring */}
                {pav > 0 && (
                    <circle
                        stroke={color}
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        r={radius}
                        cx={center}
                        cy={center}
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset,
                            transform: 'rotate(-90deg)',
                            transformOrigin: 'center',
                            transition: 'stroke-dashoffset 0.3s ease',
                        }}
                    />
                )}
            </svg>
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 600,
            }}>
                {formatNumber(pav, 1)}%
            </div>
        </div>
    </div>
  );
};