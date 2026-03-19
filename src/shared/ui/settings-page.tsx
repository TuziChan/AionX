import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const settingsPageStackVariants = cva('flex w-full flex-col', {
  variants: {
    gap: {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-5',
    },
  },
  defaultVariants: {
    gap: 'md',
  },
});

const settingsCardVariants = cva(
  'rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-white shadow-none dark:border-white/8 dark:bg-slate-900',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-4 md:p-5',
        md: 'p-5 md:p-6',
        lg: 'p-6 md:p-7',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

type SettingsPageProps = React.HTMLAttributes<HTMLDivElement>;

const SettingsPage = React.forwardRef<HTMLDivElement, SettingsPageProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('settings-page-shell settings-panel', className)} {...props} />
));
SettingsPage.displayName = 'SettingsPage';

interface SettingsPageStackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof settingsPageStackVariants> {}

const SettingsPageStack = React.forwardRef<HTMLDivElement, SettingsPageStackProps>(
  ({ className, gap, ...props }, ref) => (
    <div ref={ref} className={cn(settingsPageStackVariants({ gap }), className)} {...props} />
  )
);
SettingsPageStack.displayName = 'SettingsPageStack';

type SettingsCardProps = React.HTMLAttributes<HTMLElement> & VariantProps<typeof settingsCardVariants>;

const SettingsCard = React.forwardRef<HTMLElement, SettingsCardProps>(
  ({ className, padding, ...props }, ref) => (
    <section ref={ref} className={cn(settingsCardVariants({ padding }), className)} {...props} />
  )
);
SettingsCard.displayName = 'SettingsCard';

const SettingsCardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col', className)} {...props} />
  )
);
SettingsCardBody.displayName = 'SettingsCardBody';

export { SettingsCard, SettingsCardBody, SettingsPage, SettingsPageStack };
