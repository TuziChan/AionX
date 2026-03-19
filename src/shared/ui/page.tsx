import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/shared/lib/cn';

const pageSectionVariants = cva(
  'rounded-[var(--radius-xl)] border border-border/70 bg-card/80 text-card-foreground shadow-sm backdrop-blur-sm',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-4 md:p-5',
        md: 'p-5 md:p-6',
        lg: 'p-6 md:p-7',
      },
      tone: {
        default: '',
        muted: 'bg-muted/40',
        elevated: 'shadow-[var(--shadow-md)]',
      },
    },
    defaultVariants: {
      padding: 'lg',
      tone: 'default',
    },
  }
);

const pageGridVariants = cva('grid gap-4', {
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 xl:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    },
  },
  defaultVariants: {
    columns: 1,
  },
});

type PageSectionProps = React.HTMLAttributes<HTMLElement> & VariantProps<typeof pageSectionVariants>;

const PageSection = React.forwardRef<HTMLElement, PageSectionProps>(
  ({ className, padding, tone, ...props }, ref) => (
    <section ref={ref} className={cn(pageSectionVariants({ padding, tone }), className)} {...props} />
  )
);
PageSection.displayName = 'PageSection';

const PageSectionHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props} />
);
PageSectionHeader.displayName = 'PageSectionHeader';

const PageSectionTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h2 ref={ref} className={cn('text-lg font-semibold tracking-tight', className)} {...props} />
);
PageSectionTitle.displayName = 'PageSectionTitle';

const PageSectionDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />
);
PageSectionDescription.displayName = 'PageSectionDescription';

const PageSectionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('mt-5', className)} {...props} />
);
PageSectionContent.displayName = 'PageSectionContent';

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  align?: 'start' | 'center';
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  metaClassName?: string;
  actionsClassName?: string;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      className,
      eyebrow,
      title,
      description,
      actions,
      align = 'start',
      eyebrowClassName,
      titleClassName,
      descriptionClassName,
      metaClassName,
      actionsClassName,
      ...props
    },
    ref
  ) => {
    const centered = align === 'center';

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-4',
          !centered && actions ? 'md:flex-row md:items-end md:justify-between' : null,
          centered ? 'items-center text-center' : null,
          className
        )}
        {...props}
      >
        <div className={cn('flex min-w-0 flex-col gap-2', centered ? 'items-center text-center' : 'items-start text-left', metaClassName)}>
          {eyebrow ? (
            <p className={cn('text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground', eyebrowClassName)}>{eyebrow}</p>
          ) : null}
          <div className="space-y-2">
            <h1 className={cn('text-3xl font-semibold tracking-tight text-foreground md:text-4xl', titleClassName)}>{title}</h1>
            {description ? (
              <p className={cn('max-w-3xl text-sm leading-7 text-muted-foreground md:text-[15px]', descriptionClassName)}>{description}</p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className={cn('flex flex-wrap items-center gap-3', centered ? 'justify-center' : 'md:justify-end', actionsClassName)}>
            {actions}
          </div>
        ) : null}
      </div>
    );
  }
);
PageHeader.displayName = 'PageHeader';

type PageHeroProps = PageHeaderProps;

const PageHero = React.forwardRef<HTMLDivElement, PageHeroProps>((props, ref) => <PageHeader ref={ref} {...props} />);
PageHero.displayName = 'PageHero';

interface PageGridProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof pageGridVariants> {}

const PageGrid = React.forwardRef<HTMLDivElement, PageGridProps>(({ className, columns, ...props }, ref) => (
  <div ref={ref} className={cn(pageGridVariants({ columns }), className)} {...props} />
));
PageGrid.displayName = 'PageGrid';

export {
  PageGrid,
  PageHeader,
  PageHero,
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionHeader,
  PageSectionTitle,
};
