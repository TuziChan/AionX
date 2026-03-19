import { cn } from '@/shared/lib/cn';

interface AppLogoMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses: Record<NonNullable<AppLogoMarkProps['size']>, string> = {
  sm: 'size-9 rounded-2xl',
  md: 'size-11 rounded-[18px]',
  lg: 'size-14 rounded-[22px]',
};

export function AppLogoMark({ size = 'md', className }: AppLogoMarkProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-[linear-gradient(160deg,#0f172a_0%,#1d4ed8_54%,#38bdf8_100%)] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),0_10px_24px_rgba(37,99,235,0.18)]',
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 80 80" className={cn(size === 'lg' ? 'size-8' : 'size-5')} fill="none">
        <path
          d="M40 20Q38 22 25 40Q23 42 26 42H30Q32 40 40 30Q48 40 50 42H54Q57 42 55 40Q42 22 40 20Z"
          fill="currentColor"
        />
        <circle cx="40" cy="46" r="3" fill="currentColor" />
        <path d="M18 50Q40 70 62 50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
