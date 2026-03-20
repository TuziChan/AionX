import * as React from 'react';
import { cn } from '@/shared/lib/cn';

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {}

export function List({ className, ...props }: ListProps) {
  return <ul className={cn('m-0 list-none p-0', className)} {...props} />;
}

export interface ItemProps extends React.LiHTMLAttributes<HTMLLIElement> {}

export function Item({ className, ...props }: ItemProps) {
  return <li className={cn('m-0', className)} {...props} />;
}
