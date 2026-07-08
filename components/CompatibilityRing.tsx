'use client';
import { useEffect, useState } from 'react';
import { TIER_STYLE, type FitTier } from '@/lib/rpgClass';

type Props = {
  percent: number;
  tier: FitTier;
  size?: number;
};

export function CompatibilityRing({ percent, tier, size = 60 }: Props) {
  const style = TIER_STYLE[tier];
  // Trait et texte proportionnels à la taille — évite que le % déborde du ring sur les petits formats (liste compacte).
  const stroke = Math.max(3, Math.round(size / 9));
  const fontSize = Math.max(9, Math.round(size * 0.28));
  const r = size / 2 - stroke;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));

  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 30);
    return () => clearTimeout(t);
  }, []);

  const offset = circumference * (1 - (animated ? clamped : 0) / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-label={`${clamped}% compatible`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={style.track} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={style.ring} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)' }}
      />
      <text
        x={size / 2} y={size / 2 + fontSize / 3} textAnchor="middle"
        fontSize={fontSize} fontWeight={700} fill="#1B1B23"
        style={{ fontFamily: 'var(--font-fredoka)' }}
      >
        {clamped}%
      </text>
    </svg>
  );
}
