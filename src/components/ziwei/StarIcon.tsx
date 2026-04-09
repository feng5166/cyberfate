import { STAR_COLORS } from './types';

interface StarIconProps {
  starName: string;
  size?: number;
  className?: string;
}

export function StarIcon({ starName, size = 8, className = '' }: StarIconProps) {
  const color = STAR_COLORS[starName] || '#9CA3AF';

  return (
    <span
      className={`inline-block rounded-full shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
      aria-label={`${starName}标识`}
    />
  );
}
