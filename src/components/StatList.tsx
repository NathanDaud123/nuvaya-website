import React from 'react';

/** Satu baris "Label : Nilai" — titik dua selalu di kolom sendiri agar sejajar vertikal */
export const StatRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <li>
    <strong>{label}</strong>
    <span aria-hidden="true">:</span>
    <span>{children}</span>
  </li>
);

export const StatList: React.FC<{ children: React.ReactNode; labelWidth?: string }> = ({
  children,
  labelWidth,
}) => (
  <ul
    className="stat-list"
    style={labelWidth ? ({ '--stat-label-w': labelWidth } as React.CSSProperties) : undefined}
  >
    {children}
  </ul>
);
