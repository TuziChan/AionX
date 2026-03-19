import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface FormPageFrameProps {
  children: ReactNode;
  pageClassName?: string;
  contentClassName?: string;
}

export function FormPageFrame({ children, pageClassName, contentClassName }: FormPageFrameProps) {
  return (
    <div
      className={cn(
        'relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#d7e3f7_0%,#b6c4df_30%,#7a8bab_70%,#1f2937_100%)]',
        'dark:bg-[linear-gradient(160deg,#0b1120_0%,#0f172a_34%,#172554_68%,#020617_100%)]',
        pageClassName
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.24),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.26),transparent_26%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[-8rem] top-[-6rem] size-[22rem] rounded-full bg-white/18 blur-3xl dark:bg-sky-400/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-10rem] right-[-8rem] size-[24rem] rounded-full bg-slate-950/12 blur-3xl dark:bg-blue-500/10"
        aria-hidden="true"
      />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className={cn('w-full max-w-[var(--page-width-form)]', contentClassName)}>{children}</div>
      </div>
    </div>
  );
}
