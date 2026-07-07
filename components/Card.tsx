import React from 'react';

export function Card({ children, className = '', style }: React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>) {
  return <div className={`rounded-[22px] border border-border bg-panel shadow-glow ${className}`} style={style}>{children}</div>;
}
