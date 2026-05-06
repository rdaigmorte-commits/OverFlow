import React from 'react';

export function Card({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`rounded-2xl border border-border bg-panel shadow-glow ${className}`}>{children}</div>;
}
