import React from 'react';

export function Button({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 ${className}`}
    >
      {children}
    </button>
  );
}
