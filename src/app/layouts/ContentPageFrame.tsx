import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export type ContentPageWidth = 'form' | 'content' | 'wide' | 'full';

const widthClassMap: Record<ContentPageWidth, string> = {
  form: 'max-w-[var(--page-width-form)]',
  content: 'max-w-[var(--page-width-content)]',
  wide: 'max-w-[var(--page-width-wide)]',
  full: 'max-w-none',
};

interface ContentPageFrameProps {
  children: ReactNode;
  width?: ContentPageWidth;
  pageClassName?: string;
  contentClassName?: string;
}

export function ContentPageFrame({
  children,
  width = 'wide',
  pageClassName,
  contentClassName,
}: ContentPageFrameProps) {
  return (
    <div className={cn('size-full overflow-y-auto', pageClassName)}>
      <div
        className={cn(
          'mx-auto flex w-full flex-col gap-6 px-4 py-5 md:px-6 md:py-7',
          widthClassMap[width],
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
