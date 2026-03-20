import * as React from 'react';
import {
  Card as SharedCard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { cn } from '@/shared/lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return <SharedCard className={className} {...props} />;
}

export interface MetaProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
}

function Meta({ className, title, description, children, ...props }: MetaProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      {title || description ? (
        <CardHeader className="p-0">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      {children ? <CardContent className="p-0">{children}</CardContent> : null}
    </div>
  );
}

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {}

function Grid({ className, ...props }: GridProps) {
  return <div className={cn('grid gap-4', className)} {...props} />;
}

export { Meta, Grid };
