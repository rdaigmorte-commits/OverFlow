type Props = {
  shape: 'circle' | 'cross' | 'triangle' | 'square';
  color: string;
  size?: number;
};

// Motif ○ ✕ △ □ de la landing, réutilisé comme iconographie (classes RPG, raisons de match).
export function ShapeIcon({ shape, color, size = 20 }: Props) {
  const stroke = Math.max(3, Math.round(size / 4.4));

  if (shape === 'circle') {
    return <span className="inline-block rounded-full" style={{ height: size * 0.7, width: size * 0.7, border: `${stroke}px solid ${color}` }} />;
  }
  if (shape === 'square') {
    return <span className="inline-block rounded-[5px]" style={{ height: size * 0.65, width: size * 0.65, border: `${stroke}px solid ${color}` }} />;
  }
  if (shape === 'triangle') {
    return (
      <svg width={size} height={size * 0.9} viewBox="0 0 24 22">
        <polygon points="12,3 22,19 2,19" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <line x1="5" y1="5" x2="19" y2="19" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <line x1="19" y1="5" x2="5" y2="19" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
}
