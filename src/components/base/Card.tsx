import { Card as ArcoCard, CardProps as ArcoCardProps } from '@arco-design/web-react';

export interface CardProps extends ArcoCardProps {}

export function Card(props: CardProps) {
  return <ArcoCard {...props} />;
}

export const { Meta, Grid } = ArcoCard;
